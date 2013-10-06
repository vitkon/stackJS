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
            version: '0.3',
            coefficient: 1,
            hasContainer: false
        };

    // The actual plugin constructor
    function Stack(element, options) {
        var raphaelIsLoaded, // raphael from cdn
            self = this;

        this.element = element; //jQuery element passed in
        this.$element = $(element);

        this.options = {}; // clear prev options

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

        // clear canvas before init
        this.$element.trigger('stack:clear');

        // if element is hidden, initialise only when it is shown
        if (this.$element.is(':visible') === false) {
            this.$element.attrchange({
                trackValues: true,
                callback: this.checkVisibility,
                context: this
            });
            return false;
        }

        var position = this.$element.offset(),
            elementWidth = this.$element.outerWidth(),
            elementHeight = this.$element.outerHeight();

        this.posLeft = position.left;
        this.posTop = position.top;
        this.posWidth = elementWidth;
        this.posHeight = elementHeight;

        // warn if width or height are 0
        if (this.posHeight === 0 || this.posWidth === 0) {
            this.debugMessage('Element width or height are not set', 'warn');
        }

        if (!this.paper) {
            // Creates canvas with dimensions of the element, now we can draw!
            this.paper = window.Raphael(this.posLeft, this.posTop, this.posWidth, this.posHeight);
        }

        // render all stacks in this.options.stacks
        this.render();

        if (!this.eventsAreSet && this.options.events) { this.listenToEvents(); }

        if (this.$element.attr('data-percentage')) {
            this.$element.trigger('stack:clear');
            this.$element.trigger('stack:percentage', [0, 0, this.$element.attr('data-percentage')]);
            this.$element.trigger('stack:render');
        }

        this.$element.removeAttr('data-percentage');

        this.debugMessage('init completed');

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
            ellipse,
            total = this.totalPercentage * this.options.coefficient;

        ellipse = this.paper.ellipse(
            baseX, baseY - i, baseWidth, baseHeight
        );

        if (i === Math.floor(total + options.percentage * this.options.coefficient - 1)) {
            fillColor = options.secondaryColor || options.primaryColor;
            strokeColor = options.strokeColor || options.secondaryColor || options.primaryColor;
        }
        ellipse.attr({stroke: strokeColor});
        ellipse.attr({fill: fillColor, 'fill-opacity': options.opacity || 1});

        stack.push(ellipse);

    };

    Stack.prototype.listenToEvents = function () {
        var self = this;

        this.$element.on('stack:clear', function (event) {
            event.stopPropagation();
            event.preventDefault();
            self.paper.clear();
            this.debugMessage('canvas is clear');
        });

        this.$element.on('stack:percentage', function (event, totalPercentage, stack, value) {
            event.stopPropagation();
            event.preventDefault();
            self.totalPercentage = totalPercentage;
            self.options.stacks[stack].percentage = value;
            self.debugMessage('new percentage set: ' + value);
        });

        this.$element.on('stack:render', function (event, stack, value) {
            event.stopPropagation();
            event.preventDefault();
            self.render();
            self.debugMessage('chart is rendered');
        });

        self.eventsAreSet = true;

    };

    Stack.prototype.checkVisibility = function (e, context) {
        if (e.attributeName === 'style') {
            if (e.newValue === 'display: inline-block;' || e.newValue === 'display: block;') {
                //TODO: unbind attrchange plugin
                // init chart
                context.init();
            } else if (e.newValue === 'display: none;') {
                // hide chart with it's parent element
                if (context.paper) {
                    context.paper.forEach(function (el) {
                        el.hide();
                    });
                }

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
            //if (!$.data(this, 'plugin_' + pluginName)) {
            $.data(this, 'plugin_' + pluginName, new Stack(this, options));
            //}
        });
    };

})(jQuery, window, document);