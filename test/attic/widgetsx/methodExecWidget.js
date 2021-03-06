/*global define*/
/*jslint white:true,browser:true*/

define([
    'uuid',
    '../props',
    '../utils',
    '../jobs',
    '../dom',
    '../runtime',
    '../events',
    'kb_common/format',
    'kb_common/html',
    'kb_service/client/workspace'
], function (Uuid, Props, utils, Jobs, Dom, Runtime, Events, format, html, Workspace) {
    'use strict';

    var t = html.tag,
        div = t('div'), span = t('span'), form = t('form'),
        table = t('table'), tr = t('tr'), td = t('td'), th = t('th'),
        textarea = t('textarea'),
        ul = t('ul'), li = t('li');

    function factory(config) {
        var api,
            runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus(),
            parentBus = config.bus,
            container,
            listeners = [],
            model,
            dom,
            toggles = [
                {
                    name: 'job-details',
                    label: 'Details',
                    initialValue: false
                },
                {
                    name: 'job-log',
                    label: 'Log',
                    initialValue: false
                },
                {
                    name: 'job-report',
                    label: 'Job Report',
                    initialValue: false
                },
                {
                    name: 'job-result',
                    label: 'Job Result',
                    initialValue: false
                }
            ];

        // Sugar

        function on(event, handler) {
            listeners.push(parentBus.on(event, handler));
        }


        // RENDER


        // VIEW BUILDING

        function renderJobReport() {
            return dom.buildPanel({
                title: 'Job Report',
                name: 'job-report',
                hidden: false,
                type: 'primary',
                body: table({class: 'table table-striped'}, [
                    tr([th('Objects Created'), td({dataElement: 'objects-created'})]),
                    tr([th('Message'), td({dataElement: 'message'})]),
                    tr([th('Warnings'), td({dataElement: 'warnings'})])
                ])
            });
        }

        function renderJobResult() {
            return dom.buildPanel({
                title: 'Job Result',
                name: 'job-result',
                hidden: false,
                type: 'primary',
                body: div({style: {fontFamily: 'monospace', whiteSpace: 'pre'}, dataElement: 'content'})
            });
        }

       function renderJobError() {
            return dom.buildPanel({
                title: 'Job Error',
                name: 'run-error',
                hidden: false,
                type: 'primary',
                body: [
                    table({class: 'table table-striped', style: {tableLayout: 'fixed'}}, [
                        tr([th({style: {width: '15%'}}, 'Error in'), td({dataElement: 'location', style: {width: '85%'}})]),
                        tr([th('Type'), td({dataElement: 'type'})]),
                        tr([th('Message'), td({dataElement: 'message'})]),
                        tr([th('Detail'), td([div({dataElement: 'detail', style: {overflowX: 'scroll', whiteSpace: 'pre'}})])])
                    ])
                ]
            });
        }

        function renderJobLog() {
            return dom.buildPanel({
                title: 'Job Log',
                name: 'job-log',
                hidden: false,
                type: 'primary',
                body: [
                    textarea({class: 'form-control', dataElement: 'logs'})
                ]
            });
        }

        function renderJobStatus() {
            return dom.buildPanel({
                title: 'Run Status',
                name: 'runStatus',
                hidden: false,
                type: 'primary',
                body: [
                    div({style: {lineHeight: '20px'}}, [
                        span({}, [
                            span('State:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'state'
                            })
                        ]),
                        span({style: {marginLeft: '5px'}}, [
                            span('Last update:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'last-updated-at'
                            })
                        ]),
                        span({style: {marginLeft: '5px'}}, [
                            span('Phase:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'temporalState'
                            })
                        ]),
                        span({style: {marginLeft: '5px'}}, [
                            span('Exec:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'executionState'
                            })
                        ]),
                        span({dataElement: 'launch-time', style: {marginLeft: '5px'}}, [
                            span({dataElement: 'label'}),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF', fontFamily: 'monospace'},
                                dataElement: 'elapsed'
                            })
                        ]),
                        span({dataElement: 'queue-time', style: {marginLeft: '5px'}}, [
                            span({dataElement: 'label'}),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF', fontFamily: 'monospace'},
                                dataElement: 'elapsed'
                            })
                        ]),
                        span({dataElement: 'run-time', style: {marginLeft: '5px'}}, [
                            span({dataElement: 'label'}),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF', fontFamily: 'monospace'},
                                dataElement: 'elapsed'
                            })
                        ]),
                        span({dataElement: 'completed', style: {marginLeft: '5px'}}, [
                            span('Completed:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'completedAt'
                            })
                        ]),
                        span({dataElement: 'success', style: {marginLeft: '5px'}}, [
                            span('Success:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'flag'
                            })
                        ]),
                        span({dataElement: 'error', style: {marginLeft: '5px'}}, [
                            span('Error:'),
                            span({
                                style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                                dataElement: 'flag'
                            })
                        ])
                    ]),
