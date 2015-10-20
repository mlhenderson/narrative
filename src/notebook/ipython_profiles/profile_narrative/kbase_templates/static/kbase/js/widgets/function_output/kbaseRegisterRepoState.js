/**
 * Output widget to vizualize registered dynamic repo state.
 * Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define(['jquery', 
		'kbwidget', 
		'kbaseAuthenticatedWidget', 
		'catalog-client-api'
		], function($) {
	$.KBWidget({
		name: 'kbaseRegisterRepoState',
		parent: 'kbaseAuthenticatedWidget',
		version: '1.0.0',
		options: {
		    git_url: null,
		    git_commit_hash: null,
		    output: null,

			// Service URL: should be in window.kbconfig.urls.
            catalogURL: 'https://ci.kbase.us/services/catalog',
			loadingImage: "static/kbase/images/ajax-loader.gif"
		},
		// Prefix for all element ids
		pref: null,
		// Catalog client
		catalogClient: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();
            if (window.kbconfig && window.kbconfig.urls)
                this.options.catalogURL = window.kbconfig.urls.catalog;
            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.loading(true);
            return this;
        },

        loggedInCallback: function(event, auth) {
            // error if not properly initialized
            if (this.options.git_url == null) {
                this.showMessage("[Error] Couldn't retrieve repository state.");
                return this;
            }
            // Build a client
            this.catalogClient = new Catalog(this.options.catalogURL, auth);           
            // Let's go...
            this.render();           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        render: function() {
            var self = this;
            var pref = this.pref;
            var container = this.$elem;
            var table = $('<table class="table table-striped table-bordered" \
                    style="margin-left: auto; margin-right: auto;" id="'+pref+'info-table"/>');
            container.append(table);
            table.append('<tr><td width="33%">Timestamp</td><td id="'+pref+'_timestamp"></td></tr>');
            table.append('<tr><td width="33%">Is active</td><td id="'+pref+'_active"></td></tr>');
            table.append('<tr><td width="33%">Approval</td><td id="'+pref+'_release_approval"></td></tr>');
            table.append('<tr><td width="33%">Review</td><td id="'+pref+'_review_message"></td></tr>');
            table.append('<tr><td width="33%">State</td><td id="'+pref+'_registration"></td></tr>');
            table.append('<tr><td width="33%">Error</td><td><textarea style="width:100%;" rows="2" readonly id="'+pref+'_error"/></td></tr>');
            table.append('<tr><td width="33%">Build-log</td><td><textarea style="width:100%;" rows="5" readonly id="'+pref+'_build_log"/></td></tr>');
            self.refreshState();
        },
        
        refreshState: function() {
            var self = this;
            var pref = this.pref;
            self.catalogClient.get_module_state({git_url: self.options.git_url},
                function(data) {
                    self.loading(false);
                    console.log(data);
                    var showData = function(data, build_log) {
                        var state = data.registration;
                        $('#'+pref+'_timestamp').html('' + self.options.output);
                        $('#'+pref+'_active').html('' + data.active);
                        $('#'+pref+'_release_approval').html(data.release_approval);
                        $('#'+pref+'_review_message').html(data.review_message ? data.review_message : "");
                        $('#'+pref+'_registration').html('' + data.registration);
                        $('#'+pref+'_build_log').val('' + build_log);
                        if (state === 'error') {
                            $('#'+pref+'_error').val(data.error_message);
                        } else if (state !== 'complete') {
                            setTimeout(function(event) {
                                self.refreshState();
                            }, 5000);
                        }
                    };
                    self.catalogClient.get_build_log(self.options.output, function(data2) {
                        console.log(data2);
                        showData(data, data2);
                    }, function(error) {
                        console.log(error);
                        showData(data, error.error.error);
                    });
                },
                function(error) {
                    console.log(error);
                    self.clientError(error);
                }
            );
        },

        getData: function() {
            return {
                type: 'RegisterRepoState',
                id: this.options.expressionMatrixID,
                workspace: this.options.workspaceID,
                title: 'Repository State'
            };
        },

        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();                
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        }        
    });
});
