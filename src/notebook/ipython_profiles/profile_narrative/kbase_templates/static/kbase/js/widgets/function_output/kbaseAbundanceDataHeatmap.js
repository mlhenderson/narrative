/**
 * KBase widget to display table of BIOM data
 */
(function($, undefined) {
    $.KBWidget({
            name: 'AbundanceDataHeatmap',
            version: '1.0.0',
            options: {
	            id: null,
	            ws: null,
	            auth: null,
	            rows: 0
        },
	    ws_url: window.kbconfig.urls.workspace,
	    loading_image: "static/kbase/images/ajax-loader.gif",
        
	    init: function(options) {
            this._super(options);
            return this.render();
        },
	
        render: function() {
	        var self = this;
	        var pref = this.uuidv4();
	        var container = this.$elem;
	        var kbws = new Workspace(self.ws_url, {'token': self.options.auth});
            
	        container.empty();
	        container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	        kbws.get_objects([{ref: self.options.ws+"/"+self.options.id}], function(data) {
	            container.empty();
		        // parse data
		        if (data.length == 0) {
		            var msg = "[Error] Object "+self.options.id+" does not exist in workspace "+self.options.ws;
		            container.append('<div><p>'+msg+'>/p></div>');
		        } else {
		            var heatdata = data[0]['data'];
		            console.log(heatdata);
			        // HEATMAP
                    var hlen = 0;
                    if (window.hasOwnProperty('rendererHeatmap') && rendererHeatmap.length) {
                        hlen = rendererHeatmap.length;
                    }
                    container.append("<div id='outputHeatmap"+hlen+"' style='width: 95%;'></div>");
                    var heatTest = standaloneHeatmap.create({index: hlen});
                    heatTest.settings.target = document.getElementById("outputHeatmap"+hlen);
                    heatTest.settings.data = heatdata;
                    heatTest.render(hlen);
		        }
	        }, function(data) {
		        container.empty();
		        var main = $('<div>');
		        main.append($('<p>')
		            .css({'padding': '10px 20px'})
		            .text('[Error] '+data.error.message));
		        container.append(main);
	        });
	        return self;
        },

	    uuidv4: function(a,b) {
	        for (b=a=''; a++<36; b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');
	        return b;
	    }
    });
})(jQuery);
