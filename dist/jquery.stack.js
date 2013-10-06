/*
 *  Stack JS - v0.1
 *  Stack visualisation library based on Raphael
 *  
 *
 *  By Deloitte Digital
 *  http://deloittedigital.co.uk
 */

/* global jQuery, window, document, console */

/**
 *  Stacked bar chart visualisation
 *  jQuery / Raphael plugin by Deloitte Digital
 *
 *  Initialisation example:
 *              $('#chart').Stack({
 *                   hasContainer: false,
 *                   coefficient: 0.4,
 *                   stacks: [
 *                       {
 *                           percentage: 20,
 *                           primaryColor: '#92d400',
 *                           secondaryColor: '#8fbe26',
 *                           label: 'Retireready RSA',
 *                       },
 *                       {
 *                           percentage: 30,
 *                           primaryColor: '#4b95fa',
 *                           secondaryColor: '#2e73d0',
 *                           label: 'Retireready',
 *                       }
 *                   ]
 *               });
 */




(function ($, window, document, undefined) {
    'use strict';

    // Create the defaults once
    var pluginName = 'Stack',
        defaults = {
            debug: true,    //verbose info in the console
            raphaelUrl: 'http://cdnjs.cloudflare.com/ajax/libs/raphael/2.1.0/raphael-min.js',
            events: true, // listen to incoming events
            version: '0.1',
            coefficient: 1,
            hasContainer: false
        };

    // The actual plugin constructor
    function Stack(element, options) {
        var raphaelIsLoaded, // raphael from cdn
            self = this;

        this.element = element; //jQuery element passed in
        this.$element = $(element);

        this.options = $.extend({}, defaults, options); // extend default options with user options
        this._defaults = defaults;
        this._name = pluginName;

        if (!window.Raphael) {
            raphaelIsLoaded = $.getScript(this.options.raphaelUrl);

            raphaelIsLoaded.done(function () {
                self.init(); // init plugin when Raphael is loaded          
            });

            raphaelIsLoaded.fail(function () {
                throw new Error(self._name + ': Raphael is not loaded, cannot proceed');
            });

        } else {
            this.init(); // init plugin straight away
        }

    }

    // init stack library
    Stack.prototype.init = function () {

        // in element is not visible, initialise when it is shown
        if (this.$element.is(':visible') === false) {
            this.$element.attrchange({
                trackValues: true,
                callback: this.checkVisibility,
                context: this
            });
            return false;
        }

        this.posLeft = this.$element.position().left;
        this.posTop = this.$element.position().top;
        this.posWidth = this.$element.width();
        this.posHeight = this.$element.height();

        // warn if width or height are 0
        if (this.posHeight === 0 || this.posWidth === 0) {
            this.debugMessage('Element width or height are not set', 'warn');
        }

        // Creates canvas with dimensions of the element, now we can draw!
        this.paper = window.Raphael(this.posLeft, this.posTop, this.posWidth, this.posHeight);

        // render all stacks in this.options.stacks
        this.render();

        if (this.options.events) { this.listenToEvents(); }

    };

    Stack.prototype.render = function () {
        var stacks = this.options.stacks,
            key;

        this.totalPercentage = 0;
        this.stacks = [];

        for (key in stacks) {
            if (stacks.hasOwnProperty(key)) {
                this.drawStack(stacks[key]);
            }
        }
    };

    Stack.prototype.drawStack = function (options) {
        var i,
            stack,
            total = this.totalPercentage * this.options.coefficient;

        stack = this.stacks[this.stacks.length] = [];

        for (i = total; i <= total + options.percentage * this.options.coefficient - 1; i++) {
            this.drawEllipse(stack, options, i);
        }

        this.totalPercentage += options.percentage;

    };

    Stack.prototype.drawEllipse = function (stack, options, i) {
        var paddingX = this.posWidth / 6,
            paddingY = this.posHeight / 6,
            baseWidth = this.posWidth / 2 - paddingX,
            baseHeight = this.posWidth / 12,
            baseX = this.posWidth / 2,
            baseY = this.posHeight - baseHeight - paddingY,
            topEllipse = this.totalPercentage + options.percentage - 1,
            fillColor = options.primaryColor,
            strokeColor = options.strokeColor || options.primaryColor,
            ellipse;

        ellipse = this.paper.ellipse(
            baseX, baseY - i, baseWidth, baseHeight
        );

        if (i === Math.floor(topEllipse * this.options.coefficient)) {
            fillColor = options.secondaryColor || options.primaryColor;
            strokeColor = options.strokeColor || options.secondaryColor || options.primaryColor;
        }
        ellipse.attr({stroke: strokeColor});
        ellipse.attr({fill: fillColor, 'fill-opacity': options.opacity || 1});

        stack.push(ellipse);

    };

    Stack.prototype.listenToEvents = function () {
        // sample animate event
        // trigger it like so: $('#block').trigger('stack:animate', [0, 100]);
        this.$element.on('stack:animate', function (event, start, stop) {
            //console.log('got it', start, stop, event);
        });
    };

    Stack.prototype.checkVisibility = function (e, context) {
        if (e.attributeName === 'style') {
            if (e.newValue === 'display: inline-block;' || e.newValue === 'display: block;') {
                //TODO: unbind attrchange plugin
                // init chart
                context.init();
            } else if (e.newValue === 'display: none;') {
                // hide chart with it's parent element
                context.paper.forEach(function (el) {
                    el.hide();
                });

            } else {
                return false;
            }
        }
    };

    Stack.prototype.debugMessage = function (msg, type) {
        var msgType = type || 'log';

        // display debug message if the option is set
        // available types are log, warn and error
        if (this.options.debug) {
            window.console[msgType](msg, this.element);
        }
    };


    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Stack(this, options));
            }
        });
    };

})(jQuery, window, document);
/*
A simple jQuery function that can add listeners on attribute change.
http://meetselva.github.io/attrchange/
Forked and customised by @vitkon
*/
(function($) {
   function isDOMAttrModifiedSupported() {
		var p = document.createElement('p');
		var flag = false;
		
		if (p.addEventListener) p.addEventListener('DOMAttrModified', function() {
			flag = true
		}, false);
		else if (p.attachEvent) p.attachEvent('onDOMAttrModified', function() {
			flag = true
		});
		else return false;
		
		p.setAttribute('id', 'target');
		
		return flag;
   }
   
   function checkAttributes(chkAttr, e) {
		if (chkAttr) {
			var attributes = this.data('attr-old-value');
			
			if (e.attributeName.indexOf('style') >= 0) {
				if (!attributes['style']) attributes['style'] = {}; //initialize
				var keys = e.attributeName.split('.');
				e.attributeName = keys[0];
				e.oldValue = attributes['style'][keys[1]]; //old value
				e.newValue = keys[1] + ':' + this.prop("style")[$.camelCase(keys[1])]; //new value
				attributes['style'][keys[1]] = e.newValue;
			} else {
				e.oldValue = attributes[e.attributeName];
				e.newValue = this.attr(e.attributeName);
				attributes[e.attributeName] = e.newValue; 
			}
			
			this.data('attr-old-value', attributes); //update the old value object
		}	   
   }

   //initialize Mutation Observer
   var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

   $.fn.attrchange = function(o) {
	   
		var cfg = {
			trackValues: false,
			callback: $.noop,
			context: this
		};
		
		//for backward compatibility
		if (typeof o === "function" ) { 
			cfg.callback = o; 
		} else { 
			$.extend(cfg, o); 
		}

	    if (cfg.trackValues) { //get attributes old value
	    	$(this).each(function (i, el) {
	    		var attributes = {};
	    		for (var attr, i=0, attrs=el.attributes, l=attrs.length; i<l; i++){
	    		    attr = attrs.item(i);
	    		    attributes[attr.nodeName] = attr.value;
	    		}
	    		
	    		$(this).data('attr-old-value', attributes);
	    	});
	    }
	   
		if (MutationObserver) { //Modern Browsers supporting MutationObserver
			/*
			   Mutation Observer is still new and not supported by all browsers. 
			   http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1622.html
			*/
			var mOptions = {
				subtree: false,
				attributes: true,
				attributeOldValue: cfg.trackValues
			};
	
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(e) {
					var _this = e.target;
					
					//get new value if trackValues is true
					if (cfg.trackValues) {
						/**
						 * @KNOWN_ISSUE: The new value is buggy for STYLE attribute as we don't have 
						 * any additional information on which style is getting updated. 
						 * */
						e.newValue = $(_this).attr(e.attributeName);
					}
					
					cfg.callback.call(_this, e, cfg.context);
				});
			});
	
			return this.each(function() {
				observer.observe(this, mOptions);
			});
		} else if (isDOMAttrModifiedSupported()) { //Opera
			//Good old Mutation Events but the performance is no good
			//http://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
			return this.on('DOMAttrModified', function(event) {
				if (event.originalEvent) event = event.originalEvent; //jQuery normalization is not required for us 
				event.attributeName = event.attrName; //property names to be consistent with MutationObserver
				event.oldValue = event.prevValue; //property names to be consistent with MutationObserver 
				cfg.callback.call(this, event, cfg.context);
			});
		} else if ('onpropertychange' in document.body) { //works only in IE		
			return this.on('propertychange', function(e) {
				e.attributeName = window.event.propertyName;
				//to set the attr old value
				checkAttributes.call($(this), cfg.trackValues , e, cfg.context);
				cfg.callback.call(this, e, cfg.context);
			});
		}

		return this;
    }
})(jQuery);