//                    div({dataElement: 'error-group'}, [
//                        dom.buildPanel({
//                            title: 'Error',
//                            name: 'error',
//                            hidden: false,
//                            type: 'danger',
//                            body: [
//                                div({dataElement: 'title'}),
//                                div({dataElement: 'message'})
//                            ]
//                        })
//                    ])
                ]
            });
        }

        function renderJobDetails() {
            return dom.buildPanel({
                title: 'Job Details',
                name: 'job-details',
                hidden: false,
                type: 'primary',
                body: [
                    table({class: 'table table-striped'}, [
                        tr([th('Job Id'), td({dataElement: 'id'})]),
                        tr([th('Status'), td({dataElement: 'status'})]),
                        tr([th('Deleted?'), td({dataElement: 'deleted'})]),
                        tr([th('Submitted'), td({dataElement: 'submitted'})]),
                        tr([th('Started'), td({dataElement: 'started'})]),
                        tr([th('Completed'), td({dataElement: 'completed'})])
                    ])
                ]
            });
        }

        // VIEW UPDATERS


        function showJobDetails() {
            //if (showToggleElement('job-details')) {
                var details = model.getItem('jobDetails');
                if (details) {
                    Object.keys(details).forEach(function (key) {
                        var value = details[key],
                            el = dom.getElement(['job-details', key]);
                        if (el) {
                            el.innerHTML = value || '';
                        }
                    });
                }
            // }
        }

        function showJobReport() {
            var report = model.getItem('jobReport'),
                objectsCreated, warnings;
            if (!report) {
                return;
            }

            if (report.objects_created.length === 0) {
                objectsCreated = 'no objects created';
            } else {
                objectsCreated = ul(report.objects_created.map(function (object) {
                    return li(object);
                }).join('\n'));
            }
            dom.getElement(['job-report', 'objects-created']).innerHTML = objectsCreated;

            dom.getElement(['job-report', 'message']).innerHTML = report.text_message || ' no message';

            if (report.warnings.length === 0) {
                warnings = 'no warnings';
            } else {
                warnings = ul(report.warnings.map(function (object) {
                    return li(object);
                }).join('\n'));
            }
            dom.getElement(['job-report', 'warnings']).innerHTML = warnings;
        }
        
        function showJobResult() {
            var result = model.getItem('runState.success.result');
            if (!result) {
                return;
            }
            
            // Just spit out json ...
            var content = JSON.stringify(result, null, 2);
            dom.setContent('job-result.content', content);
        }

        function showJobError() {
            var error = model.getItem('runState.error.message'),
                node = dom.getElement(['run-error', 'message']);

            if (error) {
                node.innerHTML = error;
            }
        }



        function render() {
            var events = Events.make({node: container}),
                content = div([
                    dom.buildPanel({
                        title: 'Options',
                        type: 'default',
                        body: [
                            dom.makeButton('Show Details', 'toggle-job-details', {events: events}),
                            dom.makeButton('Show Report', 'toggle-job-report', {events: events}),
                            dom.makeButton('Show Result', 'toggle-job-result', {events: events}),
                            dom.makeButton('Show Log', 'toggle-job-log', {events: events})
                        ]
                    }),
                    renderJobStatus(),
                    renderJobError(),
                    renderJobReport(),
                    renderJobResult(),
                    renderJobDetails(),
                    renderJobLog()
                ]);

            container.innerHTML = content;
            events.attachEvents();
        }


        // DATA FETCH


        // TODO: corral in the async requests! We don't want them to overlap, 
        // that's for sure.
        function updateJobLog(data) {
            Jobs.getLogData(data.jobId, 0)
                .then(function (logLines) {
                    console.log('Got log lines!', logLines.length, logLines);
                })
                .catch(function (err) {
                    console.error('Error getting log lines', err);
                    dom.dom.getElement(['job-log', 'logs']).innerHTML = 'ERROR:\n' +
                        err.remoteStacktrace.join('\n');
                });
        }


        // DATA



        // VIEW UPDATE

        /*
         * Okay, the job report is buried in the job state.
         * In the job state is a "step_job_ids" a holdover from the app days
         * In it is one property, which represents the job for this method/app.
         * The key matches the outputs found in the step_outputs property.
         * The value for that the step_outputs property is a string, but it is a 
         * tricky string, for it is a JSON string. We parse that to get the 
         * final project ... the report_ref, which we can use to get the report!
         * 
         */
