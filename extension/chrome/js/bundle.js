
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* node_modules\svelma\src\components\Icon.svelte generated by Svelte v3.16.7 */

    const file = "node_modules\\svelma\\src\\components\\Icon.svelte";

    function create_fragment(ctx) {
    	let span;
    	let i;
    	let i_class_value;
    	let span_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]));
    			add_location(i, file, 53, 2, 1189);
    			attr_dev(span, "class", span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""));
    			toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			add_location(span, file, 52, 0, 1046);
    			dispose = listen_dev(span, "click", /*click_handler*/ ctx[12], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newPack, icon, customClass, newCustomSize*/ 325 && i_class_value !== (i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight*/ 178 && span_class_value !== (span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight, isClickable*/ 186) {
    				toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { type = "" } = $$props;
    	let { pack = "fas" } = $$props;
    	let { icon } = $$props;
    	let { size = "" } = $$props;
    	let { customClass = "" } = $$props;
    	let { customSize = "" } = $$props;
    	let { isClickable = false } = $$props;
    	let { isLeft = false } = $$props;
    	let { isRight = false } = $$props;
    	let newCustomSize = "";
    	let newType = "";

    	const writable_props = [
    		"type",
    		"pack",
    		"icon",
    		"size",
    		"customClass",
    		"customSize",
    		"isClickable",
    		"isLeft",
    		"isRight"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    	};

    	$$self.$capture_state = () => {
    		return {
    			type,
    			pack,
    			icon,
    			size,
    			customClass,
    			customSize,
    			isClickable,
    			isLeft,
    			isRight,
    			newCustomSize,
    			newType,
    			newPack
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    		if ("newCustomSize" in $$props) $$invalidate(6, newCustomSize = $$props.newCustomSize);
    		if ("newType" in $$props) $$invalidate(7, newType = $$props.newType);
    		if ("newPack" in $$props) $$invalidate(8, newPack = $$props.newPack);
    	};

    	let newPack;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pack*/ 1024) {
    			 $$invalidate(8, newPack = pack || "fas");
    		}

    		if ($$self.$$.dirty & /*customSize, size*/ 2050) {
    			 {
    				if (customSize) $$invalidate(6, newCustomSize = customSize); else {
    					switch (size) {
    						case "is-small":
    							break;
    						case "is-medium":
    							$$invalidate(6, newCustomSize = "fa-lg");
    							break;
    						case "is-large":
    							$$invalidate(6, newCustomSize = "fa-3x");
    							break;
    						default:
    							$$invalidate(6, newCustomSize = "");
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*type*/ 512) {
    			 {
    				if (!type) $$invalidate(7, newType = "");
    				let splitType = [];

    				if (typeof type === "string") {
    					splitType = type.split("-");
    				} else {
    					for (let key in type) {
    						if (type[key]) {
    							splitType = key.split("-");
    							break;
    						}
    					}
    				}

    				if (splitType.length <= 1) $$invalidate(7, newType = ""); else $$invalidate(7, newType = `has-text-${splitType[1]}`);
    			}
    		}
    	};

    	return [
    		icon,
    		size,
    		customClass,
    		isClickable,
    		isLeft,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack,
    		type,
    		pack,
    		customSize,
    		click_handler
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			type: 9,
    			pack: 10,
    			icon: 0,
    			size: 1,
    			customClass: 2,
    			customSize: 11,
    			isClickable: 3,
    			isLeft: 4,
    			isRight: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*icon*/ ctx[0] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get type() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pack() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pack(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customClass() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customClass(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customSize() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customSize(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isClickable() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isClickable(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isLeft() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isLeft(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRight() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRight(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* node_modules\svelma\src\components\Tabs\Tabs.svelte generated by Svelte v3.16.7 */
    const file$1 = "node_modules\\svelma\\src\\components\\Tabs\\Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (87:12) {#if tab.icon}
    function create_if_block(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				pack: /*tab*/ ctx[15].iconPack,
    				icon: /*tab*/ ctx[15].icon
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*$tabs*/ 32) icon_changes.pack = /*tab*/ ctx[15].iconPack;
    			if (dirty & /*$tabs*/ 32) icon_changes.icon = /*tab*/ ctx[15].icon;
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(87:12) {#if tab.icon}",
    		ctx
    	});

    	return block;
    }

    // (84:6) {#each $tabs as tab, index}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0;
    	let span;
    	let t1_value = /*tab*/ ctx[15].label + "";
    	let t1;
    	let t2;
    	let current;
    	let dispose;
    	let if_block = /*tab*/ ctx[15].icon && create_if_block(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[14](/*index*/ ctx[17], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			add_location(span, file$1, 90, 12, 2338);
    			attr_dev(a, "href", "");
    			add_location(a, file$1, 85, 10, 2163);
    			toggle_class(li, "is-active", /*index*/ ctx[17] === /*activeTab*/ ctx[4]);
    			add_location(li, file$1, 84, 8, 2110);
    			dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			if (if_block) if_block.m(a, null);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*tab*/ ctx[15].icon) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(a, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*$tabs*/ 32) && t1_value !== (t1_value = /*tab*/ ctx[15].label + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*activeTab*/ 16) {
    				toggle_class(li, "is-active", /*index*/ ctx[17] === /*activeTab*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(84:6) {#each $tabs as tab, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let nav;
    	let ul;
    	let nav_class_value;
    	let t;
    	let section;
    	let current;
    	let each_value = /*$tabs*/ ctx[5];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			section = element("section");
    			if (default_slot) default_slot.c();
    			add_location(ul, file$1, 82, 4, 2063);
    			attr_dev(nav, "class", nav_class_value = "tabs " + /*size*/ ctx[0] + " " + /*position*/ ctx[1] + " " + /*style*/ ctx[2] + " svelte-1v5sm20");
    			add_location(nav, file$1, 81, 2, 2014);
    			attr_dev(section, "class", "tab-content svelte-1v5sm20");
    			add_location(section, file$1, 96, 2, 2427);
    			attr_dev(div, "class", "tabs-wrapper svelte-1v5sm20");
    			toggle_class(div, "is-fullwidth", /*expanded*/ ctx[3]);
    			add_location(div, file$1, 80, 0, 1955);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, nav);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div, t);
    			append_dev(div, section);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeTab, changeTab, $tabs*/ 176) {
    				each_value = /*$tabs*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*size, position, style*/ 7 && nav_class_value !== (nav_class_value = "tabs " + /*size*/ ctx[0] + " " + /*position*/ ctx[1] + " " + /*style*/ ctx[2] + " svelte-1v5sm20")) {
    				attr_dev(nav, "class", nav_class_value);
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4096) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    			}

    			if (dirty & /*expanded*/ 8) {
    				toggle_class(div, "is-fullwidth", /*expanded*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $tabs;
    	const dispatch = createEventDispatcher();
    	let { value = 0 } = $$props;
    	let { size = "" } = $$props;
    	let { position = "" } = $$props;
    	let { style = "" } = $$props;
    	let { expanded = false } = $$props;
    	let activeTab = 0;
    	const tabs = writable([]);
    	validate_store(tabs, "tabs");
    	component_subscribe($$self, tabs, value => $$invalidate(5, $tabs = value));
    	const tabConfig = { activeTab, tabs };
    	setContext("tabs", tabConfig);

    	const unsubscribe = tabs.subscribe(ts => {
    		if (ts.length > 0 && ts.length > value - 1) {
    			ts.forEach(t => t.deactivate());
    			if (ts[value]) ts[value].activate();
    		}
    	});

    	function changeTab(tabNumber) {
    		const ts = get_store_value(tabs);
    		if (ts[activeTab]) ts[activeTab].deactivate();
    		if (ts[tabNumber]) ts[tabNumber].activate();
    		$$invalidate(4, activeTab = tabConfig.activeTab = tabNumber);
    		dispatch("activeTabChanged", tabNumber);
    	}

    	onMount(() => {
    		changeTab(activeTab);
    	});

    	onDestroy(() => {
    		unsubscribe();
    	});

    	const writable_props = ["value", "size", "position", "style", "expanded"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	const click_handler = index => changeTab(index);

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			value,
    			size,
    			position,
    			style,
    			expanded,
    			activeTab,
    			$tabs
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    		if ("activeTab" in $$props) $$invalidate(4, activeTab = $$props.activeTab);
    		if ("$tabs" in $$props) tabs.set($tabs = $$props.$tabs);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 256) {
    			 changeTab(value);
    		}
    	};

    	return [
    		size,
    		position,
    		style,
    		expanded,
    		activeTab,
    		$tabs,
    		tabs,
    		changeTab,
    		value,
    		tabConfig,
    		dispatch,
    		unsubscribe,
    		$$scope,
    		$$slots,
    		click_handler
    	];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			value: 8,
    			size: 0,
    			position: 1,
    			style: 2,
    			expanded: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get value() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Tabs\Tab.svelte generated by Svelte v3.16.7 */
    const file$2 = "node_modules\\svelma\\src\\components\\Tabs\\Tab.svelte";

    const get_default_slot_changes = dirty => ({
    	label: dirty & /*label*/ 1,
    	iconPack: dirty & /*iconPack*/ 4,
    	icon: dirty & /*icon*/ 2
    });

    const get_default_slot_context = ctx => ({
    	label: /*label*/ ctx[0],
    	iconPack: /*iconPack*/ ctx[2],
    	icon: /*icon*/ ctx[1]
    });

    function create_fragment$2(ctx) {
    	let div;
    	let div_class_value;
    	let div_aria_hidden_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], get_default_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "tab " + /*direction*/ ctx[5] + " svelte-h9o7ze");
    			attr_dev(div, "aria-hidden", div_aria_hidden_value = !/*active*/ ctx[3]);
    			toggle_class(div, "is-active", /*active*/ ctx[3]);
    			add_location(div, file$2, 97, 0, 2229);
    			dispose = listen_dev(div, "transitionend", /*transitionend*/ ctx[6], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[15](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, label, iconPack, icon*/ 8199) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[13], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, get_default_slot_changes));
    			}

    			if (!current || dirty & /*direction*/ 32 && div_class_value !== (div_class_value = "tab " + /*direction*/ ctx[5] + " svelte-h9o7ze")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*active*/ 8 && div_aria_hidden_value !== (div_aria_hidden_value = !/*active*/ ctx[3])) {
    				attr_dev(div, "aria-hidden", div_aria_hidden_value);
    			}

    			if (dirty & /*direction, active*/ 40) {
    				toggle_class(div, "is-active", /*active*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[15](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { label } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let active = false;
    	let el;
    	let index;
    	let starting = false;
    	let direction = "";
    	let isIn = false;
    	const tabConfig = getContext("tabs");

    	async function changeTab({ from, to }) {
    		if (from === to) return;

    		if (from === index) {
    			$$invalidate(5, direction = index < to ? "left" : "right");
    		} else if (to === index) {
    			$$invalidate(3, active = true);
    			$$invalidate(5, direction = index > from ? "right" : "left");
    		} else $$invalidate(5, direction = "");
    	}

    	function updateIndex() {
    		if (!el) return;
    		index = Array.prototype.indexOf.call(el.parentNode.children, el);
    	}

    	async function transitionend(event) {
    		$$invalidate(3, active = index === tabConfig.activeTab);
    		await tick();
    		$$invalidate(5, direction = "");
    	}

    	tabConfig.tabs.subscribe(tabs => {
    		updateIndex();
    	});

    	onMount(() => {
    		updateIndex();

    		tabConfig.tabs.update(tabs => [
    			...tabs,
    			{
    				index,
    				label,
    				icon,
    				iconPack,
    				activate: () => $$invalidate(3, active = true),
    				deactivate: () => $$invalidate(3, active = false),
    				changeTab
    			}
    		]);
    	});

    	beforeUpdate(async () => {
    		if (index === tabConfig.activeTab && direction) {
    			await tick();

    			setTimeout(() => {
    				$$invalidate(5, direction = "");
    			});
    		}
    	});

    	const writable_props = ["label", "icon", "iconPack"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(2, iconPack = $$props.iconPack);
    		if ("$$scope" in $$props) $$invalidate(13, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			label,
    			icon,
    			iconPack,
    			active,
    			el,
    			index,
    			starting,
    			direction,
    			isIn
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(2, iconPack = $$props.iconPack);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    		if ("el" in $$props) $$invalidate(4, el = $$props.el);
    		if ("index" in $$props) index = $$props.index;
    		if ("starting" in $$props) starting = $$props.starting;
    		if ("direction" in $$props) $$invalidate(5, direction = $$props.direction);
    		if ("isIn" in $$props) isIn = $$props.isIn;
    	};

    	return [
    		label,
    		icon,
    		iconPack,
    		active,
    		el,
    		direction,
    		transitionend,
    		changeTab,
    		index,
    		starting,
    		isIn,
    		tabConfig,
    		updateIndex,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			label: 0,
    			icon: 1,
    			iconPack: 2,
    			changeTab: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*label*/ ctx[0] === undefined && !("label" in props)) {
    			console.warn("<Tab> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get changeTab() {
    		return this.$$.ctx[7];
    	}

    	set changeTab(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const source = writable({
      element:'',
      title:'',
      path:'',
      url:'',
    });

    /* src\components\logs\Item.svelte generated by Svelte v3.16.7 */
    const file$3 = "src\\components\\logs\\Item.svelte";

    function create_fragment$3(ctx) {
    	let tr;
    	let td;
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].element === /*item*/ ctx[0].element) + " svelte-1xrld7s");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$3, 36, 4, 667);
    			attr_dev(td, "class", "svelte-1xrld7s");
    			add_location(td, file$3, 35, 2, 657);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$3, 34, 0, 638);
    			dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, div);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].element === /*item*/ ctx[0].element) + " svelte-1xrld7s")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_item_value !== (div_data_item_value = /*item*/ ctx[0].element)) {
    				attr_dev(div, "data-item", div_data_item_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function empty() {
    	source.set({
    		element: "",
    		title: "",
    		path: "",
    		url: ""
    	});
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let { item } = $$props;

    	function clickHandler(e) {
    		const { item } = e.target.dataset;
    		const obj = window.mitm.files.log[item];

    		if (item === $source.element) {
    			empty();
    		} else {
    			empty();

    			setTimeout(
    				() => {
    					source.update(n => {
    						return {
    							element: item,
    							title: obj.title,
    							path: obj.path,
    							url: item.replace(/^.+\.mitm-play/, "http://localhost:3000")
    						};
    					});
    				},
    				0
    			);
    		}
    	}

    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => {
    		return { item, $source };
    	};

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("$source" in $$props) source.set($source = $$props.$source);
    	};

    	return [item, $source, clickHandler];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Item> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\logs\Show.svelte generated by Svelte v3.16.7 */
    const file$4 = "src\\components\\logs\\Show.svelte";

    // (54:2) {:else}
    function create_else_block(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "X";
    			add_location(button, file$4, 54, 4, 1367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(54:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:41) 
    function create_if_block_1(ctx) {
    	let div;
    	let textarea;
    	let textarea_value_value;
    	let div_data_dummy_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			textarea = element("textarea");
    			attr_dev(textarea, "id", "democode");
    			textarea.value = textarea_value_value = codeMirror(/*sourceCode*/ ctx[0]);
    			attr_dev(textarea, "class", "svelte-13gvuk2");
    			add_location(textarea, file$4, 51, 6, 1279);
    			attr_dev(div, "id", "show-code");
    			attr_dev(div, "data-dummy", div_data_dummy_value = /*getSource*/ ctx[2]());
    			attr_dev(div, "class", "svelte-13gvuk2");
    			add_location(div, file$4, 50, 4, 1226);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, textarea);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sourceCode*/ 1 && textarea_value_value !== (textarea_value_value = codeMirror(/*sourceCode*/ ctx[0]))) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(50:41) ",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#if $source.title.match('.png')}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*$source*/ ctx[1].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image");
    			add_location(img, file$4, 48, 4, 1139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$source*/ 2 && img.src !== (img_src_value = /*$source*/ ctx[1].url)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(48:2) {#if $source.title.match('.png')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let show_if;
    	let show_if_1;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*$source*/ 2) show_if = !!/*$source*/ ctx[1].title.match(".png");
    		if (show_if) return create_if_block$1;
    		if (show_if_1 == null || dirty & /*$source*/ 2) show_if_1 = !!/*$source*/ ctx[1].title.match(".json");
    		if (show_if_1) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			add_location(div, file$4, 46, 0, 1091);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function setupCodeMiror() {
    	if (!window.showcode) {
    		window.showcode = CodeMirror.fromTextArea(document.getElementById("democode"), {
    			lineNumbers: true,
    			mode: "javascript",
    			matchBrackets: true
    		});
    	}
    }

    function replacer(match, p1, p2) {
    	return [p1, p2].join("");
    }

    function codeMirror(code) {
    	if (!code) {
    		return "";
    	}

    	if (window.showcode) {
    		const nodes = document.querySelectorAll("#show-code .CodeMirror");
    		nodes.forEach(element => element.remove());
    		window.showcode = undefined;
    	}

    	setTimeout(() => setupCodeMiror(), 1);
    	return code.replace(/"(.+)"(:)/g, replacer).replace(/ (resp|reqs|url)(\w+):/g, (m, p1, p2) => ` "${p1}${p2}":`);
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let sourceCode = "";

    	async function getSource() {
    		const resp = await fetch($source.url);
    		const text = await resp.text();

    		if (resp.ok) {
    			$$invalidate(0, sourceCode = text);
    			console.log("Fetch success");
    		} else {
    			console.log("Fetch Errir", resp.status);
    		}

    		return Math.random() + "";
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("sourceCode" in $$props) $$invalidate(0, sourceCode = $$props.sourceCode);
    		if ("$source" in $$props) source.set($source = $$props.$source);
    	};

    	return [sourceCode, $source, getSource];
    }

    class Show extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Show",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\logs\Table.svelte generated by Svelte v3.16.7 */
    const file$5 = "src\\components\\logs\\Table.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (46:8) {#each Object.keys(_data) as item}
    function create_each_block$1(ctx) {
    	let current;

    	const item = new Item({
    			props: {
    				item: {
    					element: /*item*/ ctx[4],
    					.../*_data*/ ctx[0][/*item*/ ctx[4]]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(item.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(item, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item_changes = {};

    			if (dirty & /*_data*/ 1) item_changes.item = {
    				element: /*item*/ ctx[4],
    				.../*_data*/ ctx[0][/*item*/ ctx[4]]
    			};

    			item.$set(item_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(46:8) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    // (52:2) {#if $source.element}
    function create_if_block$2(ctx) {
    	let div;
    	let current;
    	const show = new Show({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(show.$$.fragment);
    			attr_dev(div, "class", "vbox right svelte-1eeh71");
    			add_location(div, file$5, 52, 4, 1103);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(show, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(show.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(show.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(show);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(52:2) {#if $source.element}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let div1;
    	let table0;
    	let tr;
    	let td;
    	let t1;
    	let div0;
    	let table1;
    	let t2;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*$source*/ ctx[1].element && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			table0 = element("table");
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "-Logs-";
    			t1 = space();
    			div0 = element("div");
    			table1 = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(td, "class", "svelte-1eeh71");
    			add_location(td, file$5, 40, 8, 837);
    			add_location(tr, file$5, 39, 6, 824);
    			attr_dev(table0, "class", "svelte-1eeh71");
    			add_location(table0, file$5, 38, 4, 810);
    			attr_dev(table1, "class", "svelte-1eeh71");
    			add_location(table1, file$5, 44, 6, 918);
    			attr_dev(div0, "class", "table-container svelte-1eeh71");
    			add_location(div0, file$5, 43, 4, 882);
    			attr_dev(div1, "class", "vbox left svelte-1eeh71");
    			add_location(div1, file$5, 37, 2, 782);
    			attr_dev(div2, "class", "vbox svelte-1eeh71");
    			add_location(div2, file$5, 36, 0, 761);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, table0);
    			append_dev(table0, tr);
    			append_dev(tr, td);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, table1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table1, null);
    			}

    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, _data*/ 1) {
    				each_value = Object.keys(/*_data*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*$source*/ ctx[1].element) {
    				if (!if_block) {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let data = [];

    	onMount(async () => {
    		setTimeout(
    			() => {
    				ws__send("getLog", "", logHandler);
    			},
    			10
    		);
    	});

    	const logHandler = obj => {
    		console.log("ws__send(getLog)", obj);

    		if (window.mitm.files.log === undefined) {
    			window.mitm.files.log = obj;
    			$$invalidate(2, data = obj);
    		} else {
    			const { log } = window.mitm.files;
    			const newLog = {};

    			for (let k in obj) {
    				newLog[k] = log[k] ? log[k] : obj[k];
    			}

    			window.mitm.files.log = newLog;
    			$$invalidate(2, data = newLog);
    		}

    		rerender++;
    	};

    	window.mitm.files.log_events.LogsTable = () => {
    		ws__send("getLog", "", logHandler);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("_data" in $$props) $$invalidate(0, _data = $$props._data);
    		if ("$source" in $$props) source.set($source = $$props.$source);
    	};

    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 4) {
    			 $$invalidate(0, _data = data);
    		}
    	};

    	return [_data, $source];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const source$1 = writable({
      content:'',
      path:'',
    });

    /* src\components\route\Item.svelte generated by Svelte v3.16.7 */

    const { console: console_1 } = globals;
    const file$6 = "src\\components\\route\\Item.svelte";

    function create_fragment$6(ctx) {
    	let tr;
    	let td;
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-1xrld7s");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$6, 40, 4, 946);
    			attr_dev(td, "class", "svelte-1xrld7s");
    			add_location(td, file$6, 39, 2, 936);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$6, 38, 0, 917);
    			dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, div);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-1xrld7s")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_item_value !== (div_data_item_value = /*item*/ ctx[0].element)) {
    				attr_dev(div, "data-item", div_data_item_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(1, $source = $$value));
    	let { item } = $$props;
    	let { onChanged } = $$props;

    	function setupCodeMiror() {
    		if (!window.editor) {
    			window.editor = CodeMirror.fromTextArea(document.getElementById("demotext"), {
    				lineNumbers: true,
    				mode: "javascript",
    				matchBrackets: true
    			});

    			editor.on("changes", onChanged);
    			onChanged(false);
    		}
    	}

    	onMount(async () => setupCodeMiror());

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const obj = window.mitm.files.route[item];
    		console.log(item, obj);

    		if (window.editor) {
    			const nodes = document.querySelectorAll("#code-mirror .CodeMirror");
    			nodes.forEach(element => element.remove());
    			window.editor = undefined;
    		}

    		setTimeout(() => setupCodeMiror(), 100);
    		source$1.set({ content: obj.content, path: obj.path });
    	}

    	const writable_props = ["item", "onChanged"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChanged" in $$props) $$invalidate(3, onChanged = $$props.onChanged);
    	};

    	$$self.$capture_state = () => {
    		return { item, onChanged, $source };
    	};

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChanged" in $$props) $$invalidate(3, onChanged = $$props.onChanged);
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	return [item, $source, clickHandler, onChanged];
    }

    class Item$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { item: 0, onChanged: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChanged*/ ctx[3] === undefined && !("onChanged" in props)) {
    			console_1.warn("<Item> was created without expected prop 'onChanged'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChanged() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChanged(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\route\Table.svelte generated by Svelte v3.16.7 */
    const file$7 = "src\\components\\route\\Table.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (71:0) {#if $source.path}
    function create_if_block$3(ctx) {
    	let div;
    	let button;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text("Save");
    			attr_dev(button, "class", "btn-save svelte-1c693a7");
    			button.disabled = /*btnDisabled*/ ctx[1];
    			add_location(button, file$7, 72, 2, 1507);
    			attr_dev(div, "class", "btn-container svelte-1c693a7");
    			add_location(div, file$7, 71, 1, 1477);
    			dispose = listen_dev(button, "click", /*btnSave*/ ctx[4], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*btnDisabled*/ 2) {
    				prop_dev(button, "disabled", /*btnDisabled*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(71:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    // (85:8) {#each Object.keys(_data) as item}
    function create_each_block$2(ctx) {
    	let current;

    	const item = new Item$1({
    			props: {
    				item: {
    					element: /*item*/ ctx[10],
    					.../*_data*/ ctx[2][/*item*/ ctx[10]]
    				},
    				onChanged: /*editorChanged*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(item.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(item, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item_changes = {};

    			if (dirty & /*_data*/ 4) item_changes.item = {
    				element: /*item*/ ctx[10],
    				.../*_data*/ ctx[2][/*item*/ ctx[10]]
    			};

    			item.$set(item_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(85:8) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div0;
    	let t0;
    	let t1_value = /*$source*/ ctx[3].path + "";
    	let t1;
    	let t2;
    	let t3;
    	let table2;
    	let tr1;
    	let td1;
    	let table0;
    	let tr0;
    	let td0;
    	let t5;
    	let div1;
    	let table1;
    	let table1_id_value;
    	let t6;
    	let td2;
    	let div2;
    	let textarea;
    	let textarea_value_value;
    	let current;
    	let if_block = /*$source*/ ctx[3].path && create_if_block$3(ctx);
    	let each_value = Object.keys(/*_data*/ ctx[2]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Path:");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			table2 = element("table");
    			tr1 = element("tr");
    			td1 = element("td");
    			table0 = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "-Route(s)-";
    			t5 = space();
    			div1 = element("div");
    			table1 = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			td2 = element("td");
    			div2 = element("div");
    			textarea = element("textarea");
    			attr_dev(div0, "class", "file-path svelte-1c693a7");
    			add_location(div0, file$7, 68, 0, 1413);
    			attr_dev(td0, "class", "svelte-1c693a7");
    			add_location(td0, file$7, 81, 37, 1713);
    			add_location(tr0, file$7, 81, 33, 1709);
    			attr_dev(table0, "class", "table-title svelte-1c693a7");
    			add_location(table0, file$7, 81, 6, 1682);
    			attr_dev(table1, "id", table1_id_value = "uniq-" + /*rerender*/ ctx[0]);
    			attr_dev(table1, "class", "svelte-1c693a7");
    			add_location(table1, file$7, 83, 6, 1788);
    			attr_dev(div1, "class", "table-container svelte-1c693a7");
    			add_location(div1, file$7, 82, 6, 1752);
    			attr_dev(td1, "class", "main-td1 svelte-1c693a7");
    			add_location(td1, file$7, 80, 4, 1654);
    			attr_dev(textarea, "id", "demotext");
    			textarea.value = textarea_value_value = /*$source*/ ctx[3].content;
    			add_location(textarea, file$7, 92, 6, 2037);
    			attr_dev(div2, "id", "code-mirror");
    			attr_dev(div2, "class", "svelte-1c693a7");
    			add_location(div2, file$7, 91, 4, 2008);
    			attr_dev(td2, "class", "svelte-1c693a7");
    			add_location(td2, file$7, 90, 4, 1999);
    			add_location(tr1, file$7, 79, 2, 1645);
    			attr_dev(table2, "class", "main-table svelte-1c693a7");
    			add_location(table2, file$7, 78, 0, 1616);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, table2, anchor);
    			append_dev(table2, tr1);
    			append_dev(tr1, td1);
    			append_dev(td1, table0);
    			append_dev(table0, tr0);
    			append_dev(tr0, td0);
    			append_dev(td1, t5);
    			append_dev(td1, div1);
    			append_dev(div1, table1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table1, null);
    			}

    			append_dev(tr1, t6);
    			append_dev(tr1, td2);
    			append_dev(td2, div2);
    			append_dev(div2, textarea);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$source*/ 8) && t1_value !== (t1_value = /*$source*/ ctx[3].path + "")) set_data_dev(t1, t1_value);

    			if (/*$source*/ ctx[3].path) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*Object, _data, editorChanged*/ 36) {
    				each_value = Object.keys(/*_data*/ ctx[2]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*rerender*/ 1 && table1_id_value !== (table1_id_value = "uniq-" + /*rerender*/ ctx[0])) {
    				attr_dev(table1, "id", table1_id_value);
    			}

    			if (!current || dirty & /*$source*/ 8 && textarea_value_value !== (textarea_value_value = /*$source*/ ctx[3].content)) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(table2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(3, $source = $$value));
    	let data = [];
    	let rerender = 0;
    	let btnDisabled = true;

    	const routeHandler = obj => {
    		console.log("ws__send(getRoute)", obj);

    		if (window.mitm.files.route === undefined) {
    			window.mitm.files.route = obj;
    			$$invalidate(6, data = obj);
    		} else {
    			const { route } = window.mitm.files;
    			const newRoute = {};

    			for (let k in obj) {
    				newRoute[k] = route[k] ? route[k] : obj[k];
    				newRoute[k].content = obj[k].content;
    			}

    			window.mitm.files.route = newRoute;
    			$$invalidate(6, data = newRoute);
    		}

    		$$invalidate(0, rerender++, rerender);
    	};

    	onMount(async () => {
    		setTimeout(
    			() => {
    				ws__send("getRoute", "", routeHandler);
    			},
    			10
    		);
    	});

    	window.mitm.files.route_events.routeTable = () => {
    		ws__send("getRoute", "", routeHandler);
    	};

    	function btnSave(e) {
    		source$1.update(n => {
    			return { ...n, content: window.editor.getValue() };
    		});

    		console.log($source);

    		ws__send("saveRoute", $source, data => {
    			console.log("Done Save!");
    		});
    	}

    	let editbuffer;
    	let _timeout = null;

    	function editorChanged(e) {
    		if (e === false) {
    			$$invalidate(1, btnDisabled = true);
    			editbuffer = window.editor.getValue();
    		}

    		_timeout && clearTimeout(_timeout);

    		_timeout = setTimeout(
    			() => {
    				if (window.editor) {
    					$$invalidate(1, btnDisabled = window.editor.getValue() === editbuffer);
    					console.log(e);
    				}
    			},
    			500
    		);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("rerender" in $$props) $$invalidate(0, rerender = $$props.rerender);
    		if ("btnDisabled" in $$props) $$invalidate(1, btnDisabled = $$props.btnDisabled);
    		if ("editbuffer" in $$props) editbuffer = $$props.editbuffer;
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    		if ("_data" in $$props) $$invalidate(2, _data = $$props._data);
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 64) {
    			 $$invalidate(2, _data = data);
    		}
    	};

    	return [rerender, btnDisabled, _data, $source, btnSave, editorChanged];
    }

    class Table$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.7 */
    const file$8 = "src\\App.svelte";

    // (15:2) <Tab label="Route">
    function create_default_slot_2(ctx) {
    	let current;
    	const routetable = new Table$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(routetable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(routetable, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routetable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routetable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(routetable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(15:2) <Tab label=\\\"Route\\\">",
    		ctx
    	});

    	return block;
    }

    // (16:2) <Tab label="Logs">
    function create_default_slot_1(ctx) {
    	let current;
    	const logstable = new Table({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(logstable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(logstable, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logstable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logstable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logstable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(16:2) <Tab label=\\\"Logs\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:0) <Tabs style="is-boxed" size="is-small">
    function create_default_slot(ctx) {
    	let t;
    	let current;

    	const tab0 = new Tab({
    			props: {
    				label: "Route",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab1 = new Tab({
    			props: {
    				label: "Logs",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t = space();
    			create_component(tab1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(tab1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(tab1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(14:0) <Tabs style=\\\"is-boxed\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let current;

    	const tabs = new Tabs({
    			props: {
    				style: "is-boxed",
    				size: "is-small",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			attr_dev(main, "class", "main");
    			add_location(main, file$8, 12, 0, 318);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(tabs, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(tabs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWJzLnN2ZWx0ZSIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9zdG9yZXMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0l0ZW0uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9TaG93LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvVGFibGUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9UYWJsZS5zdmVsdGUiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoIXN0b3JlIHx8IHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICh0eXBlb2YgJCRzY29wZS5kaXJ0eSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMocHJvcHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmIChrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN1bHRba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb25jZShmbikge1xuICAgIGxldCByYW4gPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKHJhbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gbnVsbF90b19lbXB0eSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9zdG9yZV92YWx1ZShzdG9yZSwgcmV0LCB2YWx1ZSA9IHJldCkge1xuICAgIHN0b3JlLnNldCh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmNvbnN0IGhhc19wcm9wID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG5mdW5jdGlvbiBhY3Rpb25fZGVzdHJveWVyKGFjdGlvbl9yZXN1bHQpIHtcbiAgICByZXR1cm4gYWN0aW9uX3Jlc3VsdCAmJiBpc19mdW5jdGlvbihhY3Rpb25fcmVzdWx0LmRlc3Ryb3kpID8gYWN0aW9uX3Jlc3VsdC5kZXN0cm95IDogbm9vcDtcbn1cblxuY29uc3QgaXNfY2xpZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG5sZXQgbm93ID0gaXNfY2xpZW50XG4gICAgPyAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KClcbiAgICA6ICgpID0+IERhdGUubm93KCk7XG5sZXQgcmFmID0gaXNfY2xpZW50ID8gY2IgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKSA6IG5vb3A7XG4vLyB1c2VkIGludGVybmFsbHkgZm9yIHRlc3RpbmdcbmZ1bmN0aW9uIHNldF9ub3coZm4pIHtcbiAgICBub3cgPSBmbjtcbn1cbmZ1bmN0aW9uIHNldF9yYWYoZm4pIHtcbiAgICByYWYgPSBmbjtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBydW5fdGFza3Mobm93KSB7XG4gICAgdGFza3MuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgaWYgKCF0YXNrLmMobm93KSkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICAgICAgdGFzay5mKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGFza3Muc2l6ZSAhPT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG59XG4vKipcbiAqIEZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkhXG4gKi9cbmZ1bmN0aW9uIGNsZWFyX2xvb3BzKCkge1xuICAgIHRhc2tzLmNsZWFyKCk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdGFzayB0aGF0IHJ1bnMgb24gZWFjaCByYWYgZnJhbWVcbiAqIHVudGlsIGl0IHJldHVybnMgYSBmYWxzeSB2YWx1ZSBvciBpcyBhYm9ydGVkXG4gKi9cbmZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcbiAgICBsZXQgdGFzaztcbiAgICBpZiAodGFza3Muc2l6ZSA9PT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICAgICAgICB0YXNrcy5hZGQodGFzayA9IHsgYzogY2FsbGJhY2ssIGY6IGZ1bGZpbGwgfSk7XG4gICAgICAgIH0pLFxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIG5vZGUpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIGFuY2hvciB8fCBudWxsKTtcbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0b3BfcHJvcGFnYXRpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2VsZihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhub2RlLl9fcHJvdG9fXyk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmNzc1RleHQgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvcnNba2V5XSAmJiBkZXNjcmlwdG9yc1trZXldLnNldCkge1xuICAgICAgICAgICAgbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3ZnX2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcCBpbiBub2RlKSB7XG4gICAgICAgIG5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGF0dHIobm9kZSwgcHJvcCwgdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHhsaW5rX2F0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwKSB7XG4gICAgY29uc3QgdmFsdWUgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUucHVzaChncm91cFtpXS5fX3ZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IHVuZGVmaW5lZCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuICAgICAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pXG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07IC8vIFRPRE8gc3RyaXAgdW53YW50ZWQgYXR0cmlidXRlc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0LmRhdGEgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwgfHwgaW5wdXQudmFsdWUpIHtcbiAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKGVsZW1lbnQsIGZuKSB7XG4gICAgaWYgKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBvYmplY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvYmplY3QnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IGhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgb2JqZWN0LnR5cGUgPSAndGV4dC9odG1sJztcbiAgICBvYmplY3QudGFiSW5kZXggPSAtMTtcbiAgICBsZXQgd2luO1xuICAgIG9iamVjdC5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHdpbiA9IG9iamVjdC5jb250ZW50RG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgfTtcbiAgICBpZiAoL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsOiAoKSA9PiB7XG4gICAgICAgICAgICB3aW4gJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIgJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKGh0bWwsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5lID0gZWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuYSA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgIH1cbiAgICBtKHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRhcmdldCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICB9XG4gICAgdShodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLnUoaHRtbCk7XG4gICAgICAgIHRoaXMubSh0aGlzLnQsIHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuXG5sZXQgc3R5bGVzaGVldDtcbmxldCBhY3RpdmUgPSAwO1xubGV0IGN1cnJlbnRfcnVsZXMgPSB7fTtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuICAgIGxldCBoYXNoID0gNTM4MTtcbiAgICBsZXQgaSA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBpZiAoIXN0eWxlc2hlZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICAgICAgc3R5bGVzaGVldCA9IHN0eWxlLnNoZWV0O1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRfcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiBgYH0ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJylcbiAgICAgICAgLnNwbGl0KCcsICcpXG4gICAgICAgIC5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgIGlmIChuYW1lICYmICEtLWFjdGl2ZSlcbiAgICAgICAgY2xlYXJfcnVsZXMoKTtcbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBpID0gc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgIGN1cnJlbnRfcnVsZXMgPSB7fTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZ1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbmApO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZnRlclVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmFmdGVyX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX2Rlc3Ryb3kucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgLy8gVE9ETyBhcmUgdGhlcmUgc2l0dWF0aW9ucyB3aGVyZSBldmVudHMgY291bGQgYmUgZGlzcGF0Y2hlZFxuICAgICAgICAgICAgLy8gaW4gYSBzZXJ2ZXIgKG5vbi1ET00pIGVudmlyb25tZW50P1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBzZXRDb250ZXh0KGtleSwgY29udGV4dCkge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuc2V0KGtleSwgY29udGV4dCk7XG59XG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4oZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzLnNoaWZ0KCk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSBwcm9ncmFtLmIgLSB0O1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBnbG9iYWwpO1xuXG5mdW5jdGlvbiBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5kKDEpO1xuICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cbmZ1bmN0aW9uIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gdXBkYXRlX2tleWVkX2VhY2gob2xkX2Jsb2NrcywgZGlydHksIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcbiAgICBsZXQgbyA9IG9sZF9ibG9ja3MubGVuZ3RoO1xuICAgIGxldCBuID0gbGlzdC5sZW5ndGg7XG4gICAgbGV0IGkgPSBvO1xuICAgIGNvbnN0IG9sZF9pbmRleGVzID0ge307XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgb2xkX2luZGV4ZXNbb2xkX2Jsb2Nrc1tpXS5rZXldID0gaTtcbiAgICBjb25zdCBuZXdfYmxvY2tzID0gW107XG4gICAgY29uc3QgbmV3X2xvb2t1cCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG4gICAgICAgIGlmIChrZXkgaW4gb2xkX2luZGV4ZXMpXG4gICAgICAgICAgICBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcbiAgICB9XG4gICAgY29uc3Qgd2lsbF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGRpZF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIGluc2VydChibG9jaykge1xuICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgYmxvY2subShub2RlLCBuZXh0KTtcbiAgICAgICAgbG9va3VwLnNldChibG9jay5rZXksIGJsb2NrKTtcbiAgICAgICAgbmV4dCA9IGJsb2NrLmZpcnN0O1xuICAgICAgICBuLS07XG4gICAgfVxuICAgIHdoaWxlIChvICYmIG4pIHtcbiAgICAgICAgY29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3NbbyAtIDFdO1xuICAgICAgICBjb25zdCBuZXdfa2V5ID0gbmV3X2Jsb2NrLmtleTtcbiAgICAgICAgY29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG4gICAgICAgIGlmIChuZXdfYmxvY2sgPT09IG9sZF9ibG9jaykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgbmV4dCA9IG5ld19ibG9jay5maXJzdDtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgICAgIG4tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgYmxvY2tcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFsb29rdXAuaGFzKG5ld19rZXkpIHx8IHdpbGxfbW92ZS5oYXMobmV3X2tleSkpIHtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpZF9tb3ZlLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbHRhcy5nZXQobmV3X2tleSkgPiBkZWx0YXMuZ2V0KG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBkaWRfbW92ZS5hZGQobmV3X2tleSk7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKG8tLSkge1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW29dO1xuICAgICAgICBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9ibG9jay5rZXkpKVxuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgfVxuICAgIHdoaWxlIChuKVxuICAgICAgICBpbnNlcnQobmV3X2Jsb2Nrc1tuIC0gMV0pO1xuICAgIHJldHVybiBuZXdfYmxvY2tzO1xufVxuZnVuY3Rpb24gbWVhc3VyZShibG9ja3MpIHtcbiAgICBjb25zdCByZWN0cyA9IHt9O1xuICAgIGxldCBpID0gYmxvY2tzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICByZWN0c1tibG9ja3NbaV0ua2V5XSA9IGJsb2Nrc1tpXS5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiByZWN0cztcbn1cblxuZnVuY3Rpb24gZ2V0X3NwcmVhZF91cGRhdGUobGV2ZWxzLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgdXBkYXRlID0ge307XG4gICAgY29uc3QgdG9fbnVsbF9vdXQgPSB7fTtcbiAgICBjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG4gICAgbGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgbyA9IGxldmVsc1tpXTtcbiAgICAgICAgY29uc3QgbiA9IHVwZGF0ZXNbaV07XG4gICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG4pKVxuICAgICAgICAgICAgICAgICAgICB0b19udWxsX291dFtrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFjY291bnRlZF9mb3Jba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVba2V5XSA9IG5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXZlbHNbaV0gPSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9fbnVsbF9vdXQpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHVwZGF0ZSkpXG4gICAgICAgICAgICB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZTtcbn1cbmZ1bmN0aW9uIGdldF9zcHJlYWRfb2JqZWN0KHNwcmVhZF9wcm9wcykge1xuICAgIHJldHVybiB0eXBlb2Ygc3ByZWFkX3Byb3BzID09PSAnb2JqZWN0JyAmJiBzcHJlYWRfcHJvcHMgIT09IG51bGwgPyBzcHJlYWRfcHJvcHMgOiB7fTtcbn1cblxuLy8gc291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbmNvbnN0IGJvb2xlYW5fYXR0cmlidXRlcyA9IG5ldyBTZXQoW1xuICAgICdhbGxvd2Z1bGxzY3JlZW4nLFxuICAgICdhbGxvd3BheW1lbnRyZXF1ZXN0JyxcbiAgICAnYXN5bmMnLFxuICAgICdhdXRvZm9jdXMnLFxuICAgICdhdXRvcGxheScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdjb250cm9scycsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWZlcicsXG4gICAgJ2Rpc2FibGVkJyxcbiAgICAnZm9ybW5vdmFsaWRhdGUnLFxuICAgICdoaWRkZW4nLFxuICAgICdpc21hcCcsXG4gICAgJ2xvb3AnLFxuICAgICdtdWx0aXBsZScsXG4gICAgJ211dGVkJyxcbiAgICAnbm9tb2R1bGUnLFxuICAgICdub3ZhbGlkYXRlJyxcbiAgICAnb3BlbicsXG4gICAgJ3BsYXlzaW5saW5lJyxcbiAgICAncmVhZG9ubHknLFxuICAgICdyZXF1aXJlZCcsXG4gICAgJ3JldmVyc2VkJyxcbiAgICAnc2VsZWN0ZWQnXG5dKTtcblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgY2xhc3Nlc190b19hZGQpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgLi4uYXJncyk7XG4gICAgaWYgKGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmNsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGlmIChpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3Rlci50ZXN0KG5hbWUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZSArIFwiPVwiICsgSlNPTi5zdHJpbmdpZnkoU3RyaW5nKHZhbHVlKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnJiMzNDsnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBlc2NhcGVkID0ge1xuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShodG1sKSB7XG4gICAgcmV0dXJuIFN0cmluZyhodG1sKS5yZXBsYWNlKC9bXCInJjw+XS9nLCBtYXRjaCA9PiBlc2NhcGVkW21hdGNoXSk7XG59XG5mdW5jdGlvbiBlYWNoKGl0ZW1zLCBmbikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHN0ciArPSBmbihpdGVtc1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBtaXNzaW5nX2NvbXBvbmVudCA9IHtcbiAgICAkJHJlbmRlcjogKCkgPT4gJydcbn07XG5mdW5jdGlvbiB2YWxpZGF0ZV9jb21wb25lbnQoY29tcG9uZW50LCBuYW1lKSB7XG4gICAgaWYgKCFjb21wb25lbnQgfHwgIWNvbXBvbmVudC4kJHJlbmRlcikge1xuICAgICAgICBpZiAobmFtZSA9PT0gJ3N2ZWx0ZTpjb21wb25lbnQnKVxuICAgICAgICAgICAgbmFtZSArPSAnIHRoaXM9ey4uLn0nO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYDwke25hbWV9PiBpcyBub3QgYSB2YWxpZCBTU1IgY29tcG9uZW50LiBZb3UgbWF5IG5lZWQgdG8gcmV2aWV3IHlvdXIgYnVpbGQgY29uZmlnIHRvIGVuc3VyZSB0aGF0IGRlcGVuZGVuY2llcyBhcmUgY29tcGlsZWQsIHJhdGhlciB0aGFuIGltcG9ydGVkIGFzIHByZS1jb21waWxlZCBtb2R1bGVzYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBkZWJ1ZyhmaWxlLCBsaW5lLCBjb2x1bW4sIHZhbHVlcykge1xuICAgIGNvbnNvbGUubG9nKGB7QGRlYnVnfSAke2ZpbGUgPyBmaWxlICsgJyAnIDogJyd9KCR7bGluZX06JHtjb2x1bW59KWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyh2YWx1ZXMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXR1cm4gJyc7XG59XG5sZXQgb25fZGVzdHJveTtcbmZ1bmN0aW9uIGNyZWF0ZV9zc3JfY29tcG9uZW50KGZuKSB7XG4gICAgZnVuY3Rpb24gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICAgICAgY29uc3QgJCQgPSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LFxuICAgICAgICAgICAgY29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiBgYDtcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICB9KTtcbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCBwcm9wX3ZhbHVlcyA9IG9wdGlvbnMucHJvcHMgfHwge307XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5XG4gICAgfTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgcHJvcF92YWx1ZXMsIChpLCByZXQsIHZhbHVlID0gcmV0KSA9PiB7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICgkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZGVuIGJ5IGluc3RhbmNlLCBpZiBpdCBoYXMgcHJvcHNcbiAgICAgICAgfVxuICAgIH07XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCkge1xuICAgICAgICAvLyBvdmVycmlkZGVuIGJ5IGluc3RhbmNlLCBpZiBpdCBoYXMgcHJvcHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NSW5zZXJ0XCIsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVcIiwgeyBub2RlIH0pO1xuICAgIGRldGFjaChub2RlKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9iZXR3ZWVuX2RldihiZWZvcmUsIGFmdGVyKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYmVmb3JlX2RldihhZnRlcikge1xuICAgIHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9hZnRlcl9kZXYoYmVmb3JlKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbGlzdGVuX2Rldihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucywgaGFzX3ByZXZlbnRfZGVmYXVsdCwgaGFzX3N0b3BfcHJvcGFnYXRpb24pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSBvcHRpb25zID09PSB0cnVlID8gW1wiY2FwdHVyZVwiXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01BZGRFdmVudExpc3RlbmVyXCIsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyXCIsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyX2Rldihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlXCIsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0QXR0cmlidXRlXCIsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0UHJvcGVydHlcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBkYXRhc2V0X2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlLmRhdGFzZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0RGF0YXNldFwiLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0RGF0YVwiLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJ3RhcmdldCcgaXMgYSByZXF1aXJlZCBvcHRpb25gKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZGApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5maW5pdGUgbG9vcCBkZXRlY3RlZGApO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgU3ZlbHRlQ29tcG9uZW50LCBTdmVsdGVDb21wb25lbnREZXYsIFN2ZWx0ZUVsZW1lbnQsIGFjdGlvbl9kZXN0cm95ZXIsIGFkZF9hdHRyaWJ1dGUsIGFkZF9jbGFzc2VzLCBhZGRfZmx1c2hfY2FsbGJhY2ssIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXNzaWduLCBhdHRyLCBhdHRyX2RldiwgYmVmb3JlVXBkYXRlLCBiaW5kLCBiaW5kaW5nX2NhbGxiYWNrcywgYmxhbmtfb2JqZWN0LCBidWJibGUsIGNoZWNrX291dHJvcywgY2hpbGRyZW4sIGNsYWltX2NvbXBvbmVudCwgY2xhaW1fZWxlbWVudCwgY2xhaW1fc3BhY2UsIGNsYWltX3RleHQsIGNsZWFyX2xvb3BzLCBjb21wb25lbnRfc3Vic2NyaWJlLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVzY2FwZSwgZXNjYXBlZCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRDb250ZXh0LCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0LCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWVhc3VyZSwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB1cGRhdGVfa2V5ZWRfZWFjaCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCB0eXBlID0gJydcbiAgZXhwb3J0IGxldCBwYWNrID0gJ2ZhcydcbiAgZXhwb3J0IGxldCBpY29uXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG4gIGV4cG9ydCBsZXQgY3VzdG9tQ2xhc3MgPSAnJ1xuICBleHBvcnQgbGV0IGN1c3RvbVNpemUgPSAnJ1xuICBleHBvcnQgbGV0IGlzQ2xpY2thYmxlID0gZmFsc2VcbiAgZXhwb3J0IGxldCBpc0xlZnQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzUmlnaHQgPSBmYWxzZVxuXG4gIGxldCBuZXdDdXN0b21TaXplID0gJydcbiAgbGV0IG5ld1R5cGUgPSAnJ1xuXG4gICQ6IG5ld1BhY2sgPSBwYWNrIHx8ICdmYXMnXG5cbiAgJDoge1xuICAgIGlmIChjdXN0b21TaXplKSBuZXdDdXN0b21TaXplID0gY3VzdG9tU2l6ZVxuICAgIGVsc2Uge1xuICAgICAgc3dpdGNoIChzaXplKSB7XG4gICAgICAgIGNhc2UgJ2lzLXNtYWxsJzpcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpcy1tZWRpdW0nOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtbGcnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaXMtbGFyZ2UnOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtM3gnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJydcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkOiB7XG4gICAgaWYgKCF0eXBlKSBuZXdUeXBlID0gJydcbiAgICBsZXQgc3BsaXRUeXBlID0gW11cbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzcGxpdFR5cGUgPSB0eXBlLnNwbGl0KCctJylcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQga2V5IGluIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVba2V5XSkge1xuICAgICAgICAgIHNwbGl0VHlwZSA9IGtleS5zcGxpdCgnLScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3BsaXRUeXBlLmxlbmd0aCA8PSAxKSBuZXdUeXBlID0gJydcbiAgICBlbHNlIG5ld1R5cGUgPSBgaGFzLXRleHQtJHtzcGxpdFR5cGVbMV19YFxuICB9XG48L3NjcmlwdD5cblxuPHNwYW4gY2xhc3M9XCJpY29uIHtzaXplfSB7bmV3VHlwZX0geyhpc0xlZnQgJiYgJ2lzLWxlZnQnKSB8fCAnJ30geyhpc1JpZ2h0ICYmICdpcy1yaWdodCcpIHx8ICcnfVwiIGNsYXNzOmlzLWNsaWNrYWJsZT17aXNDbGlja2FibGV9IG9uOmNsaWNrPlxuICA8aSBjbGFzcz1cIntuZXdQYWNrfSBmYS17aWNvbn0ge2N1c3RvbUNsYXNzfSB7bmV3Q3VzdG9tU2l6ZX1cIiAvPlxuPC9zcGFuPlxuIiwiaW1wb3J0IHsgc2FmZV9ub3RfZXF1YWwsIG5vb3AsIHJ1bl9hbGwsIGlzX2Z1bmN0aW9uIH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuZXhwb3J0IHsgZ2V0X3N0b3JlX3ZhbHVlIGFzIGdldCB9IGZyb20gJy4uL2ludGVybmFsJztcblxuY29uc3Qgc3Vic2NyaWJlcl9xdWV1ZSA9IFtdO1xuLyoqXG4gKiBDcmVhdGVzIGEgYFJlYWRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyfXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gcmVhZGFibGUodmFsdWUsIHN0YXJ0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3Vic2NyaWJlOiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQpLnN1YnNjcmliZSxcbiAgICB9O1xufVxuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcbiAgICAgICAgaWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIGlmIChzdG9wKSB7IC8vIHN0b3JlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgY29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBzWzFdKCk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUucHVzaChzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5fcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuICAgICAgICBzZXQoZm4odmFsdWUpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuICAgICAgICBzdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuICAgICAgICB9XG4gICAgICAgIHJ1bih2YWx1ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHN1YnNjcmliZXJzLmluZGV4T2Yoc3Vic2NyaWJlcik7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cbmZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuICAgIGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG4gICAgY29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlXG4gICAgICAgID8gW3N0b3Jlc11cbiAgICAgICAgOiBzdG9yZXM7XG4gICAgY29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG4gICAgcmV0dXJuIHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIChzZXQpID0+IHtcbiAgICAgICAgbGV0IGluaXRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgbGV0IHBlbmRpbmcgPSAwO1xuICAgICAgICBsZXQgY2xlYW51cCA9IG5vb3A7XG4gICAgICAgIGNvbnN0IHN5bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0KTtcbiAgICAgICAgICAgIGlmIChhdXRvKSB7XG4gICAgICAgICAgICAgICAgc2V0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcnMgPSBzdG9yZXNfYXJyYXkubWFwKChzdG9yZSwgaSkgPT4gc3RvcmUuc3Vic2NyaWJlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdmFsdWVzW2ldID0gdmFsdWU7XG4gICAgICAgICAgICBwZW5kaW5nICY9IH4oMSA8PCBpKTtcbiAgICAgICAgICAgIGlmIChpbml0ZWQpIHtcbiAgICAgICAgICAgICAgICBzeW5jKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHBlbmRpbmcgfD0gKDEgPDwgaSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgaW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgc3luYygpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodW5zdWJzY3JpYmVycyk7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IGRlcml2ZWQsIHJlYWRhYmxlLCB3cml0YWJsZSB9O1xuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgc2V0Q29udGV4dCwgZ2V0Q29udGV4dCwgb25Nb3VudCwgb25EZXN0cm95LCBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCB7IGdldCwgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG4gIGltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAvKiogSW5kZXggb2YgdGhlIGFjdGl2ZSB0YWIgKHplcm8tYmFzZWQpXG4gICAqIEBzdmVsdGUtcHJvcCB7TnVtYmVyfSBbdmFsdWU9MF1cbiAgICogKi9cbiAgZXhwb3J0IGxldCB2YWx1ZSA9IDBcblxuICAvKiogU2l6ZSBvZiB0YWJzXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbc2l6ZV1cbiAgICogQHZhbHVlcyAkJHNpemVzJCRcbiAgICogKi9cbiAgZXhwb3J0IGxldCBzaXplID0gJydcblxuICAvKiogUG9zaXRpb24gb2YgdGFicyBsaXN0LCBob3Jpem9udGFsbHkuIEJ5IGRlZmF1bHQgdGhleSdyZSBwb3NpdGlvbmVkIHRvIHRoZSBsZWZ0XG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbcG9zaXRpb25dXG4gICAqIEB2YWx1ZXMgaXMtY2VudGVyZWQsIGlzLXJpZ2h0XG4gICAqICovXG4gIGV4cG9ydCBsZXQgcG9zaXRpb24gPSAnJ1xuXG4gIC8qKiBTdHlsZSBvZiB0YWJzXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbc3R5bGVdXG4gICAqIEB2YWx1ZXMgaXMtYm94ZWQsIGlzLXRvZ2dsZSwgaXMtdG9nZ2xlLXJvdW5kZWQsIGlzLWZ1bGx3aWR0aFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHN0eWxlID0gJydcblxuICBleHBvcnQgbGV0IGV4cGFuZGVkID0gZmFsc2VcblxuICBsZXQgYWN0aXZlVGFiID0gMFxuICAkOiBjaGFuZ2VUYWIodmFsdWUpXG5cbiAgY29uc3QgdGFicyA9IHdyaXRhYmxlKFtdKVxuXG4gIGNvbnN0IHRhYkNvbmZpZyA9IHtcbiAgICBhY3RpdmVUYWIsXG4gICAgdGFicyxcbiAgfVxuXG4gIHNldENvbnRleHQoJ3RhYnMnLCB0YWJDb25maWcpXG5cbiAgLy8gVGhpcyBvbmx5IHJ1bnMgYXMgdGFicyBhcmUgYWRkZWQvcmVtb3ZlZFxuICBjb25zdCB1bnN1YnNjcmliZSA9IHRhYnMuc3Vic2NyaWJlKHRzID0+IHtcbiAgICBpZiAodHMubGVuZ3RoID4gMCAmJiB0cy5sZW5ndGggPiB2YWx1ZSAtIDEpIHtcbiAgICAgIHRzLmZvckVhY2godCA9PiB0LmRlYWN0aXZhdGUoKSlcbiAgICAgIGlmICh0c1t2YWx1ZV0pIHRzW3ZhbHVlXS5hY3RpdmF0ZSgpXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIGNoYW5nZVRhYih0YWJOdW1iZXIpIHtcbiAgICBjb25zdCB0cyA9IGdldCh0YWJzKVxuICAgIC8vIE5PVEU6IGNoYW5nZSB0aGlzIGJhY2sgdG8gdXNpbmcgY2hhbmdlVGFiIGluc3RlYWQgb2YgYWN0aXZhdGUvZGVhY3RpdmF0ZSBvbmNlIHRyYW5zaXRpb25zL2FuaW1hdGlvbnMgYXJlIHdvcmtpbmdcbiAgICBpZiAodHNbYWN0aXZlVGFiXSkgdHNbYWN0aXZlVGFiXS5kZWFjdGl2YXRlKClcbiAgICBpZiAodHNbdGFiTnVtYmVyXSkgdHNbdGFiTnVtYmVyXS5hY3RpdmF0ZSgpXG4gICAgLy8gdHMuZm9yRWFjaCh0ID0+IHQuY2hhbmdlVGFiKHsgZnJvbTogYWN0aXZlVGFiLCB0bzogdGFiTnVtYmVyIH0pKVxuICAgIGFjdGl2ZVRhYiA9IHRhYkNvbmZpZy5hY3RpdmVUYWIgPSB0YWJOdW1iZXJcbiAgICBkaXNwYXRjaCgnYWN0aXZlVGFiQ2hhbmdlZCcsIHRhYk51bWJlcilcbiAgfVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNoYW5nZVRhYihhY3RpdmVUYWIpXG4gIH0pXG5cbiAgb25EZXN0cm95KCgpID0+IHtcbiAgICB1bnN1YnNjcmliZSgpXG4gIH0pXG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC50YWJzLXdyYXBwZXIge1xuICAgICYuaXMtZnVsbHdpZHRoIHtcbiAgICAgIC8qIFRPRE8gKi9cbiAgICB9XG5cbiAgICAudGFiLWNvbnRlbnQge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJ0YWJzLXdyYXBwZXJcIiBjbGFzczppcy1mdWxsd2lkdGg9e2V4cGFuZGVkfT5cbiAgPG5hdiBjbGFzcz1cInRhYnMge3NpemV9IHtwb3NpdGlvbn0ge3N0eWxlfVwiPlxuICAgIDx1bD5cbiAgICAgIHsjZWFjaCAkdGFicyBhcyB0YWIsIGluZGV4fVxuICAgICAgICA8bGkgY2xhc3M6aXMtYWN0aXZlPXtpbmRleCA9PT0gYWN0aXZlVGFifT5cbiAgICAgICAgICA8YSBocmVmIG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXsoKSA9PiBjaGFuZ2VUYWIoaW5kZXgpfT5cbiAgICAgICAgICAgIHsjaWYgdGFiLmljb259XG4gICAgICAgICAgICAgIDxJY29uIHBhY2s9e3RhYi5pY29uUGFja30gaWNvbj17dGFiLmljb259IC8+XG4gICAgICAgICAgICB7L2lmfVxuXG4gICAgICAgICAgICA8c3Bhbj57dGFiLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgIDwvbGk+XG4gICAgICB7L2VhY2h9XG4gICAgPC91bD5cbiAgPC9uYXY+XG4gIDxzZWN0aW9uIGNsYXNzPVwidGFiLWNvbnRlbnRcIj5cbiAgICA8c2xvdCAvPlxuICA8L3NlY3Rpb24+XG48L2Rpdj5cbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGJlZm9yZVVwZGF0ZSwgc2V0Q29udGV4dCwgZ2V0Q29udGV4dCwgdGljaywgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnXG5cbiAgLyoqIExhYmVsIGZvciB0YWJcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IGxhYmVsXG4gICAqICovXG4gIGV4cG9ydCBsZXQgbGFiZWxcblxuICAvKiogU2hvdyB0aGlzIGljb24gb24gbGVmdC1zaWRlIG9mIHRoZSB0YWJcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtpY29uXVxuICAgKiAqL1xuICBleHBvcnQgbGV0IGljb24gPSAnJ1xuXG4gIC8qKiBGb250YXdlc29tZSBpY29uIHBhY2sgdG8gdXNlLiBCeSBkZWZhdWx0IHRoZSA8Y29kZT5JY29uPC9jb2RlPiBjb21wb25lbnQgdXNlcyA8Y29kZT5mYXM8L2NvZGU+XG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbaWNvblBhY2tdXG4gICAqIEB2YWx1ZXMgPGNvZGU+ZmFzPC9jb2RlPiwgPGNvZGU+ZmFiPC9jb2RlPiwgZXRjLi4uXG4gICAqICovXG4gIGV4cG9ydCBsZXQgaWNvblBhY2sgPSAnJ1xuXG4gIGxldCBhY3RpdmUgPSBmYWxzZVxuXG4gIGxldCBlbFxuICBsZXQgaW5kZXhcbiAgbGV0IHN0YXJ0aW5nID0gZmFsc2VcbiAgbGV0IGRpcmVjdGlvbiA9ICcnXG4gIGxldCBpc0luID0gZmFsc2VcblxuICBjb25zdCB0YWJDb25maWcgPSBnZXRDb250ZXh0KCd0YWJzJylcblxuICBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hhbmdlVGFiKHsgZnJvbSwgdG8gfSkge1xuICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuXG5cbiAgICAvLyBjb25zb2xlLmxvZyh7IGluZGV4LCBmcm9tLCB0byB9LCB0byA9PT0gaW5kZXgpXG4gICAgaWYgKGZyb20gPT09IGluZGV4KSB7XG4gICAgICAvLyBUcmFuc2l0aW9uIG91dFxuICAgICAgZGlyZWN0aW9uID0gaW5kZXggPCB0byA/ICdsZWZ0JyA6ICdyaWdodCdcbiAgICB9IGVsc2UgaWYgKHRvID09PSBpbmRleCkge1xuICAgICAgLy8gVHJhbnNpdGlvbiBpbjsgc3RhcnQgYXQgZGlyZWN0aW9uIHdoZW4gcmVuZGVyZWQsIHRoZW4gcmVtb3ZlIGl0XG4gICAgICAvLyBjb25zb2xlLmxvZygnVFJBTlNJVElPTicsIHsgaW5kZXgsIHRvLCBhY3RpdmUgfSlcbiAgICAgIGFjdGl2ZSA9IHRydWVcbiAgICAgIGRpcmVjdGlvbiA9IGluZGV4ID4gZnJvbSA/ICdyaWdodCcgOiAnbGVmdCdcbiAgICAgIC8vIGF3YWl0IHRpY2soKVxuICAgICAgLy8gZGlyZWN0aW9uID0gJydcbiAgICB9IGVsc2UgZGlyZWN0aW9uID0gJydcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUluZGV4KCkge1xuICAgIGlmICghZWwpIHJldHVyblxuICAgIGluZGV4ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChlbC5wYXJlbnROb2RlLmNoaWxkcmVuLCBlbClcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHRyYW5zaXRpb25lbmQoZXZlbnQpIHtcbiAgICAvLyBjb25zb2xlLmxvZyh7IGluZGV4LCBhY3RpdmUsIGFjdGl2ZVRhYjogdGFiQ29uZmlnLmFjdGl2ZVRhYiB9KVxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50LnRhcmdldClcbiAgICBhY3RpdmUgPSBpbmRleCA9PT0gdGFiQ29uZmlnLmFjdGl2ZVRhYlxuICAgIGF3YWl0IHRpY2soKVxuICAgIGRpcmVjdGlvbiA9ICcnXG4gIH1cblxuICB0YWJDb25maWcudGFicy5zdWJzY3JpYmUodGFicyA9PiB7XG4gICAgdXBkYXRlSW5kZXgoKVxuICB9KVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIHVwZGF0ZUluZGV4KClcblxuICAgIHRhYkNvbmZpZy50YWJzLnVwZGF0ZSh0YWJzID0+IFtcbiAgICAgIC4uLnRhYnMsXG4gICAgICB7XG4gICAgICAgIGluZGV4LFxuICAgICAgICBsYWJlbCxcbiAgICAgICAgaWNvbixcbiAgICAgICAgaWNvblBhY2ssXG4gICAgICAgIGFjdGl2YXRlOiAoKSA9PiAoYWN0aXZlID0gdHJ1ZSksXG4gICAgICAgIGRlYWN0aXZhdGU6ICgpID0+IChhY3RpdmUgPSBmYWxzZSksXG4gICAgICAgIGNoYW5nZVRhYixcbiAgICAgIH0sXG4gICAgXSlcbiAgfSlcblxuICBiZWZvcmVVcGRhdGUoYXN5bmMgKCkgPT4ge1xuICAgIGlmIChpbmRleCA9PT0gdGFiQ29uZmlnLmFjdGl2ZVRhYiAmJiBkaXJlY3Rpb24pIHtcbiAgICAgIGF3YWl0IHRpY2soKVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRpcmVjdGlvbiA9ICcnXG4gICAgICB9KVxuICAgIH1cbiAgfSlcbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbiAgLy8gTk9URTogYWRkIHRyYW5zaXRpb25zL2FuaW1hdGlvbnMgYmFjayBvbmNlIHRoZXkncmUgd29ya2luZ1xuICAudGFiIHtcbiAgICBkaXNwbGF5OiBub25lO1xuICAgIGZsZXg6IDEgMCAxMDAlO1xuICAgIC8vIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm07XG4gICAgLy8gdHJhbnNpdGlvbjogdHJhbnNmb3JtIDQwMG1zIGVhc2UtaW47XG5cbiAgICAmLmlzLWFjdGl2ZSB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAvLyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG4gICAgfVxuXG4gICAgLy8gJi5zdGFydGluZyB7XG4gICAgLy8gICB0cmFuc2l0aW9uOiBub25lO1xuICAgIC8vIH1cblxuICAgIC8vICYubGVmdCB7XG4gICAgLy8gICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTEwMCUpO1xuICAgIC8vIH1cblxuICAgIC8vICYucmlnaHQge1xuICAgIC8vICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMCUpO1xuICAgIC8vIH1cblxuICAgIC8vICYuc3RhcnRpbmcge1xuICAgIC8vICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICAvLyB9XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXZcbiAgY2xhc3M9XCJ0YWIge2RpcmVjdGlvbn1cIlxuICBjbGFzczppcy1hY3RpdmU9e2FjdGl2ZX1cbiAgYmluZDp0aGlzPXtlbH1cbiAgYXJpYS1oaWRkZW49eyFhY3RpdmV9XG4gIG9uOnRyYW5zaXRpb25lbmQ9e3RyYW5zaXRpb25lbmR9PlxuICA8c2xvdCB7bGFiZWx9IHtpY29uUGFja30ge2ljb259IC8+XG48L2Rpdj5cbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcclxuXHJcbmV4cG9ydCBjb25zdCBzb3VyY2UgPSB3cml0YWJsZSh7XHJcbiAgZWxlbWVudDonJyxcclxuICB0aXRsZTonJyxcclxuICBwYXRoOicnLFxyXG4gIHVybDonJyxcclxufSk7XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuZXhwb3J0IGxldCBpdGVtO1xyXG5cclxuZnVuY3Rpb24gZW1wdHkoKSB7XHJcbiAgc291cmNlLnNldCh7XHJcbiAgICBlbGVtZW50OiAnJyxcclxuICAgIHRpdGxlOiAnJyxcclxuICAgIHBhdGg6ICcnLFxyXG4gICAgdXJsOiAnJyxcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XHJcbiAgY29uc3Qgb2JqID0gd2luZG93Lm1pdG0uZmlsZXMubG9nW2l0ZW1dO1xyXG4gIGlmIChpdGVtPT09JHNvdXJjZS5lbGVtZW50KSB7XHJcbiAgICBlbXB0eSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBlbXB0eSgpO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHNvdXJjZS51cGRhdGUobiA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGVsZW1lbnQ6IGl0ZW0sXHJcbiAgICAgICAgICB0aXRsZTogb2JqLnRpdGxlLFxyXG4gICAgICAgICAgcGF0aDogb2JqLnBhdGgsXHJcbiAgICAgICAgICB1cmw6IGl0ZW0ucmVwbGFjZSgvXi4rXFwubWl0bS1wbGF5LywnaHR0cDovL2xvY2FsaG9zdDozMDAwJyksXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSwgMCk7XHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRyIGNsYXNzPVwidHJcIj5cclxuICA8dGQ+XHJcbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5lbGVtZW50PT09aXRlbS5lbGVtZW50fVwiXHJcbiAgICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cclxuICAgIG9uOmNsaWNrPVwie2NsaWNrSGFuZGxlcn1cIlxyXG4gICAgPntpdGVtLnRpdGxlfTwvZGl2PlxyXG4gIDwvdGQ+XHJcbjwvdHI+XHJcblxyXG48c3R5bGU+XHJcbi50ZC1pdGVtOmhvdmVyIHtcclxuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcclxufVxyXG50ZCB7XHJcbiAgYm9yZGVyOiAxcHggc29saWQgIzk5OTtcclxufVxyXG4udGQtaXRlbSxcclxuLnRkLXNob3cge1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBwYWRkaW5nOiAwLjFyZW07XHJcbn1cclxuLnRkLWl0ZW0udHJ1ZSB7XHJcbiAgY29sb3I6IGJsdWU7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBiYWNrZ3JvdW5kOiBhbGljZWJsdWU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5sZXQgc291cmNlQ29kZSA9ICcnO1xyXG5cclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDb2RlTWlyb3IoKSB7XHJcbiAgaWYgKCF3aW5kb3cuc2hvd2NvZGUpIHtcclxuICAgIHdpbmRvdy5zaG93Y29kZSA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVtb2NvZGVcIiksIHtcclxuICAgICAgbGluZU51bWJlcnM6IHRydWUsXHJcbiAgICAgIG1vZGU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICBtYXRjaEJyYWNrZXRzOiB0cnVlXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gcmVwbGFjZXIobWF0Y2gsIHAxLCBwMikge1xyXG4gIHJldHVybiBbcDEsIHAyXS5qb2luKCcnKTtcclxufVxyXG5mdW5jdGlvbiBjb2RlTWlycm9yKGNvZGUpIHtcclxuICBpZiAoIWNvZGUpIHtcclxuICAgIHJldHVybiAnJztcclxuICB9XHJcbiAgaWYgKHdpbmRvdy5zaG93Y29kZSkge1xyXG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjc2hvdy1jb2RlIC5Db2RlTWlycm9yJyk7XHJcbiAgICBub2Rlcy5mb3JFYWNoKGVsZW1lbnQgPT4gZWxlbWVudC5yZW1vdmUoKSk7XHJcbiAgICB3aW5kb3cuc2hvd2NvZGUgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIHNldFRpbWVvdXQoKCkgPT4gc2V0dXBDb2RlTWlyb3IoKSwgMSlcclxuICByZXR1cm4gY29kZS5yZXBsYWNlKC9cIiguKylcIig6KS9nLCByZXBsYWNlcikuXHJcbiAgcmVwbGFjZSgvIChyZXNwfHJlcXN8dXJsKShcXHcrKTovZywgKG0scDEscDIpID0+IGAgXCIke3AxfSR7cDJ9XCI6YCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldFNvdXJjZSgpIHtcclxuICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goJHNvdXJjZS51cmwpO1xyXG4gIGNvbnN0IHRleHQgPSBhd2FpdCByZXNwLnRleHQoKTtcclxuXHJcbiAgaWYgKHJlc3Aub2spIHtcclxuICAgIHNvdXJjZUNvZGUgPSB0ZXh0O1xyXG4gICAgY29uc29sZS5sb2coJ0ZldGNoIHN1Y2Nlc3MnKVxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zb2xlLmxvZygnRmV0Y2ggRXJyaXInLCByZXNwLnN0YXR1cylcclxuICB9XHJcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkrJyc7XHJcbn1cclxuXHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdj5cclxuICB7I2lmICRzb3VyY2UudGl0bGUubWF0Y2goJy5wbmcnKX1cclxuICAgIDxpbWcgc3JjPVwieyRzb3VyY2UudXJsfVwiIGFsdD1cImltYWdlXCIvPlxyXG4gIHs6ZWxzZSBpZiAkc291cmNlLnRpdGxlLm1hdGNoKCcuanNvbicpfVxyXG4gICAgPGRpdiBpZD1cInNob3ctY29kZVwiIGRhdGEtZHVtbXk9e2dldFNvdXJjZSgpfT5cclxuICAgICAgPHRleHRhcmVhIGlkPVwiZGVtb2NvZGVcIj57Y29kZU1pcnJvcihzb3VyY2VDb2RlKX08L3RleHRhcmVhPlxyXG4gICAgPC9kaXY+XHJcbiAgezplbHNlfVxyXG4gICAgPGJ1dHRvbj5YPC9idXR0b24+XHJcbiAgey9pZn1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbiNzaG93LWNvZGUge1xyXG4gIGZvbnQtc2l6ZTogMTJweDtcclxuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAzMXB4KTtcclxuICB3aWR0aDogY2FsYygxMDB2dyAtIDE2M3B4KTtcclxuICBvdmVyZmxvdzogYXV0bztcclxufVxyXG4jZGVtb2NvZGUge1xyXG4gIGRpc3BsYXk6IG5vbmU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcbmltcG9ydCBTaG93IGZyb20gJy4vU2hvdy5zdmVsdGUnO1xuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5sZXQgZGF0YSA9ICBbXTtcbiQ6IF9kYXRhID0gZGF0YTtcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHdzX19zZW5kKCdnZXRMb2cnLCAnJywgbG9nSGFuZGxlcilcbiAgfSwgMTApO1xufSk7XG5cbmNvbnN0IGxvZ0hhbmRsZXIgPSBvYmogPT4ge1xuICBjb25zb2xlLmxvZygnd3NfX3NlbmQoZ2V0TG9nKScsIG9iaik7XG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5sb2c9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5sb2cgPSBvYmo7XG4gICAgZGF0YSA9IG9iajtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB7bG9nfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld0xvZyA9IHt9O1xuICAgIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgICBuZXdMb2dba10gPSBsb2dba10gPyBsb2dba10gOiBvYmpba107IFxuICAgIH1cbiAgICB3aW5kb3cubWl0bS5maWxlcy5sb2cgPSBuZXdMb2dcbiAgICBkYXRhID0gbmV3TG9nO1xuICB9XG4gIHJlcmVuZGVyKys7XG59XG53aW5kb3cubWl0bS5maWxlcy5sb2dfZXZlbnRzLkxvZ3NUYWJsZSA9ICgpID0+IHtcbiAgd3NfX3NlbmQoJ2dldExvZycsICcnLCBsb2dIYW5kbGVyKVxufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxkaXYgY2xhc3M9XCJ2Ym94IGxlZnRcIj5cbiAgICA8dGFibGU+XG4gICAgICA8dHI+XG4gICAgICAgIDx0ZD4tTG9ncy08L3RkPlxuICAgICAgPC90cj5cbiAgICA8L3RhYmxlPlxuICAgIDxkaXYgY2xhc3M9XCJ0YWJsZS1jb250YWluZXJcIj5cbiAgICAgIDx0YWJsZT5cbiAgICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICAgICAgICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fS8+XG4gICAgICAgIHsvZWFjaH1cbiAgICAgIDwvdGFibGU+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICB7I2lmICRzb3VyY2UuZWxlbWVudH1cbiAgICA8ZGl2IGNsYXNzPVwidmJveCByaWdodFwiPlxuICAgICAgPFNob3cvPlxuICAgIDwvZGl2PlxuICB7L2lmfVxuPC9kaXY+XG5cbjxzdHlsZT5cbi52Ym94LnJpZ2h0IHtcbiAgcmlnaHQ6IDA7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgYmFja2dyb3VuZDogI2YxZjdmN2UzO1xuICB3aWR0aDogY2FsYygxMDB2dyAtIDE2M3B4KTtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XG59XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbi50YWJsZS1jb250YWluZXIge1xuICBvdmVyZmxvdzogYXV0bztcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNDVweCk7XG59XG50YWJsZSB7XG4gIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XG4gIGZvbnQtZmFtaWx5OiAgQ29uc29sYXMsIEx1Y2lkYSBDb25zb2xlLCBDb3VyaWVyIE5ldywgbW9ub3NwYWNlO1xuICBmb250LXNpemU6IDEycHg7XG4gIHdpZHRoOiAxMDAlO1xufVxudGQge1xuICBib3JkZXI6IDFweCBzb2xpZCAjOTk5O1xuICBwYWRkaW5nOiAwLjFyZW07XG59XG48L3N0eWxlPlxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcclxuICBjb250ZW50OicnLFxyXG4gIHBhdGg6JycsXHJcbn0pO1xyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5leHBvcnQgbGV0IG9uQ2hhbmdlZDtcclxuXHJcbmZ1bmN0aW9uIHNldHVwQ29kZU1pcm9yKCkge1xyXG4gIGlmICghd2luZG93LmVkaXRvcikge1xyXG4gICAgd2luZG93LmVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVtb3RleHRcIiksIHtcclxuICAgICAgbGluZU51bWJlcnM6IHRydWUsXHJcbiAgICAgIG1vZGU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICBtYXRjaEJyYWNrZXRzOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIGVkaXRvci5vbignY2hhbmdlcycsIG9uQ2hhbmdlZCk7XHJcbiAgICBvbkNoYW5nZWQoZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxub25Nb3VudChhc3luYyAoKSA9PiBzZXR1cENvZGVNaXJvcigpKVxyXG5cclxuZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcclxuICBsZXQge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICBjb25zdCBvYmogPSB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZVtpdGVtXTtcclxuICBjb25zb2xlLmxvZyhpdGVtLCBvYmopO1xyXG4gIGlmICh3aW5kb3cuZWRpdG9yKSB7XHJcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb2RlLW1pcnJvciAuQ29kZU1pcnJvcicpO1xyXG4gICAgbm9kZXMuZm9yRWFjaChlbGVtZW50ID0+IGVsZW1lbnQucmVtb3ZlKCkpO1xyXG4gICAgd2luZG93LmVkaXRvciA9IHVuZGVmaW5lZDtcclxuICB9XHJcbiAgc2V0VGltZW91dCgoKSA9PiBzZXR1cENvZGVNaXJvcigpLCAxMDApXHJcbiAgc291cmNlLnNldCh7XHJcbiAgICBjb250ZW50OiBvYmouY29udGVudCxcclxuICAgIHBhdGg6IG9iai5wYXRoLFxyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRyIGNsYXNzPVwidHJcIj5cclxuICA8dGQ+XHJcbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5wYXRoPT09aXRlbS5wYXRofVwiXHJcbiAgICAgIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxyXG4gICAgICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuICAgID57aXRlbS50aXRsZX08L2Rpdj5cclxuICA8L3RkPlxyXG48L3RyPlxyXG5cclxuPHN0eWxlPlxyXG4udGQtaXRlbTpob3ZlciB7XHJcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XHJcbn1cclxudGQge1xyXG4gIGJvcmRlcjogMXB4IHNvbGlkICM5OTk7XHJcbn1cclxuLnRkLWl0ZW0sXHJcbi50ZC1zaG93IHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZDogYWxpY2VibHVlO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xuXG5sZXQgZGF0YSA9IFtdO1xubGV0IHJlcmVuZGVyID0gMDtcbmxldCBidG5EaXNhYmxlZCA9IHRydWU7XG5cbiQ6IF9kYXRhID0gZGF0YTtcblxuY29uc3Qgcm91dGVIYW5kbGVyID0gb2JqID0+IHtcbiAgY29uc29sZS5sb2coJ3dzX19zZW5kKGdldFJvdXRlKScsIG9iaik7XG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5yb3V0ZT09PXVuZGVmaW5lZCkge1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlID0gb2JqO1xuICAgIGRhdGEgPSBvYmo7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qge3JvdXRlfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld1JvdXRlID0ge307XG4gICAgZm9yIChsZXQgayBpbiBvYmopIHtcbiAgICAgIG5ld1JvdXRlW2tdID0gcm91dGVba10gPyByb3V0ZVtrXSA6IG9ialtrXTtcbiAgICAgIG5ld1JvdXRlW2tdLmNvbnRlbnQgPSBvYmpba10uY29udGVudDtcbiAgICB9XG4gICAgd2luZG93Lm1pdG0uZmlsZXMucm91dGUgPSBuZXdSb3V0ZVxuICAgIGRhdGEgPSBuZXdSb3V0ZTtcbiAgfVxuICByZXJlbmRlcisrO1xufVxuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgd3NfX3NlbmQoJ2dldFJvdXRlJywgJycsIHJvdXRlSGFuZGxlcilcbiAgfSwgMTApO1xuXG59KTtcblxud2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzLnJvdXRlVGFibGUgPSAoKSA9PiB7XG4gIHdzX19zZW5kKCdnZXRSb3V0ZScsICcnLCByb3V0ZUhhbmRsZXIpO1xufVxuXG5mdW5jdGlvbiBidG5TYXZlKGUpIHtcbiAgc291cmNlLnVwZGF0ZShuID0+IHtcbiAgICByZXR1cm4gey4uLm4sIGNvbnRlbnQ6IHdpbmRvdy5lZGl0b3IuZ2V0VmFsdWUoKX1cbiAgfSlcbiAgY29uc29sZS5sb2coJHNvdXJjZSk7XG5cbiAgd3NfX3NlbmQoJ3NhdmVSb3V0ZScsICRzb3VyY2UsIGRhdGEgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdEb25lIFNhdmUhJyk7XG4gIH0pO1xufVxuXG5sZXQgZWRpdGJ1ZmZlcjtcbmxldCBfdGltZW91dCA9IG51bGw7XG5mdW5jdGlvbiBlZGl0b3JDaGFuZ2VkKGUpIHtcbiAgaWYgKGU9PT1mYWxzZSkge1xuICAgIGJ0bkRpc2FibGVkID0gdHJ1ZTtcbiAgICBlZGl0YnVmZmVyID0gd2luZG93LmVkaXRvci5nZXRWYWx1ZSgpO1xuICB9XG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XG4gIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKHdpbmRvdy5lZGl0b3Ipe1xuICAgICAgYnRuRGlzYWJsZWQgPSAod2luZG93LmVkaXRvci5nZXRWYWx1ZSgpPT09ZWRpdGJ1ZmZlcilcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH1cbiAgfSwgNTAwKSAgXG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImZpbGUtcGF0aFwiPlxuUGF0aDp7JHNvdXJjZS5wYXRofVxueyNpZiAkc291cmNlLnBhdGh9XG5cdDxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIDxidXR0b24gY2xhc3M9XCJidG4tc2F2ZVwiXG4gIGRpc2FibGVkPXtidG5EaXNhYmxlZH1cbiAgb246Y2xpY2s9XCJ7YnRuU2F2ZX1cIj5TYXZlPC9idXR0b24+XG4gIDwvZGl2Plxuey9pZn1cbjwvZGl2PlxuPHRhYmxlIGNsYXNzPVwibWFpbi10YWJsZVwiPlxuICA8dHI+XG4gICAgPHRkIGNsYXNzPVwibWFpbi10ZDFcIj5cbiAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlLXRpdGxlXCI+PHRyPjx0ZD4tUm91dGUocyktPC90ZD48L3RyPjwvdGFibGU+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFibGUtY29udGFpbmVyXCI+XG4gICAgICA8dGFibGUgaWQ9XCJ1bmlxLXtyZXJlbmRlcn1cIj5cbiAgICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICAgICAgICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSBvbkNoYW5nZWQ9e2VkaXRvckNoYW5nZWR9Lz5cbiAgICAgICAgey9lYWNofVxuICAgICAgPC90YWJsZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvdGQ+XG4gICAgPHRkPlxuICAgIDxkaXYgaWQ9XCJjb2RlLW1pcnJvclwiPlxuICAgICAgPHRleHRhcmVhIGlkPVwiZGVtb3RleHRcIj57JHNvdXJjZS5jb250ZW50fTwvdGV4dGFyZWE+XG4gICAgPC9kaXY+XG4gICAgPC90ZD5cbiAgPC90cj5cbjwvdGFibGU+XG5cbjxzdHlsZT5cbi5maWxlLXBhdGgge1xuICBmb250LWZhbWlseTogYXV0bztcbiAgZm9udC1zaXplOiAwLjllbTtcbiAgY29sb3I6IGJsdWU7XG59XG4uYnRuLWNvbnRhaW5lciB7XG4gIGZsb2F0OiByaWdodDtcbiAgcGFkZGluZy1yaWdodDogNHB4O1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcbiAgZm9udC1zaXplOiAxMHB4O1xufVxuLm1haW4tdGFibGUge1xuICB3aWR0aDogMTAwJVxufVxuLm1haW4tdGQxIHtcbiAgd2lkdGg6IDE0NXB4O1xufVxuI2NvZGUtbWlycm9yIHtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNjFweCk7XG4gIHdpZHRoOiBjYWxjKDEwMHZ3IC0gMTYzcHgpO1xuICBvdmVyZmxvdzogYXV0bztcbn1cbi50YWJsZS10aXRsZSB7XG4gIHdpZHRoOiAxMDAlO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgYmFja2dyb3VuZC1jb2xvcjogYmlzcXVlO1xufVxuLnRhYmxlLWNvbnRhaW5lciB7XG4gIG92ZXJmbG93OiBhdXRvO1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA5NnB4KTtcbn1cbnRhYmxlIHtcbiAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcbiAgZm9udC1mYW1pbHk6ICBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgLyogd2lkdGg6IDEwMCU7ICovXG59XG50ZCB7XG4gIGJvcmRlcjogMXB4IHNvbGlkICM5OTk7XG4gIHBhZGRpbmc6IDAuMXJlbTtcbn1cbjwvc3R5bGU+XG4iLCJpbXBvcnQgQXBwIGZyb20gJy4vQXBwLnN2ZWx0ZSc7XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoe1xuXHR0YXJnZXQ6IGRvY3VtZW50LmJvZHksXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgYXBwO1xuIl0sIm5hbWVzIjpbImdldCIsInNvdXJjZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7SUFBQSxTQUFTLElBQUksR0FBRyxHQUFHO0lBRW5CLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDMUI7SUFDQSxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksR0FBRztJQUN2QixRQUFR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
