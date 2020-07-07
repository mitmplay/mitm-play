
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
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value)
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled)
                        task = null;
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
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

    /* src\components\box\BStatic.svelte generated by Svelte v3.16.7 */

    const file$3 = "src\\components\\box\\BStatic.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "table-container svelte-xj8c2j");
    			attr_dev(div0, "style", div0_style_value = /*resize*/ ctx[0]());
    			add_location(div0, file$3, 9, 2, 158);
    			attr_dev(div1, "class", "vbox left svelte-xj8c2j");
    			add_location(div1, file$3, 8, 0, 131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
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
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { height } = $$props;

    	function resize() {
    		return height ? `height: calc(100vh - ${height}px);` : "";
    	}

    	const writable_props = ["height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BStatic> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { height };
    	};

    	$$self.$inject_state = $$props => {
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	return [resize, height, $$scope, $$slots];
    }

    class BStatic extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { height: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BStatic",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<BStatic> was created without expected prop 'height'");
    		}
    	}

    	get height() {
    		throw new Error("<BStatic>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<BStatic>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\box\Splitter.svelte generated by Svelte v3.16.7 */
    const file$4 = "src\\components\\box\\Splitter.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let div_style_value;
    	let draggable_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resize svelte-1507c6x");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$4, 76, 0, 1831);
    			dispose = action_destroyer(draggable_action = /*draggable*/ ctx[0].call(null, div));
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { height } = $$props;
    	const dispatch = createEventDispatcher();
    	let dropTarget;

    	function draggable(node, params) {
    		let lastX;
    		let parentX;
    		let offsetX = 0;
    		const offset = spring({ x: offsetX, y: 0 }, { stiffness: 0.2, damping: 0.4 });

    		offset.subscribe(offset => {
    			const parent = node.parentNode;

    			if (parent) {
    				const left = parentX + offset.x;
    				parent.style.left = `${left}px`;
    				parent.style.width = `calc(100vw - ${left}px`;
    			}
    		});

    		node.addEventListener("mousedown", handleMousedown);

    		function handleMousedown(event) {
    			event.preventDefault();
    			lastX = event.clientX;
    			parentX = node.parentNode.offsetLeft;
    			node.classList.add("dragged");
    			dispatch("dragstart", { target: node, lastX });
    			window.addEventListener("mousemove", handleMousemove);
    			window.addEventListener("mouseup", handleMouseup);
    		}

    		function handleMousemove(e) {
    			offsetX += e.clientX - lastX;
    			offset.set({ x: offsetX, y: 0 });
    			lastX = e.clientX;

    			dispatch("drag", {
    				target: node,
    				left: node.parentNode.offsetLeft
    			});
    		}

    		function handleMouseup(event) {
    			offsetX = 0;
    			dropTarget = null;
    			lastX = undefined;
    			parentX = undefined;
    			node.classList.remove("dragged");
    			offset.set({ x: node.offsetLeft, y: 0 });

    			dispatch("dragend", {
    				target: node,
    				left: node.parentNode.offsetLeft
    			});

    			window.removeEventListener("mousemove", handleMousemove);
    			window.removeEventListener("mouseup", handleMouseup);
    		}

    		return {
    			destroy() {
    				node.removeEventListener("mousedown", handleMousedown);
    			}
    		};
    	}

    	function resize() {
    		return height ? `height: calc(100vh - ${height}px);` : "";
    	}

    	const writable_props = ["height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Splitter> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    	};

    	$$self.$capture_state = () => {
    		return { height, dropTarget };
    	};

    	$$self.$inject_state = $$props => {
    		if ("height" in $$props) $$invalidate(2, height = $$props.height);
    		if ("dropTarget" in $$props) dropTarget = $$props.dropTarget;
    	};

    	return [draggable, resize, height];
    }

    class Splitter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { height: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Splitter",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*height*/ ctx[2] === undefined && !("height" in props)) {
    			console.warn("<Splitter> was created without expected prop 'height'");
    		}
    	}

    	get height() {
    		throw new Error("<Splitter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Splitter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\box\BResize.svelte generated by Svelte v3.16.7 */
    const file$5 = "src\\components\\box\\BResize.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let t;
    	let div_style_value;
    	let current;

    	const splitter = new Splitter({
    			props: { height: /*height*/ ctx[0] },
    			$$inline: true
    		});

    	splitter.$on("drag", /*dragged*/ ctx[2]);
    	splitter.$on("dragend", /*dragend*/ ctx[3]);
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(splitter.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "vbox right svelte-z6b6h9");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$5, 26, 0, 497);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(splitter, div, null);
    			append_dev(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const splitter_changes = {};
    			if (dirty & /*height*/ 1) splitter_changes.height = /*height*/ ctx[0];
    			splitter.$set(splitter_changes);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 64) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(splitter.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(splitter.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(splitter);
    			if (default_slot) default_slot.d(detaching);
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
    	let { left } = $$props;
    	let { height } = $$props;
    	const dispatch = createEventDispatcher();

    	function resize() {
    		let css = `left: ${left}px;width: calc(100vw - ${left}px);`;

    		if (height) {
    			css += `height: calc(100vh - ${height}px);`;
    		}

    		return css;
    	}

    	function dragged(e) {
    		dispatch("drag", e.detail);
    	}

    	function dragend(e) {
    		dispatch("dragend", e.detail);
    	}

    	const writable_props = ["left", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BResize> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { left, height };
    	};

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    	};

    	return [height, resize, dragged, dragend, left, dispatch, $$scope, $$slots];
    }

    class BResize extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { left: 4, height: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BResize",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*left*/ ctx[4] === undefined && !("left" in props)) {
    			console.warn("<BResize> was created without expected prop 'left'");
    		}

    		if (/*height*/ ctx[0] === undefined && !("height" in props)) {
    			console.warn("<BResize> was created without expected prop 'height'");
    		}
    	}

    	get left() {
    		throw new Error("<BResize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<BResize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<BResize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<BResize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\box\BHeader.svelte generated by Svelte v3.16.7 */

    const file$6 = "src\\components\\box\\BHeader.svelte";

    function create_fragment$6(ctx) {
    	let table;
    	let tr;
    	let td;
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "td-header svelte-1cifg6u");
    			add_location(div, file$6, 3, 6, 54);
    			attr_dev(td, "class", "svelte-1cifg6u");
    			add_location(td, file$6, 2, 4, 42);
    			add_location(tr, file$6, 1, 2, 32);
    			attr_dev(table, "class", "table-header svelte-1cifg6u");
    			add_location(table, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr);
    			append_dev(tr, td);
    			append_dev(td, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
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
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
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
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots];
    }

    class BHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BHeader",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\box\BTable.svelte generated by Svelte v3.16.7 */

    const file$7 = "src\\components\\box\\BTable.svelte";

    function create_fragment$7(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			attr_dev(table, "class", "table-content svelte-11lz7tf");
    			add_location(table, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			if (default_slot) {
    				default_slot.m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
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
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
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
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots];
    }

    class BTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BTable",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\logs\Button.svelte generated by Svelte v3.16.7 */
    const file$8 = "src\\components\\logs\\Button.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let button;
    	let svg;
    	let path;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			set_style(path, "fill", "red");
    			attr_dev(path, "d", "M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z");
    			add_location(path, file$8, 12, 89, 343);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$8, 12, 0, 254);
    			attr_dev(button, "class", "svelte-1jw2ksx");
    			add_location(button, file$8, 11, 0, 222);
    			attr_dev(div, "class", "btn-container svelte-1jw2ksx");
    			add_location(div, file$8, 10, 0, 193);
    			dispose = listen_dev(button, "click", btnClear, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
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

    function btnClear(e) {
    	ws__send("clearLogs", { browserName: "chromium" }, data => {
    		console.log("Done Clear!");
    	});
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\logs\Item.svelte generated by Svelte v3.16.7 */
    const file$9 = "src\\components\\logs\\Item.svelte";

    function create_fragment$9(ctx) {
    	let tr;
    	let td;
    	let div;
    	let span0;
    	let t0_value = /*item*/ ctx[0].general.status + "";
    	let t0;
    	let span0_class_value;
    	let t1;
    	let span1;
    	let t2_value = /*item*/ ctx[0].general.method + "";
    	let t2;
    	let span1_class_value;
    	let t3;
    	let span2;
    	let t4_value = u(/*item*/ ctx[0]) + "";
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = p(/*item*/ ctx[0]) + "";
    	let t6;
    	let div_class_value;
    	let div_data_item_value;
    	let td_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			span3 = element("span");
    			t6 = text(t6_value);
    			attr_dev(span0, "class", span0_class_value = "status " + s(/*item*/ ctx[0]) + " svelte-1610rot");
    			add_location(span0, file$9, 63, 6, 1307);
    			attr_dev(span1, "class", span1_class_value = "method " + m(/*item*/ ctx[0]) + " svelte-1610rot");
    			add_location(span1, file$9, 64, 6, 1375);
    			attr_dev(span2, "class", "url");
    			add_location(span2, file$9, 65, 6, 1443);
    			attr_dev(span3, "class", "prm svelte-1610rot");
    			add_location(span3, file$9, 66, 6, 1486);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].element === /*item*/ ctx[0].element) + " svelte-1610rot");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$9, 59, 4, 1178);
    			attr_dev(td, "class", td_class_value = "" + (null_to_empty(/*item*/ ctx[0].element ? "selected" : "") + " svelte-1610rot"));
    			add_location(td, file$9, 58, 2, 1127);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$9, 57, 0, 1108);
    			dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, div);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, span2);
    			append_dev(span2, t4);
    			append_dev(div, t5);
    			append_dev(div, span3);
    			append_dev(span3, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].general.status + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "status " + s(/*item*/ ctx[0]) + " svelte-1610rot")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*item*/ ctx[0].general.method + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "method " + m(/*item*/ ctx[0]) + " svelte-1610rot")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = u(/*item*/ ctx[0]) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = p(/*item*/ ctx[0]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].element === /*item*/ ctx[0].element) + " svelte-1610rot")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_item_value !== (div_data_item_value = /*item*/ ctx[0].element)) {
    				attr_dev(div, "data-item", div_data_item_value);
    			}

    			if (dirty & /*item*/ 1 && td_class_value !== (td_class_value = "" + (null_to_empty(/*item*/ ctx[0].element ? "selected" : "") + " svelte-1610rot"))) {
    				attr_dev(td, "class", td_class_value);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function empty$1() {
    	source.set({
    		element: "",
    		title: "",
    		path: "",
    		url: ""
    	});
    }

    function s({ general: g }) {
    	return `_${Math.trunc(g.status / 100)}`;
    }

    function m({ general: g }) {
    	return `${g.method.toLowerCase()}`;
    }

    function u({ general: g }) {
    	if (g.url.match("/log/")) {
    		return g.url.split("@")[1];
    	} else {
    		return `${g.url.split("?")[0]}`;
    	}
    }

    function p({ general: g }) {
    	if (g.url.match("/log/")) {
    		return "";
    	} else {
    		const parms = g.url.split("?")[1];
    		return parms ? `?${parms}` : "";
    	}
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let { item } = $$props;

    	function clickHandler(e) {
    		let { item } = e.currentTarget.dataset;

    		if (item === $source.element) {
    			empty$1();
    		} else {
    			empty$1();

    			setTimeout(
    				() => {
    					const o = window.mitm.files.log[item];

    					source.update(n => {
    						return {
    							element: item,
    							title: o.title,
    							path: o.path,
    							url: item.replace(/^.+\.mitm-play/, "https://localhost:3001")
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
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$9.name
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
    const file$a = "src\\components\\logs\\Show.svelte";

    // (51:2) {:else}
    function create_else_block(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "X";
    			add_location(button, file$a, 51, 4, 1340);
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
    		source: "(51:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:41) 
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
    			attr_dev(textarea, "class", "svelte-1ymqjd6");
    			add_location(textarea, file$a, 48, 6, 1252);
    			attr_dev(div, "id", "show-code");
    			attr_dev(div, "data-dummy", div_data_dummy_value = /*getSource*/ ctx[2]());
    			attr_dev(div, "class", "svelte-1ymqjd6");
    			add_location(div, file$a, 47, 4, 1199);
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
    		source: "(47:41) ",
    		ctx
    	});

    	return block;
    }

    // (45:2) {#if $source.title.match('.png')}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*$source*/ ctx[1].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image");
    			add_location(img, file$a, 45, 4, 1112);
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
    		source: "(45:2) {#if $source.title.match('.png')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
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
    			attr_dev(div, "class", "item-show svelte-1ymqjd6");
    			add_location(div, file$a, 43, 0, 1046);
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
    		id: create_fragment$a.name,
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
    	return code.replace(/   "(.+)"(:)/g, (m, p1, p2) => `   '${p1}':`).replace(/ "(.+)"(:)/g, (m, p1, p2) => ` \`${p1}\`:`);
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Show",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\logs\Table.svelte generated by Svelte v3.16.7 */
    const file$b = "src\\components\\logs\\Table.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (56:4) <BHeader>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("-Logs-");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(56:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (59:6) {#each Object.keys(_data) as item}
    function create_each_block$1(ctx) {
    	let current;

    	const item = new Item({
    			props: {
    				item: {
    					element: /*item*/ ctx[7],
    					.../*_data*/ ctx[1][/*item*/ ctx[7]]
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

    			if (dirty & /*_data*/ 2) item_changes.item = {
    				element: /*item*/ ctx[7],
    				.../*_data*/ ctx[1][/*item*/ ctx[7]]
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
    		source: "(59:6) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    // (58:4) <BTable>
    function create_default_slot_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, _data*/ 2) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(58:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (55:2) <BStatic>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button = new Button({ $$inline: true });

    	const btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bheader.$$.fragment);
    			t0 = space();
    			create_component(button.$$.fragment);
    			t1 = space();
    			create_component(btable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bheader, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(btable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bheader_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			const btable_changes = {};

    			if (dirty & /*$$scope, _data*/ 1026) {
    				btable_changes.$$scope = { dirty, ctx };
    			}

    			btable.$set(btable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bheader.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(btable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bheader.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(btable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bheader, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(btable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(55:2) <BStatic>",
    		ctx
    	});

    	return block;
    }

    // (64:2) {#if $source.element}
    function create_if_block$2(ctx) {
    	let current;

    	const bresize = new BResize({
    			props: {
    				left: /*_json*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	bresize.$on("dragend", /*dragend*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(bresize.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bresize, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bresize_changes = {};
    			if (dirty & /*_json*/ 1) bresize_changes.left = /*_json*/ ctx[0];

    			if (dirty & /*$$scope*/ 1024) {
    				bresize_changes.$$scope = { dirty, ctx };
    			}

    			bresize.$set(bresize_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bresize.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bresize.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bresize, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(64:2) {#if $source.element}",
    		ctx
    	});

    	return block;
    }

    // (65:4) <BResize left={_json} on:dragend={dragend}>
    function create_default_slot(ctx) {
    	let current;
    	const show = new Show({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(show.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(show, target, anchor);
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
    			destroy_component(show, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(65:4) <BResize left={_json} on:dragend={dragend}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let t;
    	let current;

    	const bstatic = new BStatic({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*$source*/ ctx[2].element && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(bstatic.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "vbox svelte-1lkoif2");
    			add_location(div, file$b, 53, 0, 1236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(bstatic, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const bstatic_changes = {};

    			if (dirty & /*$$scope, _data*/ 1026) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);

    			if (/*$source*/ ctx[2].element) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
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
    			transition_in(bstatic.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bstatic.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(bstatic);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(2, $source = $$value));
    	let json = 163;
    	let data = [];

    	onMount(async () => {
    		setTimeout(
    			() => {
    				ws__send("getLog", "", logHandler);
    			},
    			10
    		);

    		chrome.storage.local.get("json", function (data) {
    			data.json && $$invalidate(4, json = data.json);
    		});
    	});

    	const logHandler = obj => {
    		console.log("ws__send(getLog)", obj);

    		if (window.mitm.files.log === undefined) {
    			window.mitm.files.log = obj;
    			$$invalidate(5, data = obj);
    		} else {
    			const { log } = window.mitm.files;
    			const newLog = {};

    			for (let k in obj) {
    				newLog[k] = log[k] ? log[k] : obj[k];
    			}

    			window.mitm.files.log = newLog;
    			$$invalidate(5, data = newLog);
    		}
    	};

    	window.mitm.files.log_events.LogsTable = () => {
    		ws__send("getLog", "", logHandler);
    	};

    	function dragend({ detail }) {
    		$$invalidate(4, json = detail.left);
    		chrome.storage.local.set({ json });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("json" in $$props) $$invalidate(4, json = $$props.json);
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    		if ("_json" in $$props) $$invalidate(0, _json = $$props._json);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    		if ("$source" in $$props) source.set($source = $$props.$source);
    	};

    	let _json;
    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*json*/ 16) {
    			 $$invalidate(0, _json = json);
    		}

    		if ($$self.$$.dirty & /*data*/ 32) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [_json, _data, $source, dragend];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const source$1 = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content:'',
      path:'',
    });

    /* src\components\route\Button.svelte generated by Svelte v3.16.7 */
    const file$c = "src\\components\\route\\Button.svelte";

    // (31:0) {#if $source.path}
    function create_if_block$3(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_disabled_value;
    	let t3;
    	let button2;
    	let t4;
    	let button2_disabled_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Save");
    			t1 = text(" -\r\n  ");
    			button1 = element("button");
    			t2 = text("Open");
    			t3 = text(" -\r\n  ");
    			button2 = element("button");
    			t4 = text("Go");
    			attr_dev(button0, "class", "btn-save svelte-y30ofq");
    			button0.disabled = button0_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button0, file$c, 32, 2, 639);
    			attr_dev(button1, "class", "btn-open svelte-y30ofq");
    			button1.disabled = button1_disabled_value = /*$source*/ ctx[0].openDisabled;
    			add_location(button1, file$c, 33, 2, 736);
    			attr_dev(button2, "class", "btn-go svelte-y30ofq");
    			button2.disabled = button2_disabled_value = /*$source*/ ctx[0].goDisabled;
    			add_location(button2, file$c, 34, 2, 833);
    			attr_dev(div, "class", "btn-container svelte-y30ofq");
    			add_location(div, file$c, 31, 1, 608);

    			dispose = [
    				listen_dev(button0, "click", /*btnSave*/ ctx[1], false, false, false),
    				listen_dev(button1, "click", /*btnOpen*/ ctx[2], false, false, false),
    				listen_dev(button2, "click", /*btnGo*/ ctx[3], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, t2);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(button2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$source*/ 1 && button0_disabled_value !== (button0_disabled_value = /*$source*/ ctx[0].saveDisabled)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$source*/ 1 && button1_disabled_value !== (button1_disabled_value = /*$source*/ ctx[0].openDisabled)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*$source*/ 1 && button2_disabled_value !== (button2_disabled_value = /*$source*/ ctx[0].goDisabled)) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(31:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*$source*/ ctx[0].path + "";
    	let t1;
    	let t2;
    	let if_block = /*$source*/ ctx[0].path && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Path:");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "file-path svelte-y30ofq");
    			add_location(div, file$c, 28, 0, 541);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$source*/ 1 && t1_value !== (t1_value = /*$source*/ ctx[0].path + "")) set_data_dev(t1, t1_value);

    			if (/*$source*/ ctx[0].path) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(0, $source = $$value));

    	function btnSave(e) {
    		source$1.update(n => {
    			return { ...n, content: window.editor.getValue() };
    		});

    		console.log($source);

    		ws__send("saveRoute", $source, data => {
    			console.log("Done Save!");
    		});
    	}

    	function btnOpen() {
    		ws__send("openRoute", $source, data => {
    			console.log("Done Open!");
    		});
    	}

    	function btnGo(e) {
    		const route = mitm.routes[$source.item];

    		if (route && route.url) {
    			chrome.tabs.update({ url: route.url });
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	return [$source, btnSave, btnOpen, btnGo];
    }

    class Button$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\components\route\Item.svelte generated by Svelte v3.16.7 */

    const { console: console_1 } = globals;
    const file$d = "src\\components\\route\\Item.svelte";

    function create_fragment$d(ctx) {
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
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-pb7eo7");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$d, 47, 4, 1115);
    			attr_dev(td, "class", "svelte-pb7eo7");
    			add_location(td, file$d, 46, 2, 1105);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$d, 45, 0, 1086);
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

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-pb7eo7")) {
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    				matchBrackets: true,
    				scrollbarStyle: "native"
    			});

    			editor.on("changes", onChanged);
    			onChanged(false);
    		}
    	}

    	onMount(async () => setupCodeMiror());

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const url = mitm.routes[item].url;
    		const obj = window.mitm.files.route[item];
    		console.log(item, obj);

    		if (window.editor) {
    			const nodes = document.querySelectorAll("#code-mirror .CodeMirror");
    			nodes.forEach(element => element.remove());
    			window.editor = undefined;
    		}

    		setTimeout(() => setupCodeMiror(), 100);

    		source$1.update(n => {
    			return {
    				...n,
    				goDisabled: url === undefined,
    				content: obj.content,
    				path: obj.path,
    				item
    			};
    		});
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
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, { item: 0, onChanged: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$d.name
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
    const file$e = "src\\components\\route\\Table.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (79:4) <BHeader>
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("-Route(s)-");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(79:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (81:6) {#each Object.keys(_data) as item}
    function create_each_block$2(ctx) {
    	let current;

    	const item = new Item$1({
    			props: {
    				item: {
    					element: /*item*/ ctx[11],
    					.../*_data*/ ctx[1][/*item*/ ctx[11]]
    				},
    				onChanged: /*editorChanged*/ ctx[3]
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

    			if (dirty & /*_data*/ 2) item_changes.item = {
    				element: /*item*/ ctx[11],
    				.../*_data*/ ctx[1][/*item*/ ctx[11]]
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
    		source: "(81:6) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    // (80:4) <BTable>
    function create_default_slot_2$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, _data, editorChanged*/ 10) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(80:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (78:2) <BStatic height="47">
    function create_default_slot_1$1(ctx) {
    	let t;
    	let current;

    	const bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bheader.$$.fragment);
    			t = space();
    			create_component(btable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bheader, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(btable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bheader_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			const btable_changes = {};

    			if (dirty & /*$$scope, _data*/ 16386) {
    				btable_changes.$$scope = { dirty, ctx };
    			}

    			btable.$set(btable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bheader.$$.fragment, local);
    			transition_in(btable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bheader.$$.fragment, local);
    			transition_out(btable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bheader, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(btable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(78:2) <BStatic height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    // (86:2) <BResize left={_route} on:dragend={dragend} height="47">
    function create_default_slot$1(ctx) {
    	let div;
    	let textarea;
    	let textarea_value_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			textarea = element("textarea");
    			attr_dev(textarea, "id", "demotext");
    			textarea.value = textarea_value_value = /*$source*/ ctx[2].content;
    			add_location(textarea, file$e, 87, 6, 2121);
    			attr_dev(div, "id", "code-mirror");
    			attr_dev(div, "class", "svelte-5xlvo9");
    			add_location(div, file$e, 86, 4, 2092);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, textarea);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$source*/ 4 && textarea_value_value !== (textarea_value_value = /*$source*/ ctx[2].content)) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(86:2) <BResize left={_route} on:dragend={dragend} height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let current;
    	const button = new Button$1({ $$inline: true });

    	const bstatic = new BStatic({
    			props: {
    				height: "47",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const bresize = new BResize({
    			props: {
    				left: /*_route*/ ctx[0],
    				height: "47",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	bresize.$on("dragend", /*dragend*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(bstatic.$$.fragment);
    			t1 = space();
    			create_component(bresize.$$.fragment);
    			attr_dev(div, "class", "vbox svelte-5xlvo9");
    			add_location(div, file$e, 76, 0, 1778);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(bstatic, div, null);
    			append_dev(div, t1);
    			mount_component(bresize, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const bstatic_changes = {};

    			if (dirty & /*$$scope, _data*/ 16386) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);
    			const bresize_changes = {};
    			if (dirty & /*_route*/ 1) bresize_changes.left = /*_route*/ ctx[0];

    			if (dirty & /*$$scope, $source*/ 16388) {
    				bresize_changes.$$scope = { dirty, ctx };
    			}

    			bresize.$set(bresize_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(bstatic.$$.fragment, local);
    			transition_in(bresize.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(bstatic.$$.fragment, local);
    			transition_out(bresize.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(bstatic);
    			destroy_component(bresize);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(2, $source = $$value));
    	let route = 163;
    	let data = [];
    	let rerender = 0;

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

    		rerender++;
    	};

    	onMount(async () => {
    		setTimeout(
    			() => {
    				window.ws__send("getRoute", "", routeHandler);
    			},
    			10
    		);

    		chrome.storage.local.get("route", function (data) {
    			data.route && $$invalidate(5, route = data.route);
    		});
    	});

    	window.mitm.files.route_events.routeTable = () => {
    		window.ws__send("getRoute", "", routeHandler);
    	};

    	let editbuffer;
    	let _timeout = null;

    	function editorChanged(e) {
    		let saveDisabled;

    		if (e === false) {
    			saveDisabled = true;

    			source$1.update(n => {
    				return { ...n, saveDisabled };
    			});

    			editbuffer = window.editor.getValue();
    		}

    		_timeout && clearTimeout(_timeout);

    		_timeout = setTimeout(
    			() => {
    				if (window.editor) {
    					saveDisabled = window.editor.getValue() === editbuffer;

    					source$1.update(n => {
    						return { ...n, saveDisabled };
    					});

    					console.log(e);
    				}
    			},
    			500
    		);
    	}

    	function dragend({ detail }) {
    		$$invalidate(5, route = detail.left);
    		chrome.storage.local.set({ route });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(5, route = $$props.route);
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("editbuffer" in $$props) editbuffer = $$props.editbuffer;
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    		if ("_route" in $$props) $$invalidate(0, _route = $$props._route);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	let _route;
    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*route*/ 32) {
    			 $$invalidate(0, _route = route);
    		}

    		if ($$self.$$.dirty & /*data*/ 64) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [_route, _data, $source, editorChanged, dragend];
    }

    class Table$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\components\other\Tab.svelte generated by Svelte v3.16.7 */

    const file$f = "src\\components\\other\\Tab.svelte";

    function create_fragment$f(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open Home";
    			add_location(button, file$f, 33, 0, 711);
    			dispose = listen_dev(button, "click", btnOpen, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnOpen() {
    	ws__send("openHome", "", data => {
    		console.log("Done open home folder!");
    	});
    }

    function instance$e($$self) {

    	

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [];
    }

    class Tab$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.7 */
    const file$g = "src\\App.svelte";

    // (17:2) <Tab label="Route">
    function create_default_slot_3$2(ctx) {
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
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(17:2) <Tab label=\\\"Route\\\">",
    		ctx
    	});

    	return block;
    }

    // (18:2) <Tab label="Logs">
    function create_default_slot_2$2(ctx) {
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
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(18:2) <Tab label=\\\"Logs\\\">",
    		ctx
    	});

    	return block;
    }

    // (19:2) <Tab label="Other">
    function create_default_slot_1$2(ctx) {
    	let current;
    	const othertab = new Tab$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(othertab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(othertab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(othertab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(othertab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(othertab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(19:2) <Tab label=\\\"Other\\\">",
    		ctx
    	});

    	return block;
    }

    // (16:0) <Tabs style="is-boxed" size="is-small">
    function create_default_slot$2(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const tab0 = new Tab({
    			props: {
    				label: "Route",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab1 = new Tab({
    			props: {
    				label: "Logs",
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab2 = new Tab({
    			props: {
    				label: "Other",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t0 = space();
    			create_component(tab1.$$.fragment);
    			t1 = space();
    			create_component(tab2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
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
    			const tab2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tab2_changes.$$scope = { dirty, ctx };
    			}

    			tab2.$set(tab2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(tab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(tab2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(16:0) <Tabs style=\\\"is-boxed\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let main;
    	let current;

    	const tabs = new Tabs({
    			props: {
    				style: "is-boxed",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			attr_dev(main, "class", "main");
    			add_location(main, file$g, 14, 0, 373);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvbW90aW9uL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWJzLnN2ZWx0ZSIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9zdG9yZXMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9ib3gvQlN0YXRpYy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9ib3gvU3BsaXR0ZXIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L0JSZXNpemUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvU2hvdy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1RhYmxlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3JvdXRlL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3JvdXRlL0J1dHRvbi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3JvdXRlL1RhYmxlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL1RhYi5zdmVsdGUiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoIXN0b3JlIHx8IHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICh0eXBlb2YgJCRzY29wZS5kaXJ0eSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMocHJvcHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmIChrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN1bHRba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb25jZShmbikge1xuICAgIGxldCByYW4gPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKHJhbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gbnVsbF90b19lbXB0eSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9zdG9yZV92YWx1ZShzdG9yZSwgcmV0LCB2YWx1ZSA9IHJldCkge1xuICAgIHN0b3JlLnNldCh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmNvbnN0IGhhc19wcm9wID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG5mdW5jdGlvbiBhY3Rpb25fZGVzdHJveWVyKGFjdGlvbl9yZXN1bHQpIHtcbiAgICByZXR1cm4gYWN0aW9uX3Jlc3VsdCAmJiBpc19mdW5jdGlvbihhY3Rpb25fcmVzdWx0LmRlc3Ryb3kpID8gYWN0aW9uX3Jlc3VsdC5kZXN0cm95IDogbm9vcDtcbn1cblxuY29uc3QgaXNfY2xpZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG5sZXQgbm93ID0gaXNfY2xpZW50XG4gICAgPyAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KClcbiAgICA6ICgpID0+IERhdGUubm93KCk7XG5sZXQgcmFmID0gaXNfY2xpZW50ID8gY2IgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKSA6IG5vb3A7XG4vLyB1c2VkIGludGVybmFsbHkgZm9yIHRlc3RpbmdcbmZ1bmN0aW9uIHNldF9ub3coZm4pIHtcbiAgICBub3cgPSBmbjtcbn1cbmZ1bmN0aW9uIHNldF9yYWYoZm4pIHtcbiAgICByYWYgPSBmbjtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBydW5fdGFza3Mobm93KSB7XG4gICAgdGFza3MuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgaWYgKCF0YXNrLmMobm93KSkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICAgICAgdGFzay5mKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGFza3Muc2l6ZSAhPT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG59XG4vKipcbiAqIEZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkhXG4gKi9cbmZ1bmN0aW9uIGNsZWFyX2xvb3BzKCkge1xuICAgIHRhc2tzLmNsZWFyKCk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdGFzayB0aGF0IHJ1bnMgb24gZWFjaCByYWYgZnJhbWVcbiAqIHVudGlsIGl0IHJldHVybnMgYSBmYWxzeSB2YWx1ZSBvciBpcyBhYm9ydGVkXG4gKi9cbmZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcbiAgICBsZXQgdGFzaztcbiAgICBpZiAodGFza3Muc2l6ZSA9PT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICAgICAgICB0YXNrcy5hZGQodGFzayA9IHsgYzogY2FsbGJhY2ssIGY6IGZ1bGZpbGwgfSk7XG4gICAgICAgIH0pLFxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIG5vZGUpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIGFuY2hvciB8fCBudWxsKTtcbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0b3BfcHJvcGFnYXRpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2VsZihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhub2RlLl9fcHJvdG9fXyk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmNzc1RleHQgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvcnNba2V5XSAmJiBkZXNjcmlwdG9yc1trZXldLnNldCkge1xuICAgICAgICAgICAgbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3ZnX2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcCBpbiBub2RlKSB7XG4gICAgICAgIG5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGF0dHIobm9kZSwgcHJvcCwgdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHhsaW5rX2F0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwKSB7XG4gICAgY29uc3QgdmFsdWUgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUucHVzaChncm91cFtpXS5fX3ZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IHVuZGVmaW5lZCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuICAgICAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pXG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07IC8vIFRPRE8gc3RyaXAgdW53YW50ZWQgYXR0cmlidXRlc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0LmRhdGEgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwgfHwgaW5wdXQudmFsdWUpIHtcbiAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKGVsZW1lbnQsIGZuKSB7XG4gICAgaWYgKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBvYmplY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvYmplY3QnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IGhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgb2JqZWN0LnR5cGUgPSAndGV4dC9odG1sJztcbiAgICBvYmplY3QudGFiSW5kZXggPSAtMTtcbiAgICBsZXQgd2luO1xuICAgIG9iamVjdC5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHdpbiA9IG9iamVjdC5jb250ZW50RG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgfTtcbiAgICBpZiAoL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsOiAoKSA9PiB7XG4gICAgICAgICAgICB3aW4gJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIgJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKGh0bWwsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5lID0gZWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuYSA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgIH1cbiAgICBtKHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRhcmdldCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICB9XG4gICAgdShodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLnUoaHRtbCk7XG4gICAgICAgIHRoaXMubSh0aGlzLnQsIHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuXG5sZXQgc3R5bGVzaGVldDtcbmxldCBhY3RpdmUgPSAwO1xubGV0IGN1cnJlbnRfcnVsZXMgPSB7fTtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuICAgIGxldCBoYXNoID0gNTM4MTtcbiAgICBsZXQgaSA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBpZiAoIXN0eWxlc2hlZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICAgICAgc3R5bGVzaGVldCA9IHN0eWxlLnNoZWV0O1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRfcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiBgYH0ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJylcbiAgICAgICAgLnNwbGl0KCcsICcpXG4gICAgICAgIC5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgIGlmIChuYW1lICYmICEtLWFjdGl2ZSlcbiAgICAgICAgY2xlYXJfcnVsZXMoKTtcbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBpID0gc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgIGN1cnJlbnRfcnVsZXMgPSB7fTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZ1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbmApO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZnRlclVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmFmdGVyX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX2Rlc3Ryb3kucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgLy8gVE9ETyBhcmUgdGhlcmUgc2l0dWF0aW9ucyB3aGVyZSBldmVudHMgY291bGQgYmUgZGlzcGF0Y2hlZFxuICAgICAgICAgICAgLy8gaW4gYSBzZXJ2ZXIgKG5vbi1ET00pIGVudmlyb25tZW50P1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBzZXRDb250ZXh0KGtleSwgY29udGV4dCkge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuc2V0KGtleSwgY29udGV4dCk7XG59XG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4oZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzLnNoaWZ0KCk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSBwcm9ncmFtLmIgLSB0O1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBnbG9iYWwpO1xuXG5mdW5jdGlvbiBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5kKDEpO1xuICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cbmZ1bmN0aW9uIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gdXBkYXRlX2tleWVkX2VhY2gob2xkX2Jsb2NrcywgZGlydHksIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcbiAgICBsZXQgbyA9IG9sZF9ibG9ja3MubGVuZ3RoO1xuICAgIGxldCBuID0gbGlzdC5sZW5ndGg7XG4gICAgbGV0IGkgPSBvO1xuICAgIGNvbnN0IG9sZF9pbmRleGVzID0ge307XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgb2xkX2luZGV4ZXNbb2xkX2Jsb2Nrc1tpXS5rZXldID0gaTtcbiAgICBjb25zdCBuZXdfYmxvY2tzID0gW107XG4gICAgY29uc3QgbmV3X2xvb2t1cCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG4gICAgICAgIGlmIChrZXkgaW4gb2xkX2luZGV4ZXMpXG4gICAgICAgICAgICBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcbiAgICB9XG4gICAgY29uc3Qgd2lsbF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGRpZF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIGluc2VydChibG9jaykge1xuICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgYmxvY2subShub2RlLCBuZXh0KTtcbiAgICAgICAgbG9va3VwLnNldChibG9jay5rZXksIGJsb2NrKTtcbiAgICAgICAgbmV4dCA9IGJsb2NrLmZpcnN0O1xuICAgICAgICBuLS07XG4gICAgfVxuICAgIHdoaWxlIChvICYmIG4pIHtcbiAgICAgICAgY29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3NbbyAtIDFdO1xuICAgICAgICBjb25zdCBuZXdfa2V5ID0gbmV3X2Jsb2NrLmtleTtcbiAgICAgICAgY29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG4gICAgICAgIGlmIChuZXdfYmxvY2sgPT09IG9sZF9ibG9jaykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgbmV4dCA9IG5ld19ibG9jay5maXJzdDtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgICAgIG4tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgYmxvY2tcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFsb29rdXAuaGFzKG5ld19rZXkpIHx8IHdpbGxfbW92ZS5oYXMobmV3X2tleSkpIHtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpZF9tb3ZlLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbHRhcy5nZXQobmV3X2tleSkgPiBkZWx0YXMuZ2V0KG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBkaWRfbW92ZS5hZGQobmV3X2tleSk7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKG8tLSkge1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW29dO1xuICAgICAgICBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9ibG9jay5rZXkpKVxuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgfVxuICAgIHdoaWxlIChuKVxuICAgICAgICBpbnNlcnQobmV3X2Jsb2Nrc1tuIC0gMV0pO1xuICAgIHJldHVybiBuZXdfYmxvY2tzO1xufVxuZnVuY3Rpb24gbWVhc3VyZShibG9ja3MpIHtcbiAgICBjb25zdCByZWN0cyA9IHt9O1xuICAgIGxldCBpID0gYmxvY2tzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICByZWN0c1tibG9ja3NbaV0ua2V5XSA9IGJsb2Nrc1tpXS5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiByZWN0cztcbn1cblxuZnVuY3Rpb24gZ2V0X3NwcmVhZF91cGRhdGUobGV2ZWxzLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgdXBkYXRlID0ge307XG4gICAgY29uc3QgdG9fbnVsbF9vdXQgPSB7fTtcbiAgICBjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG4gICAgbGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgbyA9IGxldmVsc1tpXTtcbiAgICAgICAgY29uc3QgbiA9IHVwZGF0ZXNbaV07XG4gICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG4pKVxuICAgICAgICAgICAgICAgICAgICB0b19udWxsX291dFtrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFjY291bnRlZF9mb3Jba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVba2V5XSA9IG5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXZlbHNbaV0gPSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9fbnVsbF9vdXQpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHVwZGF0ZSkpXG4gICAgICAgICAgICB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZTtcbn1cbmZ1bmN0aW9uIGdldF9zcHJlYWRfb2JqZWN0KHNwcmVhZF9wcm9wcykge1xuICAgIHJldHVybiB0eXBlb2Ygc3ByZWFkX3Byb3BzID09PSAnb2JqZWN0JyAmJiBzcHJlYWRfcHJvcHMgIT09IG51bGwgPyBzcHJlYWRfcHJvcHMgOiB7fTtcbn1cblxuLy8gc291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbmNvbnN0IGJvb2xlYW5fYXR0cmlidXRlcyA9IG5ldyBTZXQoW1xuICAgICdhbGxvd2Z1bGxzY3JlZW4nLFxuICAgICdhbGxvd3BheW1lbnRyZXF1ZXN0JyxcbiAgICAnYXN5bmMnLFxuICAgICdhdXRvZm9jdXMnLFxuICAgICdhdXRvcGxheScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdjb250cm9scycsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWZlcicsXG4gICAgJ2Rpc2FibGVkJyxcbiAgICAnZm9ybW5vdmFsaWRhdGUnLFxuICAgICdoaWRkZW4nLFxuICAgICdpc21hcCcsXG4gICAgJ2xvb3AnLFxuICAgICdtdWx0aXBsZScsXG4gICAgJ211dGVkJyxcbiAgICAnbm9tb2R1bGUnLFxuICAgICdub3ZhbGlkYXRlJyxcbiAgICAnb3BlbicsXG4gICAgJ3BsYXlzaW5saW5lJyxcbiAgICAncmVhZG9ubHknLFxuICAgICdyZXF1aXJlZCcsXG4gICAgJ3JldmVyc2VkJyxcbiAgICAnc2VsZWN0ZWQnXG5dKTtcblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgY2xhc3Nlc190b19hZGQpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgLi4uYXJncyk7XG4gICAgaWYgKGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmNsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGlmIChpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3Rlci50ZXN0KG5hbWUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZSArIFwiPVwiICsgSlNPTi5zdHJpbmdpZnkoU3RyaW5nKHZhbHVlKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnJiMzNDsnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBlc2NhcGVkID0ge1xuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShodG1sKSB7XG4gICAgcmV0dXJuIFN0cmluZyhodG1sKS5yZXBsYWNlKC9bXCInJjw+XS9nLCBtYXRjaCA9PiBlc2NhcGVkW21hdGNoXSk7XG59XG5mdW5jdGlvbiBlYWNoKGl0ZW1zLCBmbikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHN0ciArPSBmbihpdGVtc1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBtaXNzaW5nX2NvbXBvbmVudCA9IHtcbiAgICAkJHJlbmRlcjogKCkgPT4gJydcbn07XG5mdW5jdGlvbiB2YWxpZGF0ZV9jb21wb25lbnQoY29tcG9uZW50LCBuYW1lKSB7XG4gICAgaWYgKCFjb21wb25lbnQgfHwgIWNvbXBvbmVudC4kJHJlbmRlcikge1xuICAgICAgICBpZiAobmFtZSA9PT0gJ3N2ZWx0ZTpjb21wb25lbnQnKVxuICAgICAgICAgICAgbmFtZSArPSAnIHRoaXM9ey4uLn0nO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYDwke25hbWV9PiBpcyBub3QgYSB2YWxpZCBTU1IgY29tcG9uZW50LiBZb3UgbWF5IG5lZWQgdG8gcmV2aWV3IHlvdXIgYnVpbGQgY29uZmlnIHRvIGVuc3VyZSB0aGF0IGRlcGVuZGVuY2llcyBhcmUgY29tcGlsZWQsIHJhdGhlciB0aGFuIGltcG9ydGVkIGFzIHByZS1jb21waWxlZCBtb2R1bGVzYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBkZWJ1ZyhmaWxlLCBsaW5lLCBjb2x1bW4sIHZhbHVlcykge1xuICAgIGNvbnNvbGUubG9nKGB7QGRlYnVnfSAke2ZpbGUgPyBmaWxlICsgJyAnIDogJyd9KCR7bGluZX06JHtjb2x1bW59KWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyh2YWx1ZXMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXR1cm4gJyc7XG59XG5sZXQgb25fZGVzdHJveTtcbmZ1bmN0aW9uIGNyZWF0ZV9zc3JfY29tcG9uZW50KGZuKSB7XG4gICAgZnVuY3Rpb24gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICAgICAgY29uc3QgJCQgPSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LFxuICAgICAgICAgICAgY29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiBgYDtcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICB9KTtcbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCBwcm9wX3ZhbHVlcyA9IG9wdGlvbnMucHJvcHMgfHwge307XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5XG4gICAgfTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgcHJvcF92YWx1ZXMsIChpLCByZXQsIHZhbHVlID0gcmV0KSA9PiB7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICgkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZGVuIGJ5IGluc3RhbmNlLCBpZiBpdCBoYXMgcHJvcHNcbiAgICAgICAgfVxuICAgIH07XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCkge1xuICAgICAgICAvLyBvdmVycmlkZGVuIGJ5IGluc3RhbmNlLCBpZiBpdCBoYXMgcHJvcHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NSW5zZXJ0XCIsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVcIiwgeyBub2RlIH0pO1xuICAgIGRldGFjaChub2RlKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9iZXR3ZWVuX2RldihiZWZvcmUsIGFmdGVyKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYmVmb3JlX2RldihhZnRlcikge1xuICAgIHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9hZnRlcl9kZXYoYmVmb3JlKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbGlzdGVuX2Rldihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucywgaGFzX3ByZXZlbnRfZGVmYXVsdCwgaGFzX3N0b3BfcHJvcGFnYXRpb24pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSBvcHRpb25zID09PSB0cnVlID8gW1wiY2FwdHVyZVwiXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01BZGRFdmVudExpc3RlbmVyXCIsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyXCIsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyX2Rldihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlXCIsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0QXR0cmlidXRlXCIsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0UHJvcGVydHlcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBkYXRhc2V0X2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlLmRhdGFzZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0RGF0YXNldFwiLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0RGF0YVwiLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJ3RhcmdldCcgaXMgYSByZXF1aXJlZCBvcHRpb25gKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZGApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5maW5pdGUgbG9vcCBkZXRlY3RlZGApO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgU3ZlbHRlQ29tcG9uZW50LCBTdmVsdGVDb21wb25lbnREZXYsIFN2ZWx0ZUVsZW1lbnQsIGFjdGlvbl9kZXN0cm95ZXIsIGFkZF9hdHRyaWJ1dGUsIGFkZF9jbGFzc2VzLCBhZGRfZmx1c2hfY2FsbGJhY2ssIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXNzaWduLCBhdHRyLCBhdHRyX2RldiwgYmVmb3JlVXBkYXRlLCBiaW5kLCBiaW5kaW5nX2NhbGxiYWNrcywgYmxhbmtfb2JqZWN0LCBidWJibGUsIGNoZWNrX291dHJvcywgY2hpbGRyZW4sIGNsYWltX2NvbXBvbmVudCwgY2xhaW1fZWxlbWVudCwgY2xhaW1fc3BhY2UsIGNsYWltX3RleHQsIGNsZWFyX2xvb3BzLCBjb21wb25lbnRfc3Vic2NyaWJlLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVzY2FwZSwgZXNjYXBlZCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRDb250ZXh0LCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0LCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWVhc3VyZSwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB1cGRhdGVfa2V5ZWRfZWFjaCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCB0eXBlID0gJydcbiAgZXhwb3J0IGxldCBwYWNrID0gJ2ZhcydcbiAgZXhwb3J0IGxldCBpY29uXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG4gIGV4cG9ydCBsZXQgY3VzdG9tQ2xhc3MgPSAnJ1xuICBleHBvcnQgbGV0IGN1c3RvbVNpemUgPSAnJ1xuICBleHBvcnQgbGV0IGlzQ2xpY2thYmxlID0gZmFsc2VcbiAgZXhwb3J0IGxldCBpc0xlZnQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzUmlnaHQgPSBmYWxzZVxuXG4gIGxldCBuZXdDdXN0b21TaXplID0gJydcbiAgbGV0IG5ld1R5cGUgPSAnJ1xuXG4gICQ6IG5ld1BhY2sgPSBwYWNrIHx8ICdmYXMnXG5cbiAgJDoge1xuICAgIGlmIChjdXN0b21TaXplKSBuZXdDdXN0b21TaXplID0gY3VzdG9tU2l6ZVxuICAgIGVsc2Uge1xuICAgICAgc3dpdGNoIChzaXplKSB7XG4gICAgICAgIGNhc2UgJ2lzLXNtYWxsJzpcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpcy1tZWRpdW0nOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtbGcnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaXMtbGFyZ2UnOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtM3gnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJydcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkOiB7XG4gICAgaWYgKCF0eXBlKSBuZXdUeXBlID0gJydcbiAgICBsZXQgc3BsaXRUeXBlID0gW11cbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzcGxpdFR5cGUgPSB0eXBlLnNwbGl0KCctJylcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQga2V5IGluIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVba2V5XSkge1xuICAgICAgICAgIHNwbGl0VHlwZSA9IGtleS5zcGxpdCgnLScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3BsaXRUeXBlLmxlbmd0aCA8PSAxKSBuZXdUeXBlID0gJydcbiAgICBlbHNlIG5ld1R5cGUgPSBgaGFzLXRleHQtJHtzcGxpdFR5cGVbMV19YFxuICB9XG48L3NjcmlwdD5cblxuPHNwYW4gY2xhc3M9XCJpY29uIHtzaXplfSB7bmV3VHlwZX0geyhpc0xlZnQgJiYgJ2lzLWxlZnQnKSB8fCAnJ30geyhpc1JpZ2h0ICYmICdpcy1yaWdodCcpIHx8ICcnfVwiIGNsYXNzOmlzLWNsaWNrYWJsZT17aXNDbGlja2FibGV9IG9uOmNsaWNrPlxuICA8aSBjbGFzcz1cIntuZXdQYWNrfSBmYS17aWNvbn0ge2N1c3RvbUNsYXNzfSB7bmV3Q3VzdG9tU2l6ZX1cIiAvPlxuPC9zcGFuPlxuIiwiaW1wb3J0IHsgc2FmZV9ub3RfZXF1YWwsIG5vb3AsIHJ1bl9hbGwsIGlzX2Z1bmN0aW9uIH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuZXhwb3J0IHsgZ2V0X3N0b3JlX3ZhbHVlIGFzIGdldCB9IGZyb20gJy4uL2ludGVybmFsJztcblxuY29uc3Qgc3Vic2NyaWJlcl9xdWV1ZSA9IFtdO1xuLyoqXG4gKiBDcmVhdGVzIGEgYFJlYWRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyfXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gcmVhZGFibGUodmFsdWUsIHN0YXJ0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3Vic2NyaWJlOiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQpLnN1YnNjcmliZSxcbiAgICB9O1xufVxuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcbiAgICAgICAgaWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIGlmIChzdG9wKSB7IC8vIHN0b3JlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgY29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBzWzFdKCk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUucHVzaChzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5fcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuICAgICAgICBzZXQoZm4odmFsdWUpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuICAgICAgICBzdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuICAgICAgICB9XG4gICAgICAgIHJ1bih2YWx1ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHN1YnNjcmliZXJzLmluZGV4T2Yoc3Vic2NyaWJlcik7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cbmZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuICAgIGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG4gICAgY29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlXG4gICAgICAgID8gW3N0b3Jlc11cbiAgICAgICAgOiBzdG9yZXM7XG4gICAgY29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG4gICAgcmV0dXJuIHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIChzZXQpID0+IHtcbiAgICAgICAgbGV0IGluaXRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgbGV0IHBlbmRpbmcgPSAwO1xuICAgICAgICBsZXQgY2xlYW51cCA9IG5vb3A7XG4gICAgICAgIGNvbnN0IHN5bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0KTtcbiAgICAgICAgICAgIGlmIChhdXRvKSB7XG4gICAgICAgICAgICAgICAgc2V0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcnMgPSBzdG9yZXNfYXJyYXkubWFwKChzdG9yZSwgaSkgPT4gc3RvcmUuc3Vic2NyaWJlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdmFsdWVzW2ldID0gdmFsdWU7XG4gICAgICAgICAgICBwZW5kaW5nICY9IH4oMSA8PCBpKTtcbiAgICAgICAgICAgIGlmIChpbml0ZWQpIHtcbiAgICAgICAgICAgICAgICBzeW5jKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHBlbmRpbmcgfD0gKDEgPDwgaSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgaW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgc3luYygpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodW5zdWJzY3JpYmVycyk7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IGRlcml2ZWQsIHJlYWRhYmxlLCB3cml0YWJsZSB9O1xuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICcuLi9zdG9yZSc7XG5pbXBvcnQgeyBub3csIGxvb3AsIGFzc2lnbiB9IGZyb20gJy4uL2ludGVybmFsJztcbmltcG9ydCB7IGxpbmVhciB9IGZyb20gJy4uL2Vhc2luZyc7XG5cbmZ1bmN0aW9uIGlzX2RhdGUob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZSwgY3VycmVudF92YWx1ZSwgdGFyZ2V0X3ZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50X3ZhbHVlID09PSAnbnVtYmVyJyB8fCBpc19kYXRlKGN1cnJlbnRfdmFsdWUpKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgZGVsdGEgPSB0YXJnZXRfdmFsdWUgLSBjdXJyZW50X3ZhbHVlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHZlbG9jaXR5ID0gKGN1cnJlbnRfdmFsdWUgLSBsYXN0X3ZhbHVlKSAvIChjdHguZHQgfHwgMSAvIDYwKTsgLy8gZ3VhcmQgZGl2IGJ5IDBcbiAgICAgICAgY29uc3Qgc3ByaW5nID0gY3R4Lm9wdHMuc3RpZmZuZXNzICogZGVsdGE7XG4gICAgICAgIGNvbnN0IGRhbXBlciA9IGN0eC5vcHRzLmRhbXBpbmcgKiB2ZWxvY2l0eTtcbiAgICAgICAgY29uc3QgYWNjZWxlcmF0aW9uID0gKHNwcmluZyAtIGRhbXBlcikgKiBjdHguaW52X21hc3M7XG4gICAgICAgIGNvbnN0IGQgPSAodmVsb2NpdHkgKyBhY2NlbGVyYXRpb24pICogY3R4LmR0O1xuICAgICAgICBpZiAoTWF0aC5hYnMoZCkgPCBjdHgub3B0cy5wcmVjaXNpb24gJiYgTWF0aC5hYnMoZGVsdGEpIDwgY3R4Lm9wdHMucHJlY2lzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0X3ZhbHVlOyAvLyBzZXR0bGVkXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjdHguc2V0dGxlZCA9IGZhbHNlOyAvLyBzaWduYWwgbG9vcCB0byBrZWVwIHRpY2tpbmdcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHJldHVybiBpc19kYXRlKGN1cnJlbnRfdmFsdWUpID9cbiAgICAgICAgICAgICAgICBuZXcgRGF0ZShjdXJyZW50X3ZhbHVlLmdldFRpbWUoKSArIGQpIDogY3VycmVudF92YWx1ZSArIGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50X3ZhbHVlKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBjdXJyZW50X3ZhbHVlLm1hcCgoXywgaSkgPT4gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2ldLCBjdXJyZW50X3ZhbHVlW2ldLCB0YXJnZXRfdmFsdWVbaV0pKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGN1cnJlbnRfdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IG5leHRfdmFsdWUgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBrIGluIGN1cnJlbnRfdmFsdWUpXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBuZXh0X3ZhbHVlW2tdID0gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2tdLCBjdXJyZW50X3ZhbHVlW2tdLCB0YXJnZXRfdmFsdWVba10pO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBuZXh0X3ZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgc3ByaW5nICR7dHlwZW9mIGN1cnJlbnRfdmFsdWV9IHZhbHVlc2ApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNwcmluZyh2YWx1ZSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgc3RvcmUgPSB3cml0YWJsZSh2YWx1ZSk7XG4gICAgY29uc3QgeyBzdGlmZm5lc3MgPSAwLjE1LCBkYW1waW5nID0gMC44LCBwcmVjaXNpb24gPSAwLjAxIH0gPSBvcHRzO1xuICAgIGxldCBsYXN0X3RpbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IGN1cnJlbnRfdG9rZW47XG4gICAgbGV0IGxhc3RfdmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgdGFyZ2V0X3ZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGludl9tYXNzID0gMTtcbiAgICBsZXQgaW52X21hc3NfcmVjb3ZlcnlfcmF0ZSA9IDA7XG4gICAgbGV0IGNhbmNlbF90YXNrID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSwgb3B0cyA9IHt9KSB7XG4gICAgICAgIHRhcmdldF92YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBjdXJyZW50X3Rva2VuID0ge307XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IG9wdHMuaGFyZCB8fCAoc3ByaW5nLnN0aWZmbmVzcyA+PSAxICYmIHNwcmluZy5kYW1waW5nID49IDEpKSB7XG4gICAgICAgICAgICBjYW5jZWxfdGFzayA9IHRydWU7IC8vIGNhbmNlbCBhbnkgcnVubmluZyBhbmltYXRpb25cbiAgICAgICAgICAgIGxhc3RfdGltZSA9IG5vdygpO1xuICAgICAgICAgICAgbGFzdF92YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IHRhcmdldF92YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0cy5zb2Z0KSB7XG4gICAgICAgICAgICBjb25zdCByYXRlID0gb3B0cy5zb2Z0ID09PSB0cnVlID8gLjUgOiArb3B0cy5zb2Z0O1xuICAgICAgICAgICAgaW52X21hc3NfcmVjb3ZlcnlfcmF0ZSA9IDEgLyAocmF0ZSAqIDYwKTtcbiAgICAgICAgICAgIGludl9tYXNzID0gMDsgLy8gaW5maW5pdGUgbWFzcywgdW5hZmZlY3RlZCBieSBzcHJpbmcgZm9yY2VzXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0YXNrKSB7XG4gICAgICAgICAgICBsYXN0X3RpbWUgPSBub3coKTtcbiAgICAgICAgICAgIGNhbmNlbF90YXNrID0gZmFsc2U7XG4gICAgICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjYW5jZWxfdGFzaykge1xuICAgICAgICAgICAgICAgICAgICBjYW5jZWxfdGFzayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbnZfbWFzcyA9IE1hdGgubWluKGludl9tYXNzICsgaW52X21hc3NfcmVjb3ZlcnlfcmF0ZSwgMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3R4ID0ge1xuICAgICAgICAgICAgICAgICAgICBpbnZfbWFzcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0czogc3ByaW5nLFxuICAgICAgICAgICAgICAgICAgICBzZXR0bGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkdDogKG5vdyAtIGxhc3RfdGltZSkgKiA2MCAvIDEwMDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRfdmFsdWUgPSB0aWNrX3NwcmluZyhjdHgsIGxhc3RfdmFsdWUsIHZhbHVlLCB0YXJnZXRfdmFsdWUpO1xuICAgICAgICAgICAgICAgIGxhc3RfdGltZSA9IG5vdztcbiAgICAgICAgICAgICAgICBsYXN0X3ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gbmV4dF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGN0eC5zZXR0bGVkKVxuICAgICAgICAgICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWN0eC5zZXR0bGVkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bGZpbCA9PiB7XG4gICAgICAgICAgICB0YXNrLnByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRva2VuID09PSBjdXJyZW50X3Rva2VuKVxuICAgICAgICAgICAgICAgICAgICBmdWxmaWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgc3ByaW5nID0ge1xuICAgICAgICBzZXQsXG4gICAgICAgIHVwZGF0ZTogKGZuLCBvcHRzKSA9PiBzZXQoZm4odGFyZ2V0X3ZhbHVlLCB2YWx1ZSksIG9wdHMpLFxuICAgICAgICBzdWJzY3JpYmU6IHN0b3JlLnN1YnNjcmliZSxcbiAgICAgICAgc3RpZmZuZXNzLFxuICAgICAgICBkYW1waW5nLFxuICAgICAgICBwcmVjaXNpb25cbiAgICB9O1xuICAgIHJldHVybiBzcHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldF9pbnRlcnBvbGF0b3IoYSwgYikge1xuICAgIGlmIChhID09PSBiIHx8IGEgIT09IGEpXG4gICAgICAgIHJldHVybiAoKSA9PiBhO1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgYTtcbiAgICBpZiAodHlwZSAhPT0gdHlwZW9mIGIgfHwgQXJyYXkuaXNBcnJheShhKSAhPT0gQXJyYXkuaXNBcnJheShiKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnRlcnBvbGF0ZSB2YWx1ZXMgb2YgZGlmZmVyZW50IHR5cGUnKTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgY29uc3QgYXJyID0gYi5tYXAoKGJpLCBpKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0X2ludGVycG9sYXRvcihhW2ldLCBiaSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdCA9PiBhcnIubWFwKGZuID0+IGZuKHQpKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmICghYSB8fCAhYilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGNhbm5vdCBiZSBudWxsJyk7XG4gICAgICAgIGlmIChpc19kYXRlKGEpICYmIGlzX2RhdGUoYikpIHtcbiAgICAgICAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgICAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gYiAtIGE7XG4gICAgICAgICAgICByZXR1cm4gdCA9PiBuZXcgRGF0ZShhICsgdCAqIGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYik7XG4gICAgICAgIGNvbnN0IGludGVycG9sYXRvcnMgPSB7fTtcbiAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBpbnRlcnBvbGF0b3JzW2tleV0gPSBnZXRfaW50ZXJwb2xhdG9yKGFba2V5XSwgYltrZXldKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBpbnRlcnBvbGF0b3JzW2tleV0odCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnbnVtYmVyJykge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGIgLSBhO1xuICAgICAgICByZXR1cm4gdCA9PiBhICsgdCAqIGRlbHRhO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBpbnRlcnBvbGF0ZSAke3R5cGV9IHZhbHVlc2ApO1xufVxuZnVuY3Rpb24gdHdlZW5lZCh2YWx1ZSwgZGVmYXVsdHMgPSB7fSkge1xuICAgIGNvbnN0IHN0b3JlID0gd3JpdGFibGUodmFsdWUpO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB0YXJnZXRfdmFsdWUgPSB2YWx1ZTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlLCBvcHRzKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldF92YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgbGV0IHByZXZpb3VzX3Rhc2sgPSB0YXNrO1xuICAgICAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICBsZXQgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gNDAwLCBlYXNpbmcgPSBsaW5lYXIsIGludGVycG9sYXRlID0gZ2V0X2ludGVycG9sYXRvciB9ID0gYXNzaWduKGFzc2lnbih7fSwgZGVmYXVsdHMpLCBvcHRzKTtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBsZXQgZm47XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAobm93IDwgc3RhcnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBpZiAoIXN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICBmbiA9IGludGVycG9sYXRlKHZhbHVlLCBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24odmFsdWUsIG5ld192YWx1ZSk7XG4gICAgICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJldmlvdXNfdGFzaykge1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX3Rhc2suYWJvcnQoKTtcbiAgICAgICAgICAgICAgICBwcmV2aW91c190YXNrID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBub3cgLSBzdGFydDtcbiAgICAgICAgICAgIGlmIChlbGFwc2VkID4gZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IGZuKGVhc2luZyhlbGFwc2VkIC8gZHVyYXRpb24pKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXNrLnByb21pc2U7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHNldCxcbiAgICAgICAgdXBkYXRlOiAoZm4sIG9wdHMpID0+IHNldChmbih0YXJnZXRfdmFsdWUsIHZhbHVlKSwgb3B0cyksXG4gICAgICAgIHN1YnNjcmliZTogc3RvcmUuc3Vic2NyaWJlXG4gICAgfTtcbn1cblxuZXhwb3J0IHsgc3ByaW5nLCB0d2VlbmVkIH07XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBzZXRDb250ZXh0LCBnZXRDb250ZXh0LCBvbk1vdW50LCBvbkRlc3Ryb3ksIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IHsgZ2V0LCB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcbiAgaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnXG5cbiAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gIC8qKiBJbmRleCBvZiB0aGUgYWN0aXZlIHRhYiAoemVyby1iYXNlZClcbiAgICogQHN2ZWx0ZS1wcm9wIHtOdW1iZXJ9IFt2YWx1ZT0wXVxuICAgKiAqL1xuICBleHBvcnQgbGV0IHZhbHVlID0gMFxuXG4gIC8qKiBTaXplIG9mIHRhYnNcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtzaXplXVxuICAgKiBAdmFsdWVzICQkc2l6ZXMkJFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHNpemUgPSAnJ1xuXG4gIC8qKiBQb3NpdGlvbiBvZiB0YWJzIGxpc3QsIGhvcml6b250YWxseS4gQnkgZGVmYXVsdCB0aGV5J3JlIHBvc2l0aW9uZWQgdG8gdGhlIGxlZnRcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtwb3NpdGlvbl1cbiAgICogQHZhbHVlcyBpcy1jZW50ZXJlZCwgaXMtcmlnaHRcbiAgICogKi9cbiAgZXhwb3J0IGxldCBwb3NpdGlvbiA9ICcnXG5cbiAgLyoqIFN0eWxlIG9mIHRhYnNcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtzdHlsZV1cbiAgICogQHZhbHVlcyBpcy1ib3hlZCwgaXMtdG9nZ2xlLCBpcy10b2dnbGUtcm91bmRlZCwgaXMtZnVsbHdpZHRoXG4gICAqICovXG4gIGV4cG9ydCBsZXQgc3R5bGUgPSAnJ1xuXG4gIGV4cG9ydCBsZXQgZXhwYW5kZWQgPSBmYWxzZVxuXG4gIGxldCBhY3RpdmVUYWIgPSAwXG4gICQ6IGNoYW5nZVRhYih2YWx1ZSlcblxuICBjb25zdCB0YWJzID0gd3JpdGFibGUoW10pXG5cbiAgY29uc3QgdGFiQ29uZmlnID0ge1xuICAgIGFjdGl2ZVRhYixcbiAgICB0YWJzLFxuICB9XG5cbiAgc2V0Q29udGV4dCgndGFicycsIHRhYkNvbmZpZylcblxuICAvLyBUaGlzIG9ubHkgcnVucyBhcyB0YWJzIGFyZSBhZGRlZC9yZW1vdmVkXG4gIGNvbnN0IHVuc3Vic2NyaWJlID0gdGFicy5zdWJzY3JpYmUodHMgPT4ge1xuICAgIGlmICh0cy5sZW5ndGggPiAwICYmIHRzLmxlbmd0aCA+IHZhbHVlIC0gMSkge1xuICAgICAgdHMuZm9yRWFjaCh0ID0+IHQuZGVhY3RpdmF0ZSgpKVxuICAgICAgaWYgKHRzW3ZhbHVlXSkgdHNbdmFsdWVdLmFjdGl2YXRlKClcbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gY2hhbmdlVGFiKHRhYk51bWJlcikge1xuICAgIGNvbnN0IHRzID0gZ2V0KHRhYnMpXG4gICAgLy8gTk9URTogY2hhbmdlIHRoaXMgYmFjayB0byB1c2luZyBjaGFuZ2VUYWIgaW5zdGVhZCBvZiBhY3RpdmF0ZS9kZWFjdGl2YXRlIG9uY2UgdHJhbnNpdGlvbnMvYW5pbWF0aW9ucyBhcmUgd29ya2luZ1xuICAgIGlmICh0c1thY3RpdmVUYWJdKSB0c1thY3RpdmVUYWJdLmRlYWN0aXZhdGUoKVxuICAgIGlmICh0c1t0YWJOdW1iZXJdKSB0c1t0YWJOdW1iZXJdLmFjdGl2YXRlKClcbiAgICAvLyB0cy5mb3JFYWNoKHQgPT4gdC5jaGFuZ2VUYWIoeyBmcm9tOiBhY3RpdmVUYWIsIHRvOiB0YWJOdW1iZXIgfSkpXG4gICAgYWN0aXZlVGFiID0gdGFiQ29uZmlnLmFjdGl2ZVRhYiA9IHRhYk51bWJlclxuICAgIGRpc3BhdGNoKCdhY3RpdmVUYWJDaGFuZ2VkJywgdGFiTnVtYmVyKVxuICB9XG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgY2hhbmdlVGFiKGFjdGl2ZVRhYilcbiAgfSlcblxuICBvbkRlc3Ryb3koKCkgPT4ge1xuICAgIHVuc3Vic2NyaWJlKClcbiAgfSlcbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbiAgLnRhYnMtd3JhcHBlciB7XG4gICAgJi5pcy1mdWxsd2lkdGgge1xuICAgICAgLyogVE9ETyAqL1xuICAgIH1cblxuICAgIC50YWItY29udGVudCB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgIGZsZXgtd3JhcDogbm93cmFwO1xuICAgICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cInRhYnMtd3JhcHBlclwiIGNsYXNzOmlzLWZ1bGx3aWR0aD17ZXhwYW5kZWR9PlxuICA8bmF2IGNsYXNzPVwidGFicyB7c2l6ZX0ge3Bvc2l0aW9ufSB7c3R5bGV9XCI+XG4gICAgPHVsPlxuICAgICAgeyNlYWNoICR0YWJzIGFzIHRhYiwgaW5kZXh9XG4gICAgICAgIDxsaSBjbGFzczppcy1hY3RpdmU9e2luZGV4ID09PSBhY3RpdmVUYWJ9PlxuICAgICAgICAgIDxhIGhyZWYgb246Y2xpY2t8cHJldmVudERlZmF1bHQ9eygpID0+IGNoYW5nZVRhYihpbmRleCl9PlxuICAgICAgICAgICAgeyNpZiB0YWIuaWNvbn1cbiAgICAgICAgICAgICAgPEljb24gcGFjaz17dGFiLmljb25QYWNrfSBpY29uPXt0YWIuaWNvbn0gLz5cbiAgICAgICAgICAgIHsvaWZ9XG5cbiAgICAgICAgICAgIDxzcGFuPnt0YWIubGFiZWx9PC9zcGFuPlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgPC9saT5cbiAgICAgIHsvZWFjaH1cbiAgICA8L3VsPlxuICA8L25hdj5cbiAgPHNlY3Rpb24gY2xhc3M9XCJ0YWItY29udGVudFwiPlxuICAgIDxzbG90IC8+XG4gIDwvc2VjdGlvbj5cbjwvZGl2PlxuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgYmVmb3JlVXBkYXRlLCBzZXRDb250ZXh0LCBnZXRDb250ZXh0LCB0aWNrLCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICBpbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSdcblxuICAvKiogTGFiZWwgZm9yIHRhYlxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gbGFiZWxcbiAgICogKi9cbiAgZXhwb3J0IGxldCBsYWJlbFxuXG4gIC8qKiBTaG93IHRoaXMgaWNvbiBvbiBsZWZ0LXNpZGUgb2YgdGhlIHRhYlxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW2ljb25dXG4gICAqICovXG4gIGV4cG9ydCBsZXQgaWNvbiA9ICcnXG5cbiAgLyoqIEZvbnRhd2Vzb21lIGljb24gcGFjayB0byB1c2UuIEJ5IGRlZmF1bHQgdGhlIDxjb2RlPkljb248L2NvZGU+IGNvbXBvbmVudCB1c2VzIDxjb2RlPmZhczwvY29kZT5cbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtpY29uUGFja11cbiAgICogQHZhbHVlcyA8Y29kZT5mYXM8L2NvZGU+LCA8Y29kZT5mYWI8L2NvZGU+LCBldGMuLi5cbiAgICogKi9cbiAgZXhwb3J0IGxldCBpY29uUGFjayA9ICcnXG5cbiAgbGV0IGFjdGl2ZSA9IGZhbHNlXG5cbiAgbGV0IGVsXG4gIGxldCBpbmRleFxuICBsZXQgc3RhcnRpbmcgPSBmYWxzZVxuICBsZXQgZGlyZWN0aW9uID0gJydcbiAgbGV0IGlzSW4gPSBmYWxzZVxuXG4gIGNvbnN0IHRhYkNvbmZpZyA9IGdldENvbnRleHQoJ3RhYnMnKVxuXG4gIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGFuZ2VUYWIoeyBmcm9tLCB0byB9KSB7XG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm5cblxuICAgIC8vIGNvbnNvbGUubG9nKHsgaW5kZXgsIGZyb20sIHRvIH0sIHRvID09PSBpbmRleClcbiAgICBpZiAoZnJvbSA9PT0gaW5kZXgpIHtcbiAgICAgIC8vIFRyYW5zaXRpb24gb3V0XG4gICAgICBkaXJlY3Rpb24gPSBpbmRleCA8IHRvID8gJ2xlZnQnIDogJ3JpZ2h0J1xuICAgIH0gZWxzZSBpZiAodG8gPT09IGluZGV4KSB7XG4gICAgICAvLyBUcmFuc2l0aW9uIGluOyBzdGFydCBhdCBkaXJlY3Rpb24gd2hlbiByZW5kZXJlZCwgdGhlbiByZW1vdmUgaXRcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdUUkFOU0lUSU9OJywgeyBpbmRleCwgdG8sIGFjdGl2ZSB9KVxuICAgICAgYWN0aXZlID0gdHJ1ZVxuICAgICAgZGlyZWN0aW9uID0gaW5kZXggPiBmcm9tID8gJ3JpZ2h0JyA6ICdsZWZ0J1xuICAgICAgLy8gYXdhaXQgdGljaygpXG4gICAgICAvLyBkaXJlY3Rpb24gPSAnJ1xuICAgIH0gZWxzZSBkaXJlY3Rpb24gPSAnJ1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlSW5kZXgoKSB7XG4gICAgaWYgKCFlbCkgcmV0dXJuXG4gICAgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGVsLnBhcmVudE5vZGUuY2hpbGRyZW4sIGVsKVxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gdHJhbnNpdGlvbmVuZChldmVudCkge1xuICAgIC8vIGNvbnNvbGUubG9nKHsgaW5kZXgsIGFjdGl2ZSwgYWN0aXZlVGFiOiB0YWJDb25maWcuYWN0aXZlVGFiIH0pXG4gICAgLy8gY29uc29sZS5sb2coZXZlbnQudGFyZ2V0KVxuICAgIGFjdGl2ZSA9IGluZGV4ID09PSB0YWJDb25maWcuYWN0aXZlVGFiXG4gICAgYXdhaXQgdGljaygpXG4gICAgZGlyZWN0aW9uID0gJydcbiAgfVxuXG4gIHRhYkNvbmZpZy50YWJzLnN1YnNjcmliZSh0YWJzID0+IHtcbiAgICB1cGRhdGVJbmRleCgpXG4gIH0pXG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgdXBkYXRlSW5kZXgoKVxuXG4gICAgdGFiQ29uZmlnLnRhYnMudXBkYXRlKHRhYnMgPT4gW1xuICAgICAgLi4udGFicyxcbiAgICAgIHtcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIGxhYmVsLFxuICAgICAgICBpY29uLFxuICAgICAgICBpY29uUGFjayxcbiAgICAgICAgYWN0aXZhdGU6ICgpID0+IChhY3RpdmUgPSB0cnVlKSxcbiAgICAgICAgZGVhY3RpdmF0ZTogKCkgPT4gKGFjdGl2ZSA9IGZhbHNlKSxcbiAgICAgICAgY2hhbmdlVGFiLFxuICAgICAgfSxcbiAgICBdKVxuICB9KVxuXG4gIGJlZm9yZVVwZGF0ZShhc3luYyAoKSA9PiB7XG4gICAgaWYgKGluZGV4ID09PSB0YWJDb25maWcuYWN0aXZlVGFiICYmIGRpcmVjdGlvbikge1xuICAgICAgYXdhaXQgdGljaygpXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGlyZWN0aW9uID0gJydcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAvLyBOT1RFOiBhZGQgdHJhbnNpdGlvbnMvYW5pbWF0aW9ucyBiYWNrIG9uY2UgdGhleSdyZSB3b3JraW5nXG4gIC50YWIge1xuICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgZmxleDogMSAwIDEwMCU7XG4gICAgLy8gd2lsbC1jaGFuZ2U6IHRyYW5zZm9ybTtcbiAgICAvLyB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gNDAwbXMgZWFzZS1pbjtcblxuICAgICYuaXMtYWN0aXZlIHtcbiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgIC8vIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwKTtcbiAgICB9XG5cbiAgICAvLyAmLnN0YXJ0aW5nIHtcbiAgICAvLyAgIHRyYW5zaXRpb246IG5vbmU7XG4gICAgLy8gfVxuXG4gICAgLy8gJi5sZWZ0IHtcbiAgICAvLyAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7XG4gICAgLy8gfVxuXG4gICAgLy8gJi5yaWdodCB7XG4gICAgLy8gICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTAwJSk7XG4gICAgLy8gfVxuXG4gICAgLy8gJi5zdGFydGluZyB7XG4gICAgLy8gICB0cmFuc2l0aW9uOiBub25lO1xuICAgIC8vIH1cbiAgfVxuPC9zdHlsZT5cblxuPGRpdlxuICBjbGFzcz1cInRhYiB7ZGlyZWN0aW9ufVwiXG4gIGNsYXNzOmlzLWFjdGl2ZT17YWN0aXZlfVxuICBiaW5kOnRoaXM9e2VsfVxuICBhcmlhLWhpZGRlbj17IWFjdGl2ZX1cbiAgb246dHJhbnNpdGlvbmVuZD17dHJhbnNpdGlvbmVuZH0+XG4gIDxzbG90IHtsYWJlbH0ge2ljb25QYWNrfSB7aWNvbn0gLz5cbjwvZGl2PlxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcclxuICBlbGVtZW50OicnLFxyXG4gIHRpdGxlOicnLFxyXG4gIHBhdGg6JycsXHJcbiAgdXJsOicnLFxyXG59KTtcclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBoZWlnaHQ7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoKSB7XHJcbiAgcmV0dXJuIGhlaWdodCA/IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke2hlaWdodH1weCk7YCA6ICcnO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInZib3ggbGVmdFwiPlxyXG4gIDxkaXYgY2xhc3M9XCJ0YWJsZS1jb250YWluZXJcIiBzdHlsZT1cIntyZXNpemUoKX1cIj5cclxuICAgIDxzbG90Pjwvc2xvdD5cclxuICA8L2Rpdj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi52Ym94IHtcclxuICBmbGV4OiBhdXRvO1xyXG4gIGRpc3BsYXk6IGZsZXg7XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbn1cclxuLnZib3gubGVmdCB7XHJcbiAgd2lkdGg6IDEwMCU7XHJcbn1cclxuLnRhYmxlLWNvbnRhaW5lciB7XHJcbiAgb3ZlcmZsb3c6IGF1dG87XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBoZWlnaHQ7XHJcblxyXG5pbXBvcnQge3NwcmluZ30gZnJvbSAnc3ZlbHRlL21vdGlvbidcclxuaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcclxuXHJcbmNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XHJcbiAgXHJcbmxldCBkcm9wVGFyZ2V0O1xyXG5mdW5jdGlvbiBkcmFnZ2FibGUobm9kZSwgcGFyYW1zKSB7XHJcbiAgXHJcbiAgbGV0IGxhc3RYO1xyXG4gIGxldCBwYXJlbnRYO1xyXG4gIGxldCBvZmZzZXRYID0gMFxyXG4gIGNvbnN0IG9mZnNldCA9IHNwcmluZyh7eDogb2Zmc2V0WCwgeTogMH0sIHtcclxuXHRcdHN0aWZmbmVzczogMC4yLFxyXG5cdFx0ZGFtcGluZzogMC40XHJcblx0fSk7XHJcblxyXG4gIG9mZnNldC5zdWJzY3JpYmUob2Zmc2V0ID0+IHtcclxuICAgIGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcclxuICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgY29uc3QgbGVmdCA9IHBhcmVudFggKyBvZmZzZXQueFxyXG4gICAgICBwYXJlbnQuc3R5bGUubGVmdCA9IGAke2xlZnR9cHhgO1xyXG4gICAgICBwYXJlbnQuc3R5bGUud2lkdGggPSBgY2FsYygxMDB2dyAtICR7bGVmdH1weGA7XHJcbiAgICB9XHJcbiAgfSlcclxuXHJcbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24pO1xyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZWRvd24oZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuXHRcdGxhc3RYID0gZXZlbnQuY2xpZW50WDtcclxuICAgIHBhcmVudFggPSBub2RlLnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcclxuICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnZHJhZ2dlZCcpXHJcblxyXG4gICAgZGlzcGF0Y2goJ2RyYWdzdGFydCcsIHt0YXJnZXQ6bm9kZSwgbGFzdFh9KTtcclxuXHJcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlKTtcclxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2V1cCk7XHJcblx0fVxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZW1vdmUoZSkge1xyXG4gICAgb2Zmc2V0WCArPSBlLmNsaWVudFggLSBsYXN0WDtcclxuICAgIG9mZnNldC5zZXQoe3g6IG9mZnNldFgsIHk6IDB9KTtcclxuICAgIFxyXG5cdFx0bGFzdFggPSBlLmNsaWVudFg7XHJcbiAgICBkaXNwYXRjaCgnZHJhZycsIHt0YXJnZXQ6bm9kZSwgbGVmdDogbm9kZS5wYXJlbnROb2RlLm9mZnNldExlZnR9KTtcclxuXHR9XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNldXAoZXZlbnQpIHtcclxuICAgIG9mZnNldFggPSAwO1xyXG4gICAgZHJvcFRhcmdldCA9IG51bGw7XHJcbiAgICBsYXN0WCA9IHVuZGVmaW5lZDtcclxuICAgIHBhcmVudFggPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgbm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnZ2VkJyk7XHJcbiAgICBvZmZzZXQuc2V0KHt4OiBub2RlLm9mZnNldExlZnQsIHk6IDB9KTtcclxuICAgIGRpc3BhdGNoKCdkcmFnZW5kJywge3RhcmdldDogbm9kZSwgbGVmdDogbm9kZS5wYXJlbnROb2RlLm9mZnNldExlZnR9KTtcclxuICAgIFxyXG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSk7XHJcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNldXApO1xyXG5cdH1cclxuICBcclxuICByZXR1cm4ge1xyXG5cdFx0ZGVzdHJveSgpIHtcclxuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24pO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzaXplKCkge1xyXG4gIHJldHVybiBoZWlnaHQgPyBgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gJHtoZWlnaHR9cHgpO2AgOiAnJztcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJyZXNpemVcIiB1c2U6ZHJhZ2dhYmxlIHN0eWxlPVwie3Jlc2l6ZSgpfVwiPiA8L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnJlc2l6ZSB7XHJcbiAgd2lkdGg6IDJweDtcclxuICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogI2YzYzQ5ZDtcclxuICBjdXJzb3I6IGNvbC1yZXNpemU7XHJcbiAgei1pbmRleDogNTtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgbGVmdDtcclxuZXhwb3J0IGxldCBoZWlnaHQ7XHJcblxyXG5pbXBvcnQge2NyZWF0ZUV2ZW50RGlzcGF0Y2hlcn0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IFNwbGl0dGVyIGZyb20gJy4vU3BsaXR0ZXIuc3ZlbHRlJztcclxuXHJcbmNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoKSB7XHJcbiAgbGV0IGNzcyA9IGBsZWZ0OiAke2xlZnR9cHg7d2lkdGg6IGNhbGMoMTAwdncgLSAke2xlZnR9cHgpO2BcclxuICBpZiAoaGVpZ2h0KSB7XHJcbiAgICBjc3MgKz0gYGhlaWdodDogY2FsYygxMDB2aCAtICR7aGVpZ2h0fXB4KTtgO1xyXG4gIH1cclxuICByZXR1cm4gY3NzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkcmFnZ2VkKGUpIHtcclxuICBkaXNwYXRjaCgnZHJhZycsICBlLmRldGFpbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYWdlbmQoZSkge1xyXG4gIGRpc3BhdGNoKCdkcmFnZW5kJywgIGUuZGV0YWlsKTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ2Ym94IHJpZ2h0XCIgc3R5bGU9XCJ7cmVzaXplKCl9XCI+XHJcbiAgPFNwbGl0dGVyIG9uOmRyYWc9e2RyYWdnZWR9IG9uOmRyYWdlbmQ9e2RyYWdlbmR9IGhlaWdodD1cIntoZWlnaHR9XCIvPlxyXG4gIDxzbG90Pjwvc2xvdD5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi52Ym94IHtcclxuICBmbGV4OiBhdXRvO1xyXG4gIGRpc3BsYXk6IGZsZXg7XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbn1cclxuLnZib3gucmlnaHQge1xyXG4gIHJpZ2h0OiAwO1xyXG4gIGxlZnQ6IDE2M3B4O1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBiYWNrZ3JvdW5kOiAjZjFmN2Y3ZTM7XHJcbiAgd2lkdGg6IGNhbGMoMTAwdncgLSAxNjNweCk7XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XHJcbn1cclxuXHJcblxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIGJ0bkNsZWFyKGUpIHtcclxuICB3c19fc2VuZCgnY2xlYXJMb2dzJywge2Jyb3dzZXJOYW1lOiAnY2hyb21pdW0nfSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBDbGVhciEnKTtcclxuICB9KTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XHJcbjxidXR0b24gb246Y2xpY2s9XCJ7YnRuQ2xlYXJ9XCI+XHJcbjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIiB2aWV3Qm94PVwiMCAwIDUxMiA1MTJcIj48cGF0aCBzdHlsZT1cImZpbGw6cmVkXCIgZD1cIk0yNTYgOEMxMTkuMDM0IDggOCAxMTkuMDMzIDggMjU2czExMS4wMzQgMjQ4IDI0OCAyNDggMjQ4LTExMS4wMzQgMjQ4LTI0OFMzOTIuOTY3IDggMjU2IDh6bTEzMC4xMDggMTE3Ljg5MmM2NS40NDggNjUuNDQ4IDcwIDE2NS40ODEgMjAuNjc3IDIzNS42MzdMMTUwLjQ3IDEwNS4yMTZjNzAuMjA0LTQ5LjM1NiAxNzAuMjI2LTQ0LjczNSAyMzUuNjM4IDIwLjY3NnpNMTI1Ljg5MiAzODYuMTA4Yy02NS40NDgtNjUuNDQ4LTcwLTE2NS40ODEtMjAuNjc3LTIzNS42MzdMMzYxLjUzIDQwNi43ODRjLTcwLjIwMyA0OS4zNTYtMTcwLjIyNiA0NC43MzYtMjM1LjYzOC0yMC42NzZ6XCIvPjwvc3ZnPlxyXG48L2J1dHRvbj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5idG4tY29udGFpbmVyIHtcclxuICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgbWFyZ2luLXRvcDogLTFweDtcclxuICBsZWZ0OiA3MHB4O1xyXG4gIHRvcDogMXB4O1xyXG59XHJcbmJ1dHRvbiB7XHJcbiAgYm9yZGVyOiAwO1xyXG4gIHdpZHRoOiAyNnB4O1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmV4cG9ydCBsZXQgaXRlbTtcclxuXHJcbmZ1bmN0aW9uIGVtcHR5KCkge1xyXG4gIHNvdXJjZS5zZXQoe1xyXG4gICAgZWxlbWVudDogJycsXHJcbiAgICB0aXRsZTogJycsXHJcbiAgICBwYXRoOiAnJyxcclxuICAgIHVybDogJycsXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcclxuICBsZXQge2l0ZW19ID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQ7XHJcbiAgaWYgKGl0ZW09PT0kc291cmNlLmVsZW1lbnQpIHtcclxuICAgIGVtcHR5KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGVtcHR5KCk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgY29uc3QgbyA9IHdpbmRvdy5taXRtLmZpbGVzLmxvZ1tpdGVtXTtcclxuICAgICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgZWxlbWVudDogaXRlbSxcclxuICAgICAgICAgIHRpdGxlOiBvLnRpdGxlLFxyXG4gICAgICAgICAgcGF0aDogby5wYXRoLFxyXG4gICAgICAgICAgdXJsOiBpdGVtLnJlcGxhY2UoL14uK1xcLm1pdG0tcGxheS8sJ2h0dHBzOi8vbG9jYWxob3N0OjMwMDEnKSxcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9LCAwKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHMoe2dlbmVyYWw6Z30pIHtcclxuICByZXR1cm4gYF8ke01hdGgudHJ1bmMoZy5zdGF0dXMvMTAwKX1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtKHtnZW5lcmFsOmd9KSB7XHJcbiAgcmV0dXJuIGAke2cubWV0aG9kLnRvTG93ZXJDYXNlKCl9YDtcclxufVxyXG5mdW5jdGlvbiB1KHtnZW5lcmFsOmd9KSB7XHJcbiAgaWYgKGcudXJsLm1hdGNoKCcvbG9nLycpKSB7XHJcbiAgICByZXR1cm4gZy51cmwuc3BsaXQoJ0AnKVsxXTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGAke2cudXJsLnNwbGl0KCc/JylbMF19YDtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gcCh7Z2VuZXJhbDpnfSkge1xyXG4gIGlmIChnLnVybC5tYXRjaCgnL2xvZy8nKSkge1xyXG4gICAgcmV0dXJuICcnO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBwYXJtcyA9IGcudXJsLnNwbGl0KCc/JylbMV07XHJcbiAgICByZXR1cm4gcGFybXMgPyBgPyR7cGFybXN9YCA6ICcnO1xyXG4gIH1cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjx0ciBjbGFzcz1cInRyXCI+XHJcbiAgPHRkIGNsYXNzPVwie2l0ZW0uZWxlbWVudCA/ICdzZWxlY3RlZCcgOiAnJ31cIj5cclxuICAgIDxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskc291cmNlLmVsZW1lbnQ9PT1pdGVtLmVsZW1lbnR9XCJcclxuICAgIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxyXG4gICAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXHJcbiAgICA+XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwic3RhdHVzIHtzKGl0ZW0pfVwiPntpdGVtLmdlbmVyYWwuc3RhdHVzfTwvc3Bhbj4gXHJcbiAgICAgIDxzcGFuIGNsYXNzPVwibWV0aG9kIHttKGl0ZW0pfVwiPntpdGVtLmdlbmVyYWwubWV0aG9kfTwvc3Bhbj4gXHJcbiAgICAgIDxzcGFuIGNsYXNzPVwidXJsXCI+e3UoaXRlbSl9PC9zcGFuPiBcclxuICAgICAgPHNwYW4gY2xhc3M9XCJwcm1cIj57cChpdGVtKX08L3NwYW4+IFxyXG4gICAgPC9kaXY+XHJcbiAgPC90ZD5cclxuPC90cj5cclxuXHJcbjxzdHlsZT5cclxuLnRkLWl0ZW06aG92ZXIge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxudGQge1xyXG4gIGJvcmRlci1ib3R0b206IDNweCBzb2xpZCAjYzBkOGNjYTE7XHJcbiAgZm9udC1mYW1pbHk6ICdHaWxsIFNhbnMnLCAnR2lsbCBTYW5zIE1UJywgQ2FsaWJyaSwgJ1RyZWJ1Y2hldCBNUycsIHNhbnMtc2VyaWY7XHJcbn1cclxuLnRkLWl0ZW0sXHJcbi50ZC1zaG93IHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XHJcbn1cclxuLnN0YXR1cyB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG59XHJcbi5zdGF0dXMuXzQsXHJcbi5zdGF0dXMuXzUge1xyXG4gIGNvbG9yOiByZWQ7XHJcbn1cclxuLm1ldGhvZCB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG59XHJcbi5tZXRob2QucG9zdCB7XHJcbiAgY29sb3I6ICNhNzI2N2Y7XHJcbn1cclxuLnBybSB7XHJcbiAgY29sb3I6ICNjY2I3Yjc7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5sZXQgc291cmNlQ29kZSA9ICcnO1xyXG5cclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDb2RlTWlyb3IoKSB7XHJcbiAgaWYgKCF3aW5kb3cuc2hvd2NvZGUpIHtcclxuICAgIHdpbmRvdy5zaG93Y29kZSA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVtb2NvZGVcIiksIHtcclxuICAgICAgbGluZU51bWJlcnM6IHRydWUsXHJcbiAgICAgIG1vZGU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICBtYXRjaEJyYWNrZXRzOiB0cnVlXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gY29kZU1pcnJvcihjb2RlKSB7XHJcbiAgaWYgKCFjb2RlKSB7XHJcbiAgICByZXR1cm4gJyc7XHJcbiAgfVxyXG4gIGlmICh3aW5kb3cuc2hvd2NvZGUpIHtcclxuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3Nob3ctY29kZSAuQ29kZU1pcnJvcicpO1xyXG4gICAgbm9kZXMuZm9yRWFjaChlbGVtZW50ID0+IGVsZW1lbnQucmVtb3ZlKCkpO1xyXG4gICAgd2luZG93LnNob3djb2RlID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBzZXRUaW1lb3V0KCgpID0+IHNldHVwQ29kZU1pcm9yKCksIDEpO1xyXG4gIHJldHVybiBjb2RlLnJlcGxhY2UoLyAgIFwiKC4rKVwiKDopL2csIChtLHAxLHAyKSA9PiAgYCAgICcke3AxfSc6YCkuXHJcbiAgICAgICAgICAgICAgcmVwbGFjZSggIC8gXCIoLispXCIoOikvZywgKG0scDEscDIpID0+ICBgIFxcYCR7cDF9XFxgOmApO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRTb3VyY2UoKSB7XHJcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKCRzb3VyY2UudXJsKTtcclxuICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcC50ZXh0KCk7XHJcblxyXG4gIGlmIChyZXNwLm9rKSB7XHJcbiAgICBzb3VyY2VDb2RlID0gdGV4dDtcclxuICAgIGNvbnNvbGUubG9nKCdGZXRjaCBzdWNjZXNzJylcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc29sZS5sb2coJ0ZldGNoIEVycmlyJywgcmVzcC5zdGF0dXMpXHJcbiAgfVxyXG4gIHJldHVybiBNYXRoLnJhbmRvbSgpKycnO1xyXG59XHJcblxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJpdGVtLXNob3dcIj5cclxuICB7I2lmICRzb3VyY2UudGl0bGUubWF0Y2goJy5wbmcnKX1cclxuICAgIDxpbWcgc3JjPVwieyRzb3VyY2UudXJsfVwiIGFsdD1cImltYWdlXCIvPlxyXG4gIHs6ZWxzZSBpZiAkc291cmNlLnRpdGxlLm1hdGNoKCcuanNvbicpfVxyXG4gICAgPGRpdiBpZD1cInNob3ctY29kZVwiIGRhdGEtZHVtbXk9e2dldFNvdXJjZSgpfT5cclxuICAgICAgPHRleHRhcmVhIGlkPVwiZGVtb2NvZGVcIj57Y29kZU1pcnJvcihzb3VyY2VDb2RlKX08L3RleHRhcmVhPlxyXG4gICAgPC9kaXY+XHJcbiAgezplbHNlfVxyXG4gICAgPGJ1dHRvbj5YPC9idXR0b24+XHJcbiAgey9pZn1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5pdGVtLXNob3cge1xyXG4gIG1hcmdpbi1sZWZ0OiAycHg7XHJcbn1cclxuI3Nob3ctY29kZSB7XHJcbiAgZm9udC1zaXplOiAxMnB4O1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDMxcHgpO1xyXG4gIG92ZXJmbG93OiBhdXRvO1xyXG59XHJcbiNkZW1vY29kZSB7XHJcbiAgZGlzcGxheTogbm9uZTtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xyXG5pbXBvcnQgQlJlc2l6ZSBmcm9tICcuLi9ib3gvQlJlc2l6ZS5zdmVsdGUnO1xyXG5pbXBvcnQgQkhlYWRlciBmcm9tICcuLi9ib3gvQkhlYWRlci5zdmVsdGUnO1xyXG5pbXBvcnQgQlRhYmxlIGZyb20gJy4uL2JveC9CVGFibGUuc3ZlbHRlJztcclxuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xyXG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcclxuaW1wb3J0IFNob3cgZnJvbSAnLi9TaG93LnN2ZWx0ZSc7XHJcblxyXG5sZXQganNvbiA9IDE2MztcclxubGV0IGRhdGEgPSAgW107XHJcblxyXG4kOiBfanNvbiA9IGpzb247XHJcbiQ6IF9kYXRhID0gZGF0YTtcclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgd3NfX3NlbmQoJ2dldExvZycsICcnLCBsb2dIYW5kbGVyKVxyXG4gIH0sIDEwKTtcclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ2pzb24nLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICBkYXRhLmpzb24gJiYgKGpzb24gPSBkYXRhLmpzb24pO1xyXG4gIH0pO1xyXG59KTtcclxuXHJcbmNvbnN0IGxvZ0hhbmRsZXIgPSBvYmogPT4ge1xyXG4gIGNvbnNvbGUubG9nKCd3c19fc2VuZChnZXRMb2cpJywgb2JqKTtcclxuICBpZiAod2luZG93Lm1pdG0uZmlsZXMubG9nPT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5sb2cgPSBvYmo7XHJcbiAgICBkYXRhID0gb2JqO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCB7bG9nfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xyXG4gICAgY29uc3QgbmV3TG9nID0ge307XHJcbiAgICBmb3IgKGxldCBrIGluIG9iaikge1xyXG4gICAgICBuZXdMb2dba10gPSBsb2dba10gPyBsb2dba10gOiBvYmpba107IFxyXG4gICAgfVxyXG4gICAgd2luZG93Lm1pdG0uZmlsZXMubG9nID0gbmV3TG9nXHJcbiAgICBkYXRhID0gbmV3TG9nO1xyXG4gIH1cclxufVxyXG5cclxud2luZG93Lm1pdG0uZmlsZXMubG9nX2V2ZW50cy5Mb2dzVGFibGUgPSAoKSA9PiB7XHJcbiAgd3NfX3NlbmQoJ2dldExvZycsICcnLCBsb2dIYW5kbGVyKVxyXG59XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAganNvbiA9IGRldGFpbC5sZWZ0O1xyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7anNvbn0pXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidmJveFwiPlxyXG4gIDxCU3RhdGljPlxyXG4gICAgPEJIZWFkZXI+LUxvZ3MtPC9CSGVhZGVyPlxyXG4gICAgPEJ1dHRvbi8+XHJcbiAgICA8QlRhYmxlPlxyXG4gICAgICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGEpIGFzIGl0ZW19XHJcbiAgICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtLCAuLi5fZGF0YVtpdGVtXX19Lz5cclxuICAgICAgey9lYWNofVxyXG4gICAgPC9CVGFibGU+XHJcbiAgPC9CU3RhdGljPlxyXG4gIHsjaWYgJHNvdXJjZS5lbGVtZW50fVxyXG4gICAgPEJSZXNpemUgbGVmdD17X2pzb259IG9uOmRyYWdlbmQ9e2RyYWdlbmR9PlxyXG4gICAgICA8U2hvdy8+XHJcbiAgICA8L0JSZXNpemU+XHJcbiAgey9pZn1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi52Ym94IHtcclxuICBmbGV4OiBhdXRvO1xyXG4gIGRpc3BsYXk6IGZsZXg7XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcclxuICBvcGVuRGlzYWJsZWQ6IGZhbHNlLFxyXG4gIHNhdmVEaXNhYmxlZDogdHJ1ZSxcclxuICBnb0Rpc2FibGVkOiB0cnVlLFxyXG4gIGNvbnRlbnQ6JycsXHJcbiAgcGF0aDonJyxcclxufSk7XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xyXG4gIHNvdXJjZS51cGRhdGUobiA9PiB7XHJcbiAgICByZXR1cm4gey4uLm4sIGNvbnRlbnQ6IHdpbmRvdy5lZGl0b3IuZ2V0VmFsdWUoKX1cclxuICB9KVxyXG4gIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xyXG5cclxuICB3c19fc2VuZCgnc2F2ZVJvdXRlJywgJHNvdXJjZSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBTYXZlIScpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidG5PcGVuKCkge1xyXG4gIHdzX19zZW5kKCdvcGVuUm91dGUnLCAkc291cmNlLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIE9wZW4hJyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bkdvKGUpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzWyRzb3VyY2UuaXRlbV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybCkge1xyXG4gICAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IHJvdXRlLnVybH0pO1xyXG4gIH1cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cclxuUGF0aDp7JHNvdXJjZS5wYXRofVxyXG57I2lmICRzb3VyY2UucGF0aH1cclxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxyXG4gIDxidXR0b24gY2xhc3M9XCJidG4tc2F2ZVwiIGRpc2FibGVkPXskc291cmNlLnNhdmVEaXNhYmxlZH0gb246Y2xpY2s9XCJ7YnRuU2F2ZX1cIj5TYXZlPC9idXR0b24+IC1cclxuICA8YnV0dG9uIGNsYXNzPVwiYnRuLW9wZW5cIiBkaXNhYmxlZD17JHNvdXJjZS5vcGVuRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bk9wZW59XCI+T3BlbjwvYnV0dG9uPiAtXHJcbiAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1nb1wiICAgZGlzYWJsZWQ9eyRzb3VyY2UuZ29EaXNhYmxlZH0gICBvbjpjbGljaz1cIntidG5Hb31cIiAgPkdvPC9idXR0b24+XHJcbiAgPC9kaXY+XHJcbnsvaWZ9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uZmlsZS1wYXRoIHtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgZm9udC1mYW1pbHk6IGF1dG87XHJcbiAgZm9udC1zaXplOiAwLjllbTtcclxuICBjb2xvcjogYmx1ZTtcclxufVxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IDA7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5leHBvcnQgbGV0IG9uQ2hhbmdlZDtcclxuXHJcbmZ1bmN0aW9uIHNldHVwQ29kZU1pcm9yKCkge1xyXG4gIGlmICghd2luZG93LmVkaXRvcikge1xyXG4gICAgd2luZG93LmVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVtb3RleHRcIiksIHtcclxuICAgICAgbGluZU51bWJlcnM6IHRydWUsXHJcbiAgICAgIG1vZGU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICBtYXRjaEJyYWNrZXRzOiB0cnVlLFxyXG4gICAgICBzY3JvbGxiYXJTdHlsZTogJ25hdGl2ZScsXHJcbiAgICB9KTtcclxuICAgIGVkaXRvci5vbignY2hhbmdlcycsIG9uQ2hhbmdlZCk7XHJcbiAgICBvbkNoYW5nZWQoZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxub25Nb3VudChhc3luYyAoKSA9PiBzZXR1cENvZGVNaXJvcigpKVxyXG5cclxuZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcclxuICBsZXQge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICBjb25zdCB1cmwgPSBtaXRtLnJvdXRlc1tpdGVtXS51cmw7XHJcbiAgY29uc3Qgb2JqID0gd2luZG93Lm1pdG0uZmlsZXMucm91dGVbaXRlbV07XHJcbiAgY29uc29sZS5sb2coaXRlbSwgb2JqKTtcclxuICBpZiAod2luZG93LmVkaXRvcikge1xyXG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY29kZS1taXJyb3IgLkNvZGVNaXJyb3InKTtcclxuICAgIG5vZGVzLmZvckVhY2goZWxlbWVudCA9PiBlbGVtZW50LnJlbW92ZSgpKTtcclxuICAgIHdpbmRvdy5lZGl0b3IgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIHNldFRpbWVvdXQoKCkgPT4gc2V0dXBDb2RlTWlyb3IoKSwgMTAwKVxyXG4gIHNvdXJjZS51cGRhdGUobiA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5uLFxyXG4gICAgICBnb0Rpc2FibGVkOiAodXJsPT09dW5kZWZpbmVkKSxcclxuICAgICAgY29udGVudDogb2JqLmNvbnRlbnQsXHJcbiAgICAgIHBhdGg6IG9iai5wYXRoLFxyXG4gICAgICBpdGVtLFxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRyIGNsYXNzPVwidHJcIj5cclxuICA8dGQ+XHJcbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5wYXRoPT09aXRlbS5wYXRofVwiXHJcbiAgICAgIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxyXG4gICAgICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuICAgID57aXRlbS50aXRsZX08L2Rpdj5cclxuICA8L3RkPlxyXG48L3RyPlxyXG5cclxuPHN0eWxlPlxyXG4udGQtaXRlbTpob3ZlciB7XHJcbiAgY29sb3I6IGJsdWU7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxufVxyXG50ZCB7XHJcbiAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICNjMGQ4Y2NhMTtcclxufVxyXG4udGQtaXRlbSxcclxuLnRkLXNob3cge1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBwYWRkaW5nOiAwLjFyZW07XHJcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7ICBcclxufVxyXG4udGQtaXRlbS50cnVlIHtcclxuICBjb2xvcjogYmx1ZTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuaW1wb3J0IEJTdGF0aWMgZnJvbSAnLi4vYm94L0JTdGF0aWMuc3ZlbHRlJztcbmltcG9ydCBCUmVzaXplIGZyb20gJy4uL2JveC9CUmVzaXplLnN2ZWx0ZSc7XG5pbXBvcnQgQkhlYWRlciBmcm9tICcuLi9ib3gvQkhlYWRlci5zdmVsdGUnO1xuaW1wb3J0IEJUYWJsZSBmcm9tICcuLi9ib3gvQlRhYmxlLnN2ZWx0ZSc7XG5pbXBvcnQgQnV0dG9uIGZyb20gJy4vQnV0dG9uLnN2ZWx0ZSc7XG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcblxubGV0IHJvdXRlID0gMTYzO1xubGV0IGRhdGEgPSBbXTtcblxubGV0IHJlcmVuZGVyID0gMDtcblxuJDogX3JvdXRlID0gcm91dGU7XG4kOiBfZGF0YSA9IGRhdGE7XG5cbmNvbnN0IHJvdXRlSGFuZGxlciA9IG9iaiA9PiB7XG4gIGNvbnNvbGUubG9nKCd3c19fc2VuZChnZXRSb3V0ZSknLCBvYmopO1xuICBpZiAod2luZG93Lm1pdG0uZmlsZXMucm91dGU9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG9iajtcbiAgICBkYXRhID0gb2JqO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHtyb3V0ZX0gPSB3aW5kb3cubWl0bS5maWxlcztcbiAgICBjb25zdCBuZXdSb3V0ZSA9IHt9O1xuICAgIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgICBuZXdSb3V0ZVtrXSA9IHJvdXRlW2tdID8gcm91dGVba10gOiBvYmpba107XG4gICAgICBuZXdSb3V0ZVtrXS5jb250ZW50ID0gb2JqW2tdLmNvbnRlbnQ7XG4gICAgfVxuICAgIHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlID0gbmV3Um91dGVcbiAgICBkYXRhID0gbmV3Um91dGU7XG4gIH1cbiAgcmVyZW5kZXIrKztcbn1cblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKVxuICB9LCAxMCk7XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncm91dGUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgZGF0YS5yb3V0ZSAmJiAocm91dGUgPSBkYXRhLnJvdXRlKTtcbiAgfSk7XG59KTtcblxud2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzLnJvdXRlVGFibGUgPSAoKSA9PiB7XG4gIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcbn1cblxubGV0IGVkaXRidWZmZXI7XG5sZXQgX3RpbWVvdXQgPSBudWxsO1xuZnVuY3Rpb24gZWRpdG9yQ2hhbmdlZChlKSB7XG4gIGxldCBzYXZlRGlzYWJsZWQ7XG4gIGlmIChlPT09ZmFsc2UpIHtcbiAgICBzYXZlRGlzYWJsZWQgPSB0cnVlO1xuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHsuLi5uLCBzYXZlRGlzYWJsZWR9fSlcbiAgICBlZGl0YnVmZmVyID0gd2luZG93LmVkaXRvci5nZXRWYWx1ZSgpO1xuICB9XG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XG4gIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKHdpbmRvdy5lZGl0b3Ipe1xuICAgICAgc2F2ZURpc2FibGVkID0gKHdpbmRvdy5lZGl0b3IuZ2V0VmFsdWUoKT09PWVkaXRidWZmZXIpXG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7Li4ubiwgc2F2ZURpc2FibGVkfX0pO1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgfVxuICB9LCA1MDApICBcbn1cblxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xuICByb3V0ZSA9IGRldGFpbC5sZWZ0O1xuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe3JvdXRlfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljIGhlaWdodD1cIjQ3XCI+XG4gICAgPEJIZWFkZXI+LVJvdXRlKHMpLTwvQkhlYWRlcj5cbiAgICA8QlRhYmxlPlxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICAgICAgPEl0ZW0gaXRlbT17e2VsZW1lbnQ6IGl0ZW0sIC4uLl9kYXRhW2l0ZW1dfX0gb25DaGFuZ2VkPXtlZGl0b3JDaGFuZ2VkfS8+XG4gICAgICB7L2VhY2h9XG4gICAgPC9CVGFibGU+XG4gIDwvQlN0YXRpYz5cbiAgPEJSZXNpemUgbGVmdD17X3JvdXRlfSBvbjpkcmFnZW5kPXtkcmFnZW5kfSBoZWlnaHQ9XCI0N1wiPlxuICAgIDxkaXYgaWQ9XCJjb2RlLW1pcnJvclwiPlxuICAgICAgPHRleHRhcmVhIGlkPVwiZGVtb3RleHRcIj57JHNvdXJjZS5jb250ZW50fTwvdGV4dGFyZWE+XG4gICAgPC9kaXY+XG4gIDwvQlJlc2l6ZT5cbjwvZGl2PlxuXG5cbjxzdHlsZT5cbi52Ym94IHtcbiAgZmxleDogYXV0bztcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuI2NvZGUtbWlycm9yIHtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA0MXB4KTtcbiAgb3ZlcmZsb3c6IGF1dG87XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cclxuXHJcbmNvbnN0IHNjcmVlbnNob3RIYW5kbGVyID0gKGRhdGEpID0+IHtcclxuICBjb25zb2xlLmxvZyhkYXRhKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuQ2FwdHVyZShlKSB7XHJcbiAgbGV0IGZuYW1lLCBob3N0O1xyXG4gIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWUsIGxhc3RGb2N1c2VkV2luZG93OiB0cnVlfSwgdGFicyA9PiB7XHJcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKCB0YWJzWzBdLnVybCk7XHJcbiAgICBob3N0ID0gdXJsLmhvc3RuYW1lO1xyXG4gICAgZm5hbWUgPSB1cmwucGF0aG5hbWVcclxuICAgIC5yZXBsYWNlKC9eXFwvLywnJylcclxuICAgIC5yZXBsYWNlKC9cXC8vZywnLScpO1xyXG4gIH0pOyAgXHJcbiAgY2hyb21lLnRhYnMuY2FwdHVyZVZpc2libGVUYWIobnVsbCwge30sIGZ1bmN0aW9uKGltYWdlVXJsKSB7XHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICBob3N0LFxyXG4gICAgICBmbmFtZSxcclxuICAgICAgaW1hZ2VVcmwsXHJcbiAgICB9O1xyXG4gICAgd2luZG93LndzX19zZW5kKCdzY3JlZW5jYXAnLCBkYXRhLCBzY3JlZW5zaG90SGFuZGxlcik7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhpbWFnZSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBidG5PcGVuKCkge1xyXG4gIHdzX19zZW5kKCdvcGVuSG9tZScsICcnLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIG9wZW4gaG9tZSBmb2xkZXIhJyk7XHJcbiAgfSk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48YnV0dG9uIG9uOmNsaWNrPXtidG5PcGVufT5PcGVuIEhvbWU8L2J1dHRvbj5cclxuPCEtLSA8YnV0dG9uIG9uOmNsaWNrPXtidG5DYXB0dXJlfT5DYXB0dXJlPC9idXR0b24+IC0tPlxyXG5cclxuPHN0eWxlPlxyXG48L3N0eWxlPlxyXG4iLCJpbXBvcnQgQXBwIGZyb20gJy4vQXBwLnN2ZWx0ZSc7XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoe1xuXHR0YXJnZXQ6IGRvY3VtZW50LmJvZHksXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgYXBwO1xuIl0sIm5hbWVzIjpbImdldCIsImVtcHR5Iiwic291cmNlIl0sIm1hcHBpbmdzIjoiOzs7OztJQUFBLFNBQVMsSUFBSSxHQUFHLEdBQUc7SUFFbkIsU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtJQUMxQjtJQUNBLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHO0lBQ3ZCLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixJQUFJLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUlELFNBQVMsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7SUFDekQsSUFBSSxPQUFPLENBQUMsYUFBYSxHQUFHO0lBQzVCLFFBQVEsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0lBQ3pDLEtBQUssQ0FBQztJQUNOLENBQUM7SUFDRCxTQUFTLEdBQUcsQ0FBQyxFQUFFLEVBQUU7SUFDakIsSUFBSSxPQUFPLEVBQUUsRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxTQUFTLFlBQVksR0FBRztJQUN4QixJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFO0lBQ3RCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBQ0QsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFO0lBQzVCLElBQUksT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7SUFDdkMsQ0FBQztJQUNELFNBQVMsY0FBYyxDQUFD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OztPQUNuQkEsUUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUFnQixDQUFDLEVBQUUsWUFBWTs7O09BQzlDLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVE7OztNQUVyQyxRQUFRLElBQUksWUFBWSxDQUFDLFFBQVE7O01BQ2pDLFFBQVEsR0FBRyxVQUFVOztZQUNmLE1BQU0sQ0FBQyxNQUFNO1NBQ2YsWUFBWSxHQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxPQUFLLFVBQVU7O1NBQ3JEQSxRQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7c0JBQWdCLENBQUMsRUFBRSxZQUFZOzs7U0FDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7T0FFZCxHQUFHOzs7O2NBR0MsT0FBTyxHQUFFLE1BQU07c0JBQ3RCLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSTtNQUNuQixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUUsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F2RGpDLGlCQUFHLE1BQU0sR0FBRyxLQUFLOzs7O09BQ2pCLGlCQUFHLEtBQUssR0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZDQ2dCRyxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBUGhCLE9BQU87S0FDZCxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJO01BQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUMxQnhDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3BCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJO0lBQ3RCLENBQUMsQ0FBQyxDQUFDOzs7Ozs7OzsifQ==