//        function updateJobReport(job) {
//            /*
//             * If the job has not completed, there will be not outputs, so we 
//             * can just bail.
//             */
//            if (!job.state.step_outputs || Object.keys(job.state.step_outputs).length === 0) {
//                return;
//            }
//
//            var stepJobIds = job.state.step_job_ids,
//                stepKey = Object.keys(stepJobIds)[0],
//                stepOutput = JSON.parse(job.state.step_outputs[stepKey]),
//                reportRef = stepOutput[0].report_ref,
//                workspace = new Workspace(runtime.config('services.workspace.url'), {
//                    token: runtime.authToken()
//                });
//
//            return workspace.get_objects([{
//                    ref: reportRef
//                }])
//                .then(function (result) {
//                    if (!result[0]) {
//                        return;
//                    }
//                    var report = result[0].data;
//                    // Store it in the metadata.
//                    model.setItem('jobReport', JSON.parse(JSON.stringify(report)));
//                })
//                .catch(function (err) {
//                    console.error('Error getting report', err);
//                });
//        }

        function getJobReport(reportRef) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });

            return workspace.get_objects([{
                    ref: reportRef
                }])
                .then(function (result) {
                    if (!result[0]) {
                        return;
                    }
                    var report = result[0].data;
                    // Store it in the metadata.
                    return JSON.parse(JSON.stringify(report));
                })
                .catch(function (err) {
                    console.error('Error getting report', err);
                });
        }
        function updateJobDetails() {
            var jobState = model.getItem('jobState');
            var details = {
                id: jobState.job_id,
                status: jobState.job_state,
                deleted: jobState.is_deleted ? 'yes' : 'no',
                submitted: format.niceTime(new Date(jobState.creation_time)),
                started: format.niceTime(new Date(jobState.exec_start_time)),
                completed: format.niceTime(new Date(jobState.finish_time)),
            };
            model.setItem('jobDetails', details);
        }

        function renderRunState() {
            var state = model.getItem('runState');

            if (!state) {
                return;
            }

            dom.setContent(['runStatus', 'last-updated-at'], utils.formatTime(state.lastUpdatedTime));
            dom.setContent(['runStatus', 'state'], state.canonicalState);
            dom.setContent(['runStatus', 'temporalState'], state.temporalState);
            dom.setContent(['runStatus', 'executionState'], state.executionState);

            if (state.elapsedLaunchTime) {
                (function () {
                    dom.showElement(['runStatus', 'launch-time']);
                    var label;
                    if (state.elapsedLaunchTime) {
                        label = 'Launched';
                    } else {
                        label = 'Launching';
                    }
                    dom.setContent(['runStatus', 'launch-time', 'label'], label);
                    dom.setContent(['runStatus', 'launch-time', 'elapsed'], utils.formatElapsedTime(state.elapsedLaunchTime) || '');
                }());
            } else {
                dom.hideElement(['runStatus', 'launch-time']);
            }

//            if (state.elapsedPreparationTime) {
//                (function () {
//                    dom.showElement(['runStatus', 'preparation-time']);
//                    var label;
//                    if (state.elapsedQueueTime) {
//                        label = 'Prepared';
//                    } else {
//                        label = 'Preparing';
//                    }
//                    dom.setContent(['runStatus', 'preparation-time', 'label'], label);
//                    dom.setContent(['runStatus', 'preparation-time', 'elapsed'], utils.formatElapsedTime(state.elapsedPreparationTime) || '');
//                }());
//            } else {
//                dom.hideElement(['runStatus', 'preparation-time']);
//            }

            if (state.elapsedQueueTime) {
                (function () {
                    dom.showElement(['runStatus', 'queue-time']);
                    var label;
                    if (state.elapsedRunTime) {
                        label = 'Was queued for';
                    } else {
                        label = 'Has been queueing for';
                    }
                    dom.setContent(['runStatus', 'queue-time', 'label'], label);
                    dom.setContent(['runStatus', 'queue-time', 'elapsed'], utils.formatElapsedTime(state.elapsedQueueTime) || '');
                }());
            } else {
                dom.hideElement(['runStatus', 'queue-time']);
            }

            if (state.elapsedRunTime) {
                (function () {
                    dom.showElement(['runStatus', 'run-time']);
                    var label;
                    if (state.completedTime) {
                        label = 'Ran in';
                    } else {
                        label = 'Has been running for';
                    }
                    dom.setContent(['runStatus', 'run-time', 'label'], label);
                    dom.setContent(['runStatus', 'run-time', 'elapsed'], utils.formatElapsedTime(state.elapsedRunTime) || '');
                }());
            } else {
                dom.hideElement(['runStatus', 'run-time']);
            }

            if (state.completedTime) {
                dom.showElement(['runStatus', 'completed']);
                dom.setContent(['runStatus', 'completed', 'completedAt'], format.niceElapsedTime(state.completedTime));
            } else {
                dom.hideElement(['runStatus', 'completed']);
            }

            if (state.success) {
                dom.showElement(['runStatus', 'success']);
                dom.setContent(['runStatus', 'success', 'flag'], state.success ? 'yes' : '');
                // dom.showElement('job-report');
                // showJobReport();
                showJobResult();
            } else {
                dom.hideElement(['runStatus', 'success']);
                // dom.hideElement('job-report');
            }

            if (state.error) {
                dom.showElement(['runStatus', 'error']);
                dom.setContent(['runStatus', 'error', 'flag'], 'yes');
                dom.showElement(['run-error']);
                dom.setContent(['run-error', 'location'], state.error.location);
                dom.setContent(['run-error', 'type'], state.error.type);
                dom.setContent(['run-error', 'message'], state.error.message);
                dom.setContent(['run-error', 'detail'], state.error.detail);
                // console.log('ERROR', state.error);
            } else {
                dom.hideElement(['run-error']);
            }
        }

        function updateRunStateFromLaunchEvent(launchEvent, launchState) {
            var temporalState, executionState, canonicalState,
                error, now = new Date().getTime();
            if (!launchEvent) {
                return;
            }

            switch (launchEvent.event) {
                case 'validating_app':
                    temporalState = 'launching';
                    executionState = 'processing';
                    canonicalState = 'validating-request';
                    break;
                case 'validated_app':
                    temporalState = 'launching';
                    executionState = 'processing';
                    canonicalState = 'validated-request';
                    break;
                case 'launching_job':
                    temporalState = 'launching';
                    executionState = 'processing';
                    canonicalState = 'launching-request';
                    break;
                case 'launched_job':
                    temporalState = 'launching';
                    executionState = 'processing';
                    canonicalState = 'launched-request';
                    break;
                case 'error':
                    temporalState = 'launching';
                    executionState = 'error';
                    canonicalState = 'launch-error';
                    error = {
                        location: 'launching',
                        message: launchEvent.error_message,
                        detail: 'An error occurred while launching the method'
                    };
                    break;
                default:
                    throw new Error('Invalid launch state ' + launchEvent.event);
            }

            var launchStartTime = launchState.startTime,
                elapsed = now - launchStartTime;

            var newRunState = {
                lastUpdatedTime: new Date().getTime(),
                temporalState: temporalState,
                executionState: executionState,
                canonicalState: canonicalState,
                jobState: null,
                elapsedLaunchTime: elapsed,
                elapsedQueueTime: null,
                elapsedRunTime: null,
                completedTime: null,
                error: error,
                success: null
            };
            model.setItem('runState', newRunState);
        }

        function updateRunStateFromJobState() {
            var jobState = model.getItem('jobState');
            if (!jobState) {
                return;
            }
            var now = new Date().getTime();

            /*
             * All jobs can exist in three temporal zones which we can define
             * in the lifecycle of job execution.
             * - preparation: the job has not been processed yet, it is still being
             *     analyzed by the method job manager.
             * - queued: the job has been prepared and is queued for execution
             * - running: the job is currently executing
             * - completed: the job has completed
             * - error: the job has completed with error
             * 
             * In addition, each of these states is associated with a set of 
             * outcomes, either success or error. That is, they may progress from
             *   preparation -> queued -> running -> completed -> end
             * or any one may terminate with an error.
             *   preparation -> error
             *   preparation -> queued -> error
             *   preparation -> queued -> running -> error
             * 
             * If an error is encountered, it places the job into the 'suspended' state
             * and sets an error message in a specific property (not described here, it is convoluted.)
             * 
             * If an either queued, running, or completed states are entered a timestamp
             * is set, that is the signal we have that the state has been entered.
             * In the error state no timestamp has been set:
             * 
             * TODO: we should request an error timestamp, as well as 
             * an error structure (e.g. id, message, stacktrace, additional info)
             * 
             * In the completed state as well there is a job report (not described here at the moment).
             * 
             */
            
            /*
             * From the NJSWrapper spec:
             * 
        job_id - id of job running method
        finished - indicates whether job is done (including error cases) or not,
            if the value is true then either of 'returned_data' or 'detailed_error'
            should be defined;
        ujs_url - url of UserAndJobState service used by job service
        status - tuple returned by UserAndJobState.get_job_status method
        result - keeps exact copy of what original server method puts
            in result block of JSON RPC response;
        error - keeps exact copy of what original server method puts
            in error block of JSON RPC response;
        job_state - 'queued', 'in-progress', 'completed', or 'suspend';
        position - position of the job in execution waiting queue;
        creation_time, exec_start_time and finish_time - time moments of submission, execution 
            start and finish events in milliseconds since Unix Epoch.
 
    typedef structure {
        string job_id;
        boolean finished;
        string ujs_url;
        UnspecifiedObject status;
        UnspecifiedObject result;
        JsonRpcError error;
        string job_state;
        int position;
        int creation_time;
        int exec_start_time;
        int finish_time;
    } JobState;
             */
            
            
            /*
             * Determine temrporal state based on timestamps left behind.
             */
            var temporalState = jobState.job_state,
                submitTime, startTime, completedTime,
                elapsedQueueTime, elapsedRunTime;
            if (jobState.creation_time) {
                submitTime = jobState.creation_time;
                if (jobState.exec_start_time) {
                    startTime = jobState.exec_start_time;
                    elapsedQueueTime = startTime - submitTime;
                    if (jobState.finish_time) {
                        completedTime = jobState.finish_time;
                        elapsedRunTime = completedTime - startTime;
                        // temporalState = 'completed';
                    } else {
                        elapsedRunTime = now - startTime;
                        // we've been  using running, but maybe we should switch.
                        // temporalState = 'running';
                    }
                } else {
                    elapsedQueueTime = now - submitTime;
                    // temporalState = 'queued';
                }
            } else {
                throw new Error('Job state without submission time?');
            }

            /*
             * Determine the state of the job execution outcome.
             */
            var executionState,
                error, success,
                // errorInfo1 = getJobError(jobState),
                // errorInfo2 = getJobError2(jobState), errorMessage, errorDetail,
                // errorInfo = errorInfo1 || errorInfo2,
                // reportRef = getJobReportRef(jobState),
                result = jobState.result,
                errorInfo = jobState.error;
                    
            if (errorInfo) {
                executionState = 'error';
//                if (errorInfo.length > 50) {
//                    errorDetail = errorInfo;
//                    errorMessage = errorInfo.substring(0, 50) + '...';
//                } else {
//                    errorMessage = errorInfo;
//                    errorDetail = '';
//                }
                var errorId = new Uuid(4).format();
                console.log('EXEC ERROR', errorId, errorInfo);
                
                var errorType, errorMessage, errorDetail;
                if (errorInfo.error) {
                    // Classic KBase rpc error message
                    errorType = errorInfo.name;
                    errorMessage = errorInfo.message;
                    errorDetail = errorInfo.error;
                } else if (errorInfo.name) {
                    errorType = 'unknown';
                    errorMessage = errorInfo.name + ' (code: ' + String(errorInfo.code) + ')';
                    errorDetail = 'This error occurred during execution of the method job.';
                } else {
                    errorType = 'unknown';
                    errorMessage = 'Unknown error (check console for ' + errorId + ')';
                    errorDetail = 'There is no further information about this error';
                }
                
                error = {
                    location: 'job execution',
                    type: errorType,
                    message: errorMessage,
                    detail: errorDetail
                };
//            } else if (reportRef) {
//                executionState = 'success';
//                success = {
//                    reportRef: reportRef
//                };
//                // hmm, try this.
//                bus.send('show-job-report', {
//                    reportRef: reportRef
//                });
            } else if (result) {
                executionState = 'success';
                success = {
                    result: result
                };
                
                
                
                // hmm, try this.
                //bus.send('show-job-report', {
                //     reportRef: reportRef
                // });
               //  console.warn('OUTPUTS', outputs);
            } else {
                executionState = 'processing';
            }

            /*
             * Setting up the run status structure. 
             * This is a view model used to provide information to the user
             * as well as switches for controlling the user interface.
             * 
             * state: a simple string describing the run state
             * 
             * launch, queue, running times: elapsed times in those states.
             * 
             * 
             */

            // TODO: get the preparation time.
            // todo: can we store the initial execution time in the job record
            // stored in the narrative?
            var canonicalState;
            switch (temporalState) {
                case 'lauching':
                    switch (executionState) {
                        case 'processing':
                            canonicalState = 'preparing';
                            break;
                        case 'error':
                            canonicalState = 'launchError';
                            break;
                        default:
                            throw new Error('Invalid execution state ' + executionState + ' for temporal state ' + temporalState);
                    }
                    break;
                case 'queued':
                    switch (executionState) {
                        case 'processing':
                            canonicalState = 'queued';
                            break;
                        case 'error':
                            canonicalState = 'queingError';
                            break;
                        default:
                            throw new Error('Invalid execution state ' + executionState + ' for temporal state ' + temporalState);
                    }
                    break;
                case 'in-progress':
                    switch (executionState) {
                        case 'processing':
                            canonicalState = 'running';
                            break;
                        default:
                            // note that errors which occur during running are 
                            // converted into completed temporal state with
                            // and error message.
                            throw new Error('Invalid execution state ' + executionState + ' for temporal state ' + temporalState);
                    }
                    break;
                case 'completed':
                    switch (executionState) {
                        case 'success':
                            canonicalState = 'success';
                            break;
                        case 'error':
                            canonicalState = 'runError';
                            break;
                        default:
                            console.log('INVAL EXEC STATE', jobState);
                            throw new Error('Invalid execution state ' + executionState + ' for temporal state ' + temporalState);
                    }
                    break;
            }

            var newRunStatus = {
                lastUpdatedTime: model.getItem('jobStateLastUpdatedTime'),
                temporalState: temporalState,
                executionState: executionState,
                canonicalState: canonicalState,
                jobState: jobState,
                elapsedQueueTime: elapsedQueueTime,
                elapsedRunTime: elapsedRunTime,
                completedTime: completedTime,
                error: error,
                success: success
            };

            model.setItem('runState', newRunStatus);
        }


        function updateRunLaunchStatus(runMessage) {
            var runState = model.getItem('runState'),
                now = new Date().getTime();
            if (!runState) {
                runState = makeRunStatus();
            }
            /*
             * Once we have recorded a completed state, the run status should
             * not be updated.
             * Somewhere we must be protected from invald run updates ...
             */
            if (runState.completed) {
                return;
            }

            // These methods are guaranteed to only happen once, and we should
            // get every single event.
            switch (runMessage.event) {
                case 'validating_app':
                    runState.state = 'validating',
                        runState.launch = {
                            start: new Date().getTime()
                        };
                    break;
                case 'validated_app':
                    runState.state = 'validated';
                    runState.launch.elapsed = now - runState.launch.start;
                    break;
                case 'launching_job':
                    runState.state = 'launching';
                    runState.launch.elapsed = now - runState.launch.start;
                    break;
                case 'launched_job':
                    runState.state = 'launched';
                    runState.launch.elapsed = now - runState.launch.start;
                    break;
            }

            model.setItem('runState', runState);
        }

        /*
         * 
         * Job errors
         */
//        function getJobError(jobState) {
//            /*
//             * If the job has not completed, there will be not outputs, so we 
//             * can just bail.
//             */
//            if (!jobState.step_errors || Object.keys(jobState.step_errors).length === 0) {
//                return;
//            }
//
//            var stepJobIds = jobState.step_job_ids,
//                stepKey = Object.keys(stepJobIds)[0],
//                stepError = jobState.step_errors[stepKey];
//
//            return stepError;
//        }
//
//        function getJobError2(jobState) {
//            /*
//             * If the job has not completed, there will be not outputs, so we 
//             * can just bail.
//             */
//            if (!jobState.step_errors || Object.keys(jobState.step_errors).length === 0) {
//                return;
//            }
//
//            var stepKey = jobState.running_step_id,
//                stepError = jobState.step_errors[stepKey];
//
//            return stepError;
//        }

//        function getJobReportRef(jobState) {
//            /*
//             * If the job has not completed, there will be not outputs, so we 
//             * can just bail.
//             */
//            if (!jobState.step_outputs || Object.keys(jobState.step_outputs).length === 0) {
//                return;
//            }
//
//            var stepJobIds = jobState.step_job_ids,
//                stepKey = Object.keys(stepJobIds)[0],
//                stepOutput = JSON.parse(jobState.step_outputs[stepKey]),
//                reportRef = stepOutput[0].report_ref;
//
//            return reportRef;
//        }

//        function getJobReportRef(jobState) {
//            /*
//             * If the job has not completed, there will be not outputs, so we 
//             * can just bail.
//             */
//            if (!jobState.step_outputs || Object.keys(jobState.step_outputs).length === 0) {
//                return;
//            }
//
//            var stepJobIds = jobState.step_job_ids,
//                stepKey = Object.keys(stepJobIds)[0],
//                stepOutput = JSON.parse(jobState.step_outputs[stepKey]);
//
//            if (typeof stepOutput[0] === 'object') {
//                return stepOutput[0].report_ref;
//            }
//        }
//
//        function getJobOutputs(jobState) {
//            /*
//             * If the job has not completed, there will be not outputs, so we 
//             * can just bail.
//             */
//            if (!jobState.step_outputs || Object.keys(jobState.step_outputs).length === 0) {
//                return;
//            }
//
//            var stepJobIds = jobState.step_job_ids,
//                stepKey = Object.keys(stepJobIds)[0],
//                stepOutput = JSON.parse(jobState.step_outputs[stepKey]);
//
//
//            if (typeof stepOutput[0] === 'object' && stepOutput[0].report_ref === undefined) {
//                return stepOutput[0];
//            }
//        }

        function processNewLaunchEvent(launchEvent) {
            // we don't have to handle duplicates.

            model.setItem('lastLaunchEvent', launchEvent);

            var launchState = model.getItem('launchState');
            if (!launchState) {
                if (launchEvent.event !== 'validating_app') {
                    console.warn('Initializing launch time without validating_app (' + launchEvent.event + ')');
                }
                launchState = {
                    startTime: new Date(launchEvent.event_at).getTime(),
                    event: launchEvent.event,
                    runId: launchEvent.run_id,
                    cellId: launchEvent.cell_id,
                    jobId: launchEvent.job_id
                };
            } else {
                launchState.event = launchEvent.event;
                if (!launchEvent.jobId) {
                    launchState.jobId = launchEvent.job_id;
                }
            }
            model.setItem('launchState');

            updateRunStateFromLaunchEvent(launchEvent, launchState);
            renderRunState();
        }

        function processNewJobState(jobState) {
            // Only update the job state if the job state is different. 
            // How can we tell? Well for now we simply look at the job_state
            // for the incoming job notification, and compare it to our copy
            // of the most recent one, if any.
            // TODO: the controller should meter this for us!
            model.setItem('jobStateLastUpdatedTime', new Date().getTime());
            var currentJobState = model.getItem('jobState');
            if (!currentJobState || currentJobState.job_state !== jobState.job_state) {
                model.setItem('jobStateLastUpdatedTime', new Date().getTime());
                model.setItem('jobState', jobState);
                updateRunStateFromJobState();
                updateJobDetails();
                showJobDetails();
                renderRunState();
            }
            // If any.
            // showJobError();
        }

        /*
         * Name is the selector and model property name
         */

        function showToggleElement(name) {
            var toggle = model.getItem(['user-settings', 'toggle-state', name]),
                label = toggle.showing ? 'Hide ' + toggle.label : 'Show ' + toggle.label;
            if (toggle.showing) {
                dom.showElement(name);
            } else {
                dom.hideElement(name);
            }
            dom.setButtonLabel('toggle-' + toggle.name, label);
            return toggle.showing;
        }

        function toggleElement(name) {
            var toggle = model.getItem(['user-settings', 'toggle-state', name]);
            model.setItem(['user-settings', 'toggle-state', name, 'showing'], !toggle.showing);
            return showToggleElement(name);
        }

        // LIFECYCLE API

        function setup() {
            toggles.forEach(function (toggle) {
                toggle.showing = toggle.initialValue;
                model.setItem(['user-settings.toggle-state', toggle.name].join('.'), toggle);
                // mapping for toggle event.

                // universal handler for all toggle- events. 
                bus.on('toggle-' + toggle.name, function () {
                    toggleElement(toggle.name);
                });

                // show toggled area initial state.
                showToggleElement(toggle.name);
            });
            parentBus.on('job-state', function (message) {
                processNewJobState(message.jobState);
            });
            // not sure if this is the wisest thing to do...
            parentBus.on('job-state-updated', function (message) {
                model.setItem('jobStateLastUpdatedTime', new Date().getTime());
            });
            parentBus.on('launch-event', function (message) {
                processNewLaunchEvent(message.data);
            });
            bus.on('show-job-report', function (message) {
                getJobReport(message.reportRef)
                    .then(function (jobReport) {
                        console.log('JOB REPORT', jobReport);
                        model.setItem('jobReport', jobReport);
                        showJobReport();
                    });
            });
            runtime.bus().on('clock-tick', function () {
                // only update the ui on clock tick if we are currently running
                // a job. TODO: the clock should be disconnected.
                var runState = model.getItem('runState');
                if (runState && runState.executionState === 'processing') {
                    updateRunStateFromJobState();
                    renderRunState();
                }
            });

        }

        function start() {
            on('run', function (message) {
                container = message.node;
                dom = Dom.make({
                    node: container,
                    bus: bus
                });
                render();
                setup();
                if (message.jobState) {
                    processNewJobState(message.jobState);
                }
                renderRunState();
            });
        }

        function stop() {
            listeners.forEach(function (listener) {
                // TODO: make this work
                // parentBus.remove(listener);
            });
        }

        api = {
            start: start,
            stop: stop
        };

        // MAIN

        model = Props.make({
            onUpdate: function () {
                // render();
            }
        });

        return api;
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});