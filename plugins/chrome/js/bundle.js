
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

    const tags = writable({
      filterUrl: true,
      __tag1: {},
      __tag2: {},
      __tag3: {},
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

    /* src\components\box\BHeader.svelte generated by Svelte v3.16.7 */

    const file$4 = "src\\components\\box\\BHeader.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(div, file$4, 3, 6, 54);
    			attr_dev(td, "class", "svelte-1cifg6u");
    			add_location(td, file$4, 2, 4, 42);
    			add_location(tr, file$4, 1, 2, 32);
    			attr_dev(table, "class", "table-header svelte-1cifg6u");
    			add_location(table, file$4, 0, 0, 0);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BHeader",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\box\BTable.svelte generated by Svelte v3.16.7 */

    const file$5 = "src\\components\\box\\BTable.svelte";

    function create_fragment$5(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			attr_dev(table, "class", "table-content svelte-11lz7tf");
    			add_location(table, file$5, 0, 0, 0);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BTable",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\tags\Button.svelte generated by Svelte v3.16.7 */
    const file$6 = "src\\components\\tags\\Button.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let label0;
    	let input0;
    	let t0;
    	let t1;
    	let button0;
    	let t2;
    	let t3;
    	let button1;
    	let t4;
    	let t5;
    	let label1;
    	let input1;
    	let t6;
    	let t7;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = text("\n    Activeurl");
    			t1 = space();
    			button0 = element("button");
    			t2 = text("Reset");
    			t3 = space();
    			button1 = element("button");
    			t4 = text("Save");
    			t5 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t6 = text("\n    Autosave");
    			t7 = text("\n  .");
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$6, 44, 4, 929);
    			attr_dev(label0, "class", "checker svelte-12umemg");
    			add_location(label0, file$6, 43, 2, 901);
    			attr_dev(button0, "class", "tlb btn-go svelte-12umemg");
    			button0.disabled = /*autoSave*/ ctx[0];
    			add_location(button0, file$6, 48, 2, 1016);
    			attr_dev(button1, "class", "tlb btn-go svelte-12umemg");
    			button1.disabled = /*autoSave*/ ctx[0];
    			add_location(button1, file$6, 49, 2, 1102);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$6, 51, 4, 1215);
    			attr_dev(label1, "class", "checker svelte-12umemg");
    			add_location(label1, file$6, 50, 2, 1187);
    			attr_dev(div, "class", "btn-container svelte-12umemg");
    			add_location(div, file$6, 42, 0, 871);

    			dispose = [
    				listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    				listen_dev(button0, "click", btnReset, false, false, false),
    				listen_dev(button1, "click", /*btnSave*/ ctx[2], false, false, false),
    				listen_dev(input1, "change", /*input1_change_handler*/ ctx[4])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(label0, input0);
    			input0.checked = /*$tags*/ ctx[1].filterUrl;
    			append_dev(label0, t0);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(button0, t2);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(button1, t4);
    			append_dev(div, t5);
    			append_dev(div, label1);
    			append_dev(label1, input1);
    			input1.checked = /*autoSave*/ ctx[0];
    			append_dev(label1, t6);
    			append_dev(div, t7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$tags*/ 2) {
    				input0.checked = /*$tags*/ ctx[1].filterUrl;
    			}

    			if (dirty & /*autoSave*/ 1) {
    				prop_dev(button0, "disabled", /*autoSave*/ ctx[0]);
    			}

    			if (dirty & /*autoSave*/ 1) {
    				prop_dev(button1, "disabled", /*autoSave*/ ctx[0]);
    			}

    			if (dirty & /*autoSave*/ 1) {
    				input1.checked = /*autoSave*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
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

    function btnReset(e) {
    	window.mitm.files.route_events.routeTable();
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(1, $tags = $$value));
    	let autoSave = true;

    	function btnSave(e) {
    		ws__send("saveTags", $tags);
    	}

    	onMount(() => {
    		let debounce = false;

    		document.querySelector(".set-tags").onclick = function (e) {
    			const { value } = e.target.attributes.type;

    			if (autoSave && value === "checkbox") {
    				if (debounce) {
    					clearTimeout(debounce);
    				}

    				debounce = setTimeout(
    					() => {
    						debounce = false;
    						btnSave();
    					},
    					50
    				);
    			}

    			console.log("clicked", e.target);
    		};

    		window.mitm.browser.chgUrl_events.tagsEvent = function () {
    			console.log("Update tags!");
    			tags.set({ ...$tags });
    		};
    	});

    	function input0_change_handler() {
    		$tags.filterUrl = this.checked;
    		tags.set($tags);
    	}

    	function input1_change_handler() {
    		autoSave = this.checked;
    		$$invalidate(0, autoSave);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("autoSave" in $$props) $$invalidate(0, autoSave = $$props.autoSave);
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [autoSave, $tags, btnSave, input0_change_handler, input1_change_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\tags\Tags1_.svelte generated by Svelte v3.16.7 */
    const file$7 = "src\\components\\tags\\Tags1_.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (76:4) {#each listTags($tags) as item}
    function create_each_block$1(ctx) {
    	let div;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[4] + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[3].call(input, /*item*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[4]);
    			add_location(input, file$7, 78, 8, 1762);
    			attr_dev(span, "class", "big svelte-1iy68r5");
    			add_location(span, file$7, 82, 8, 1894);
    			add_location(label, file$7, 77, 6, 1745);
    			attr_dev(div, "class", div_class_value = "space0 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-1iy68r5");
    			add_location(div, file$7, 76, 4, 1700);

    			dispose = [
    				listen_dev(input, "click", /*clicked*/ ctx[1], false, false, false),
    				listen_dev(input, "change", input_change_handler)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*$tags*/ ctx[0].__tag1[/*item*/ ctx[4]];
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$tags*/ 1 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[4])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*$tags, listTags*/ 1) {
    				input.checked = /*$tags*/ ctx[0].__tag1[/*item*/ ctx[4]];
    			}

    			if (dirty & /*$tags*/ 1 && t1_value !== (t1_value = /*item*/ ctx[4] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$tags*/ 1 && div_class_value !== (div_class_value = "space0 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-1iy68r5")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(76:4) {#each listTags($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let td;
    	let div;
    	let each_value = listTags(/*$tags*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "border svelte-1iy68r5");
    			add_location(div, file$7, 74, 2, 1637);
    			add_location(td, file$7, 73, 0, 1629);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*routetag, listTags, $tags, clicked*/ 7) {
    				each_value = listTags(/*$tags*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
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

    function listTags(tags) {
    	const { toRegex } = window.mitm.fn;
    	const list = {};

    	function add(ns) {
    		for (let id in tags.__tag2[ns]) {
    			const [k, v] = id.split(":");
    			list[v || k] = true;
    		}
    	}

    	if (tags.filterUrl) {
    		for (let ns in tags.__tag2) {
    			const rgx = toRegex(ns.replace(/~/, "[^.]*"));

    			if (mitm.browser.activeUrl.match(rgx)) {
    				add(ns);
    				add("_global_");
    				return Object.keys(list).sort();
    			}
    		}

    		return [];
    	} else {
    		return Object.keys(tags.__tag1);
    	}
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));

    	function clicked(e) {
    		setTimeout(
    			() => {
    				const { __tag1, __tag2, __tag3 } = $tags;
    				const { item } = e.target.dataset;
    				const flag = __tag1[item];
    				console.log("e", flag);

    				for (let ns in __tag2) {
    					const namespace = __tag2[ns];

    					for (let itm in namespace) {
    						const typ2 = itm.split(":")[1] || itm;

    						if (item === typ2) {
    							namespace[itm] = flag;
    						}
    					}
    				}

    				for (let ns in __tag3) {
    					const urls = __tag3[ns];

    					for (let url in urls) {
    						const typs = urls[url];

    						for (let typ in typs) {
    							const namespace = typs[typ];

    							for (let itm in namespace) {
    								if (item === itm) {
    									namespace[itm] = flag;
    								}
    							}
    						}
    					}
    				}

    				const { filterUrl } = $tags;
    				tags.set({ filterUrl, __tag1, __tag2, __tag3 });
    			},
    			10
    		);
    	}

    	function routetag(item) {
    		return $tags.__tag1[item] ? "rtag slc" : "rtag";
    	}

    	function input_change_handler(item) {
    		$tags.__tag1[item] = this.checked;
    		tags.set($tags);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [$tags, clicked, routetag, input_change_handler];
    }

    class Tags1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags1",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\tags\Tags2_1.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$8 = "src\\components\\tags\\Tags2_1.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (66:2) {#each itemlist(items) as item}
    function create_each_block$2(ctx) {
    	let div;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span;
    	let t1_value = show(/*item*/ ctx[6]) + "";
    	let t1;
    	let span_class_value;
    	let t2;
    	let div_class_value;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[5].call(input, /*item*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[6]);
    			add_location(input, file$8, 68, 8, 1470);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*item*/ ctx[6].match(":") ? "big" : "") + " svelte-ebtmg"));
    			add_location(span, file$8, 72, 8, 1595);
    			add_location(label, file$8, 67, 6, 1453);
    			attr_dev(div, "class", div_class_value = "space1 " + /*routetag*/ ctx[3](/*item*/ ctx[6]) + " svelte-ebtmg");
    			add_location(div, file$8, 66, 4, 1408);

    			dispose = [
    				listen_dev(input, "click", /*clicked*/ ctx[2], false, false, false),
    				listen_dev(input, "change", input_change_handler)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*items*/ ctx[0][/*item*/ ctx[6]];
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*items*/ 1 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[6])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*items, itemlist*/ 1) {
    				input.checked = /*items*/ ctx[0][/*item*/ ctx[6]];
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = show(/*item*/ ctx[6]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty(/*item*/ ctx[6].match(":") ? "big" : "") + " svelte-ebtmg"))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*items*/ 1 && div_class_value !== (div_class_value = "space1 " + /*routetag*/ ctx[3](/*item*/ ctx[6]) + " svelte-ebtmg")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(66:2) {#each itemlist(items) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = (/*ns*/ ctx[1] === "_global_" ? " * " : /*ns*/ ctx[1]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let each_value = itemlist(/*items*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("[");
    			t1 = text(t1_value);
    			t2 = text("]");
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "space0 svelte-ebtmg");
    			add_location(div0, file$8, 64, 2, 1309);
    			attr_dev(div1, "class", "border svelte-ebtmg");
    			add_location(div1, file$8, 63, 0, 1285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ns*/ 2 && t1_value !== (t1_value = (/*ns*/ ctx[1] === "_global_" ? " * " : /*ns*/ ctx[1]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*routetag, itemlist, items, show, clicked*/ 13) {
    				each_value = itemlist(/*items*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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

    function itemlist(items) {
    	const arr = Object.keys(items).sort((a, b) => {
    		const [k1, v1] = a.split(":");
    		const [k2, v2] = b.split(":");
    		a = v1 || k1;
    		b = v2 || k2;
    		if (a < b) return -1;
    		if (a > b) return 1;
    		return 0;
    	});

    	return arr;
    }

    function show(item) {
    	const [k, v] = item.split(":");
    	if (v === undefined) return k;
    	return `${v}{${k}}`;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(4, $tags = $$value));
    	let { items } = $$props;
    	let { ns } = $$props;

    	function clicked(e) {
    		setTimeout(
    			() => {
    				const { __tag1, __tag2, __tag3 } = $tags;
    				const { item } = e.target.dataset;
    				const flag = __tag2[ns][item];
    				console.log("e", flag);
    				const urls = __tag3[ns];

    				for (let url in urls) {
    					const typs = urls[url];

    					for (let typ in typs) {
    						const namespace = typs[typ];

    						for (let itm in namespace) {
    							if (item === itm) {
    								namespace[itm] = flag;
    							}
    						}
    					}
    				}

    				const { filterUrl } = $tags;
    				tags.set({ filterUrl, __tag1, __tag2, __tag3 });
    			},
    			10
    		);
    	}

    	function routetag(item) {
    		if (item.match(":")) {
    			return items[item] ? "rtag slc" : "rtag";
    		} else {
    			return items[item] ? "stag slc" : "";
    		}
    	}

    	const writable_props = ["items", "ns"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Tags2_1> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		items[item] = this.checked;
    		$$invalidate(0, items);
    	}

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => {
    		return { items, ns, $tags };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [items, ns, clicked, routetag, $tags, input_change_handler];
    }

    class Tags2_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2_1",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console_1.warn("<Tags2_1> was created without expected prop 'items'");
    		}

    		if (/*ns*/ ctx[1] === undefined && !("ns" in props)) {
    			console_1.warn("<Tags2_1> was created without expected prop 'ns'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags2_1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags2_1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ns() {
    		throw new Error("<Tags2_1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ns(value) {
    		throw new Error("<Tags2_1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags2_.svelte generated by Svelte v3.16.7 */
    const file$9 = "src\\components\\tags\\Tags2_.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (18:2) {#if oneSite(ns)}
    function create_if_block$1(ctx) {
    	let current;

    	const tags21 = new Tags2_1({
    			props: {
    				items: /*$tags*/ ctx[0].__tag2[/*ns*/ ctx[2]],
    				ns: /*ns*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tags21.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tags21, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tags21_changes = {};
    			if (dirty & /*$tags*/ 1) tags21_changes.items = /*$tags*/ ctx[0].__tag2[/*ns*/ ctx[2]];
    			if (dirty & /*$tags*/ 1) tags21_changes.ns = /*ns*/ ctx[2];
    			tags21.$set(tags21_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tags21.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tags21.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tags21, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:2) {#if oneSite(ns)}",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#each Object.keys($tags.__tag2) as ns}
    function create_each_block$3(ctx) {
    	let show_if = /*oneSite*/ ctx[1](/*ns*/ ctx[2]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$tags*/ 1) show_if = /*oneSite*/ ctx[1](/*ns*/ ctx[2]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(17:0) {#each Object.keys($tags.__tag2) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let td;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[0].__tag2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			td = element("td");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(td, file$9, 15, 0, 344);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(td, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*oneSite, Object, $tags*/ 3) {
    				each_value = Object.keys(/*$tags*/ ctx[0].__tag2);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(td, null);
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
    			if (detaching) detach_dev(td);
    			destroy_each(each_blocks, detaching);
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

    function instance$9($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));

    	function oneSite(ns) {
    		const { toRegex } = window.mitm.fn;

    		if ($tags.filterUrl) {
    			const rgx = toRegex(ns.replace(/~/, "[^.]*"));
    			return mitm.browser.activeUrl.match(rgx) || ns === "_global_";
    		} else {
    			return true;
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [$tags, oneSite];
    }

    class Tags2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\tags\Tags3_3.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$a = "src\\components\\tags\\Tags3_3.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (18:0) {#each Object.keys(items).sort() as item}
    function create_each_block$4(ctx) {
    	let div;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let t1_value = /*item*/ ctx[4] + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[3].call(input, /*item*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[4]);
    			add_location(input, file$a, 20, 6, 394);
    			add_location(label, file$a, 19, 4, 379);
    			attr_dev(div, "class", div_class_value = "space3 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-1rcf4mz");
    			add_location(div, file$a, 18, 2, 336);

    			dispose = [
    				listen_dev(input, "click", /*clicked*/ ctx[1], false, false, false),
    				listen_dev(input, "change", input_change_handler)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*items*/ ctx[0][/*item*/ ctx[4]];
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(div, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*items*/ 1 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[4])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*items, Object*/ 1) {
    				input.checked = /*items*/ ctx[0][/*item*/ ctx[4]];
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = /*item*/ ctx[4] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 1 && div_class_value !== (div_class_value = "space3 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-1rcf4mz")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(18:0) {#each Object.keys(items).sort() as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let each_1_anchor;
    	let each_value = Object.keys(/*items*/ ctx[0]).sort();
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*routetag, Object, items, clicked*/ 7) {
    				each_value = Object.keys(/*items*/ ctx[0]).sort();
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
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

    function instance$a($$self, $$props, $$invalidate) {
    	let { items } = $$props;

    	function clicked(e) {
    		setTimeout(
    			() => {
    				const { item } = e.target.dataset;
    				console.log("e", items[item]);
    			},
    			50
    		);
    	}

    	function routetag(item) {
    		return items[item] ? "rtag slc" : "rtag";
    	}

    	const writable_props = ["items"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Tags3_3> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		items[item] = this.checked;
    		$$invalidate(0, items);
    	}

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    	};

    	$$self.$capture_state = () => {
    		return { items };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    	};

    	return [items, clicked, routetag, input_change_handler];
    }

    class Tags3_3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { items: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_3",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console_1$1.warn("<Tags3_3> was created without expected prop 'items'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags3_3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags3_3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags3_2.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1$2 } = globals;
    const file$b = "src\\components\\tags\\Tags3_2.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (10:0) {#each Object.keys(items).filter(x=>x[0]!==':') as item}
    function create_each_block$5(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[2] + "";
    	let t0;
    	let t1;
    	let t2_value = /*items*/ ctx[0][`:${/*item*/ ctx[2]}`] + "";
    	let t2;
    	let t3;
    	let current;

    	const tags33 = new Tags3_3({
    			props: { items: /*items*/ ctx[0][/*item*/ ctx[2]] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(tags33.$$.fragment);
    			attr_dev(div, "class", "space2 svelte-ijo5dd");
    			add_location(div, file$b, 10, 2, 200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			insert_dev(target, t3, anchor);
    			mount_component(tags33, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*items*/ 1) && t0_value !== (t0_value = /*item*/ ctx[2] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*items*/ 1) && t2_value !== (t2_value = /*items*/ ctx[0][`:${/*item*/ ctx[2]}`] + "")) set_data_dev(t2, t2_value);
    			const tags33_changes = {};
    			if (dirty & /*items*/ 1) tags33_changes.items = /*items*/ ctx[0][/*item*/ ctx[2]];
    			tags33.$set(tags33_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tags33.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tags33.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			destroy_component(tags33, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(10:0) {#each Object.keys(items).filter(x=>x[0]!==':') as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*items*/ ctx[0]).filter(func);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items, Object*/ 1) {
    				each_value = Object.keys(/*items*/ ctx[0]).filter(func);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = x => x[0] !== ":";

    function instance$b($$self, $$props, $$invalidate) {
    	let { items } = $$props;
    	let { key } = $$props;
    	const writable_props = ["items", "key"];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_2> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    	};

    	$$self.$capture_state = () => {
    		return { items, key };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    	};

    	return [items, key];
    }

    class Tags3_2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { items: 0, key: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_2",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Tags3_2> was created without expected prop 'items'");
    		}

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console.warn("<Tags3_2> was created without expected prop 'key'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags3_2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags3_2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Tags3_2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Tags3_2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags3_1.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1$3 } = globals;
    const file$c = "src\\components\\tags\\Tags3_1.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (11:2) {#each Object.keys(items) as item}
    function create_each_block$6(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[2] + "";
    	let t0;
    	let t1;
    	let current;

    	const tags32 = new Tags3_2({
    			props: {
    				items: /*items*/ ctx[0][/*item*/ ctx[2]],
    				key: /*item*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(tags32.$$.fragment);
    			attr_dev(div, "class", "space1 svelte-p3ivgw");
    			add_location(div, file$c, 11, 4, 266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(tags32, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*items*/ 1) && t0_value !== (t0_value = /*item*/ ctx[2] + "")) set_data_dev(t0, t0_value);
    			const tags32_changes = {};
    			if (dirty & /*items*/ 1) tags32_changes.items = /*items*/ ctx[0][/*item*/ ctx[2]];
    			if (dirty & /*items*/ 1) tags32_changes.key = /*item*/ ctx[2];
    			tags32.$set(tags32_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tags32.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tags32.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_component(tags32, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(11:2) {#each Object.keys(items) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = (/*key*/ ctx[1] === "_global_" ? " * " : /*key*/ ctx[1]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let current;
    	let each_value = Object.keys(/*items*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("[");
    			t1 = text(t1_value);
    			t2 = text("]");
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "space0 svelte-p3ivgw");
    			add_location(div0, file$c, 9, 2, 162);
    			attr_dev(div1, "class", "border svelte-p3ivgw");
    			add_location(div1, file$c, 8, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*key*/ 2) && t1_value !== (t1_value = (/*key*/ ctx[1] === "_global_" ? " * " : /*key*/ ctx[1]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items, Object*/ 1) {
    				each_value = Object.keys(/*items*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
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
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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

    function instance$c($$self, $$props, $$invalidate) {
    	let { items } = $$props;
    	let { key } = $$props;
    	const writable_props = ["items", "key"];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_1> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    	};

    	$$self.$capture_state = () => {
    		return { items, key };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    	};

    	return [items, key];
    }

    class Tags3_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { items: 0, key: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_1",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Tags3_1> was created without expected prop 'items'");
    		}

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console.warn("<Tags3_1> was created without expected prop 'key'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags3_1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags3_1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Tags3_1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Tags3_1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags3_.svelte generated by Svelte v3.16.7 */
    const file$d = "src\\components\\tags\\Tags3_.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (20:2) {#if istag(item)}
    function create_if_block$2(ctx) {
    	let current;

    	const tags31 = new Tags3_1({
    			props: {
    				items: /*$tags*/ ctx[0].__tag3[/*item*/ ctx[2]],
    				key: /*item*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tags31.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tags31, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tags31_changes = {};
    			if (dirty & /*$tags*/ 1) tags31_changes.items = /*$tags*/ ctx[0].__tag3[/*item*/ ctx[2]];
    			if (dirty & /*$tags*/ 1) tags31_changes.key = /*item*/ ctx[2];
    			tags31.$set(tags31_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tags31.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tags31.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tags31, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(20:2) {#if istag(item)}",
    		ctx
    	});

    	return block;
    }

    // (19:0) {#each Object.keys($tags.__tag3) as item}
    function create_each_block$7(ctx) {
    	let show_if = /*istag*/ ctx[1](/*item*/ ctx[2]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$tags*/ 1) show_if = /*istag*/ ctx[1](/*item*/ ctx[2]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(19:0) {#each Object.keys($tags.__tag3) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let td;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[0].__tag3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			td = element("td");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(td, file$d, 17, 0, 443);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(td, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*istag, Object, $tags*/ 3) {
    				each_value = Object.keys(/*$tags*/ ctx[0].__tag3);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(td, null);
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
    			if (detaching) detach_dev(td);
    			destroy_each(each_blocks, detaching);
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

    function instance$d($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));

    	function istag(ns) {
    		const { toRegex } = window.mitm.fn;
    		const arr = Object.keys($tags.__tag2[ns]);
    		const ok = arr.filter(x => !x.match(":")).length;

    		if ($tags.filterUrl) {
    			const rgx = toRegex(ns.replace(/~/, "[^.]*"));
    			return ok && mitm.browser.activeUrl.match(rgx) || ns === "_global_";
    		} else {
    			return ok;
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [$tags, istag];
    }

    class Tags3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\components\tags\Table.svelte generated by Svelte v3.16.7 */
    const file$e = "src\\components\\tags\\Table.svelte";

    // (34:4) <BHeader>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("-Tags-");
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(34:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (35:4) <BTable>
    function create_default_slot_1(ctx) {
    	let tr;
    	let t0;
    	let t1;
    	let current;
    	const tags1 = new Tags1({ $$inline: true });
    	const tags2 = new Tags2({ $$inline: true });
    	const tags3 = new Tags3({ $$inline: true });

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			create_component(tags1.$$.fragment);
    			t0 = space();
    			create_component(tags2.$$.fragment);
    			t1 = space();
    			create_component(tags3.$$.fragment);
    			attr_dev(tr, "class", "set-tags");
    			add_location(tr, file$e, 35, 6, 795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			mount_component(tags1, tr, null);
    			append_dev(tr, t0);
    			mount_component(tags2, tr, null);
    			append_dev(tr, t1);
    			mount_component(tags3, tr, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tags1.$$.fragment, local);
    			transition_in(tags2.$$.fragment, local);
    			transition_in(tags3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tags1.$$.fragment, local);
    			transition_out(tags2.$$.fragment, local);
    			transition_out(tags3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(tags1);
    			destroy_component(tags2);
    			destroy_component(tags3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(35:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (33:2) <BStatic>
    function create_default_slot(ctx) {
    	let t;
    	let current;

    	const bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
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

    			if (dirty & /*$$scope*/ 2) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			const btable_changes = {};

    			if (dirty & /*$$scope*/ 2) {
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(33:2) <BStatic>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let t;
    	let div;
    	let current;
    	const button = new Button({ $$inline: true });

    	const bstatic = new BStatic({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(bstatic.$$.fragment);
    			attr_dev(div, "class", "vbox svelte-isss4r");
    			add_location(div, file$e, 31, 0, 715);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(bstatic, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const bstatic_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(bstatic.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(bstatic.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(bstatic);
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

    function instance$e($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));

    	onMount(async () => {
    		
    	});

    	window.mitm.files.getRoute_events.tagsTable = () => {
    		console.log("tagsTable getting called!!!");
    		const { __tag1, __tag2, __tag3 } = window.mitm;
    		const { filterUrl } = $tags;
    		tags.set({ filterUrl, __tag1, __tag2, __tag3 });
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    const logstore = writable({
      respHeader: {},
      response: '',
      headers: '',
      logid: '',
      title: '',
      path: '',
      url: '',
      ext: '',
    });

    const client = writable({
      ...window.mitm.client,
    });

    /* src\components\box\Splitter.svelte generated by Svelte v3.16.7 */
    const file$f = "src\\components\\box\\Splitter.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let div_style_value;
    	let draggable_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resize svelte-1507c6x");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$f, 76, 0, 1831);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { height: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Splitter",
    			options,
    			id: create_fragment$f.name
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
    const file$g = "src\\components\\box\\BResize.svelte";

    function create_fragment$g(ctx) {
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
    			attr_dev(div, "class", "vbox right svelte-g1qpjx");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$g, 26, 0, 471);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { left: 4, height: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BResize",
    			options,
    			id: create_fragment$g.name
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

    /* src\components\logs\Button.svelte generated by Svelte v3.16.7 */
    const file$h = "src\\components\\logs\\Button.svelte";

    function create_fragment$h(ctx) {
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
    			add_location(path, file$h, 15, 89, 476);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$h, 15, 0, 387);
    			attr_dev(button, "class", "svelte-10s12le");
    			add_location(button, file$h, 14, 0, 356);
    			attr_dev(div, "class", "btn-container svelte-10s12le");
    			add_location(div, file$h, 13, 0, 328);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnClear(e) {
    	ws__send("clearLogs", { browserName: "chromium" }, data => {
    		window.mitm.client.clear = true;
    		console.log("Done Clear!");
    	});
    }

    class Button$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\logs\Item.svelte generated by Svelte v3.16.7 */
    const file$i = "src\\components\\logs\\Item.svelte";

    function create_fragment$i(ctx) {
    	let tr;
    	let td;
    	let div;
    	let span0;
    	let t0_value = /*item*/ ctx[0].general.status + "";
    	let t0;
    	let span0_class_value;
    	let t1;
    	let span1;
    	let t2_value = method2(/*item*/ ctx[0]) + "";
    	let t2;
    	let span1_class_value;
    	let t3;
    	let span2;
    	let t4_value = /*url*/ ctx[3](/*item*/ ctx[0]) + "";
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = pth(/*item*/ ctx[0]) + "";
    	let t6;
    	let div_class_value;
    	let div_data_logid_value;
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
    			attr_dev(span0, "class", span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-nfc8ao");
    			add_location(span0, file$i, 90, 6, 1900);
    			attr_dev(span1, "class", span1_class_value = "method " + method(/*item*/ ctx[0]) + " svelte-nfc8ao");
    			add_location(span1, file$i, 91, 6, 1972);
    			attr_dev(span2, "class", "url");
    			add_location(span2, file$i, 92, 6, 2038);
    			attr_dev(span3, "class", "prm svelte-nfc8ao");
    			add_location(span3, file$i, 93, 6, 2082);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-nfc8ao");
    			attr_dev(div, "data-logid", div_data_logid_value = /*item*/ ctx[0].logid);
    			add_location(div, file$i, 86, 4, 1778);
    			attr_dev(td, "class", td_class_value = "" + (null_to_empty(/*item*/ ctx[0].logid ? "selected" : "") + " svelte-nfc8ao"));
    			add_location(td, file$i, 85, 2, 1730);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$i, 84, 0, 1712);
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

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-nfc8ao")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = method2(/*item*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "method " + method(/*item*/ ctx[0]) + " svelte-nfc8ao")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*url*/ ctx[3](/*item*/ ctx[0]) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = pth(/*item*/ ctx[0]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$logstore, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-nfc8ao")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_logid_value !== (div_data_logid_value = /*item*/ ctx[0].logid)) {
    				attr_dev(div, "data-logid", div_data_logid_value);
    			}

    			if (dirty & /*item*/ 1 && td_class_value !== (td_class_value = "" + (null_to_empty(/*item*/ ctx[0].logid ? "selected" : "") + " svelte-nfc8ao"))) {
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function empty$1() {
    	logstore.set({
    		respHeader: {},
    		response: "",
    		headers: "",
    		logid: "",
    		title: "",
    		path: "",
    		url: "",
    		ext: ""
    	});
    }

    function status({ general: g }) {
    	return `_${Math.trunc(g.status / 100)}`;
    }

    function method({ general: g }) {
    	return `${g.method.toLowerCase()}`;
    }

    function method2({ general: g }) {
    	return g.method + (g.ext ? ` <${g.ext.toUpperCase()}> ` : "");
    }

    function pth({ general: g }) {
    	if (g.url.match("/log/")) {
    		return "";
    	} else {
    		const parms = g.url.split("?")[1];
    		return parms ? `?${parms}` : "";
    	}
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $client;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(1, $logstore = $$value));
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(4, $client = $$value));
    	let { item } = $$props;

    	function clickHandler(e) {
    		let { logid } = e.currentTarget.dataset;

    		if (logid === $logstore.logid) {
    			empty$1();
    		} else {
    			empty$1();
    			const o = window.mitm.files.log[logid];

    			const src = {
    				respHeader: o.respHeader,
    				response: "<empty>",
    				headers: "<empty>",
    				logid,
    				title: o.title,
    				path: o.path,
    				url: logid.replace(/^.+\.mitm-play/, "https://localhost:3001"),
    				ext: o.ext
    			};

    			if (o.title.match(".png")) {
    				setTimeout(
    					() => {
    						logstore.update(n => src);
    					},
    					0
    				);
    			} else {
    				ws__send("getContent", { fpath: logid }, ({ headers, response, ext }) => {
    					logstore.update(n => {
    						return { ...src, response, headers, ext };
    					});
    				});
    			}
    		}
    	}

    	function url({ general: g }) {
    		if (g.url.match("/log/")) {
    			return g.url.split("@")[1];
    		} else if ($client.nohostlogs) {
    			return g.path;
    		} else {
    			return `${g.url.split("?")[0]}`;
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
    		return { item, $logstore, $client };
    	};

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("$logstore" in $$props) logstore.set($logstore = $$props.$logstore);
    		if ("$client" in $$props) client.set($client = $$props.$client);
    	};

    	return [item, $logstore, clickHandler, url];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$i, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$i.name
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

    const tabstore = writable({
      editor: {},
      tab: 0,
    });

    /* src\components\logs\Button2.svelte generated by Svelte v3.16.7 */
    const file$j = "src\\components\\logs\\Button2.svelte";

    function create_fragment$j(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "[--]";
    			t1 = text(" -\n  ");
    			button1 = element("button");
    			button1.textContent = "[++]";
    			t3 = text(".");
    			attr_dev(button0, "class", "tlb btn-min svelte-1mu3roi");
    			add_location(button0, file$j, 17, 2, 364);
    			attr_dev(button1, "class", "tlb btn-plus svelte-1mu3roi");
    			add_location(button1, file$j, 18, 2, 432);
    			attr_dev(div, "class", "btn-container svelte-1mu3roi");
    			add_location(div, file$j, 16, 0, 334);

    			dispose = [
    				listen_dev(button0, "click", /*btnMin*/ ctx[0], false, false, false),
    				listen_dev(button1, "click", /*btnPlus*/ ctx[1], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(2, $tabstore = $$value));

    	function btnMin() {
    		const { tab, editor } = $tabstore;
    		const id = `editor${tab + 1}`;
    		editor[id].trigger("fold", "editor.foldAll");
    	}

    	function btnPlus() {
    		const { tab, editor } = $tabstore;
    		const id = `editor${tab + 1}`;
    		editor[id].trigger("fold", "editor.unfoldAll");
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [btnMin, btnPlus];
    }

    class Button2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button2",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\components\logs\BaseTab.svelte generated by Svelte v3.16.7 */
    const file$k = "src\\components\\logs\\BaseTab.svelte";

    // (83:0) <Tab label="Headers">
    function create_default_slot_2$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco1");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 84, 4, 1922);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 83, 2, 1889);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(83:0) <Tab label=\\\"Headers\\\">",
    		ctx
    	});

    	return block;
    }

    // (89:0) <Tab label="Response">
    function create_default_slot_1$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco2");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 90, 4, 2026);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 89, 2, 1993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(89:0) <Tab label=\\\"Response\\\">",
    		ctx
    	});

    	return block;
    }

    // (95:0) {#if isCSP()}
    function create_if_block$3(ctx) {
    	let current;

    	const tab = new Tab({
    			props: {
    				label: "CSP",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(95:0) {#if isCSP()}",
    		ctx
    	});

    	return block;
    }

    // (96:2) <Tab label="CSP">
    function create_default_slot$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco3");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 97, 6, 2145);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 96, 4, 2110);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(96:2) <Tab label=\\\"CSP\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let t0;
    	let t1;
    	let show_if = /*isCSP*/ ctx[0]();
    	let if_block_anchor;
    	let current;

    	const tab0 = new Tab({
    			props: {
    				label: "Headers",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab1 = new Tab({
    			props: {
    				label: "Response",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = show_if && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t0 = space();
    			create_component(tab1.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tab0_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(tab1, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $tabstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(7, $logstore = $$value));
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(8, $tabstore = $$value));
    	const minimap = { enabled: false };

    	const option = {
    		contextmenu: false,
    		readOnly: true,
    		minimap
    	};

    	let element1;
    	let element2;
    	let element3;
    	let editor1;
    	let editor2;
    	let editor3;

    	onMount(async () => {
    		console.log($logstore);
    		element1 = window.document.getElementById("monaco1");

    		editor1 = window.monaco.editor.create(element1, {
    			value: $logstore.headers,
    			language: "json",
    			...option
    		});

    		var ro1 = new ResizeObserver(entries => {
    				const { width, height } = entries[0].contentRect;
    				editor1.layout({ width, height });
    			});

    		ro1.observe(element1);
    		element2 = window.document.getElementById("monaco2");

    		editor2 = window.monaco.editor.create(element2, {
    			value: $logstore.response,
    			language: $logstore.ext,
    			...option
    		});

    		var ro2 = new ResizeObserver(entries => {
    				const { width, height } = entries[0].contentRect;
    				editor2.layout({ width, height });
    			});

    		ro2.observe(element2);
    		const obj = JSON.parse($logstore.headers);

    		if (obj.CSP) {
    			element3 = window.document.getElementById("monaco3");

    			editor3 = window.monaco.editor.create(element3, {
    				value: JSON.stringify(obj.CSP, null, 2),
    				language: "json",
    				...option
    			});

    			var ro3 = new ResizeObserver(entries => {
    					const { width, height } = entries[0].contentRect;
    					editor3.layout({ width, height });
    				});

    			ro3.observe(element3);
    		}

    		const editor = { editor1, editor2, editor3 };
    		tabstore.set({ ...$tabstore, editor });
    	});

    	function isCSP() {
    		const h = $logstore.respHeader;
    		const csp = h["content-security-policy"] || h["content-security-policy-report-only"];
    		return csp;
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("element1" in $$props) element1 = $$props.element1;
    		if ("element2" in $$props) element2 = $$props.element2;
    		if ("element3" in $$props) element3 = $$props.element3;
    		if ("editor1" in $$props) editor1 = $$props.editor1;
    		if ("editor2" in $$props) editor2 = $$props.editor2;
    		if ("editor3" in $$props) editor3 = $$props.editor3;
    		if ("$logstore" in $$props) logstore.set($logstore = $$props.$logstore);
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [isCSP];
    }

    class BaseTab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BaseTab",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\components\logs\Json.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-json" size="is-small">
    function create_default_slot$2(ctx) {
    	let current;
    	const basetab = new BaseTab({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(basetab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(basetab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(basetab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(basetab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(basetab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-json\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let t;
    	let current;
    	const button2 = new Button2({ $$inline: true });

    	const tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-json",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button2.$$.fragment);
    			t = space();
    			create_component(tabs.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button2, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};
    			if (dirty & /*$tabstore*/ 1) tabs_changes.value = /*$tabstore*/ ctx[0].tab;

    			if (dirty & /*$$scope*/ 2) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button2.$$.fragment, local);
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button2.$$.fragment, local);
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button2, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));

    	onMount(() => {
    		setTimeout(
    			() => {
    				const nodes = document.querySelectorAll(".tab-json a");

    				for (let [i, node] of nodes.entries()) {
    					node.onclick = function (e) {
    						tabstore.set({ ...$tabstore, tab: i });
    					};
    				}
    			},
    			500
    		);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [$tabstore];
    }

    class Json extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Json",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\components\logs\Html.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-html" size="is-small">
    function create_default_slot$3(ctx) {
    	let current;
    	const basetab = new BaseTab({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(basetab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(basetab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(basetab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(basetab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(basetab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-html\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let t;
    	let current;
    	const button2 = new Button2({ $$inline: true });

    	const tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-html",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button2.$$.fragment);
    			t = space();
    			create_component(tabs.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button2, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};
    			if (dirty & /*$tabstore*/ 1) tabs_changes.value = /*$tabstore*/ ctx[0].tab;

    			if (dirty & /*$$scope*/ 2) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button2.$$.fragment, local);
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button2.$$.fragment, local);
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button2, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));

    	onMount(() => {
    		setTimeout(
    			() => {
    				const nodes = document.querySelectorAll(".tab-html a");

    				for (let [i, node] of nodes.entries()) {
    					node.onclick = function (e) {
    						tabstore.set({ ...$tabstore, tab: i });
    					};
    				}
    			},
    			500
    		);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [$tabstore];
    }

    class Html extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Html",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\components\logs\Css.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-css" size="is-small">
    function create_default_slot$4(ctx) {
    	let current;
    	const basetab = new BaseTab({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(basetab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(basetab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(basetab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(basetab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(basetab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-css\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let t;
    	let current;
    	const button2 = new Button2({ $$inline: true });

    	const tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-css",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button2.$$.fragment);
    			t = space();
    			create_component(tabs.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button2, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};
    			if (dirty & /*$tabstore*/ 1) tabs_changes.value = /*$tabstore*/ ctx[0].tab;

    			if (dirty & /*$$scope*/ 2) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button2.$$.fragment, local);
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button2.$$.fragment, local);
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button2, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));

    	onMount(() => {
    		setTimeout(
    			() => {
    				const nodes = document.querySelectorAll(".tab-css a");

    				for (let [i, node] of nodes.entries()) {
    					node.onclick = function (e) {
    						tabstore.set({ ...$tabstore, tab: i });
    					};
    				}
    			},
    			500
    		);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [$tabstore];
    }

    class Css extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Css",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\components\logs\Js.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-js" size="is-small">
    function create_default_slot$5(ctx) {
    	let current;
    	const basetab = new BaseTab({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(basetab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(basetab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(basetab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(basetab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(basetab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-js\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let t;
    	let current;
    	const button2 = new Button2({ $$inline: true });

    	const tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-js",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button2.$$.fragment);
    			t = space();
    			create_component(tabs.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button2, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};
    			if (dirty & /*$tabstore*/ 1) tabs_changes.value = /*$tabstore*/ ctx[0].tab;

    			if (dirty & /*$$scope*/ 2) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button2.$$.fragment, local);
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button2.$$.fragment, local);
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button2, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));

    	onMount(() => {
    		setTimeout(
    			() => {
    				const nodes = document.querySelectorAll(".tab-js a");

    				for (let [i, node] of nodes.entries()) {
    					node.onclick = function (e) {
    						tabstore.set({ ...$tabstore, tab: i });
    					};
    				}
    			},
    			500
    		);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [$tabstore];
    }

    class Js extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Js",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\components\logs\Show.svelte generated by Svelte v3.16.7 */
    const file$l = "src\\components\\logs\\Show.svelte";

    // (20:2) {:else}
    function create_else_block(ctx) {
    	let pre;
    	let t_value = /*$logstore*/ ctx[0].response + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(t_value);
    			attr_dev(pre, "class", "svelte-1bhfci6");
    			add_location(pre, file$l, 20, 4, 529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$logstore*/ 1 && t_value !== (t_value = /*$logstore*/ ctx[0].response + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:41) 
    function create_if_block_4(ctx) {
    	let current;
    	const js = new Js({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(js.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(js, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(js.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(js.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(js, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(18:41) ",
    		ctx
    	});

    	return block;
    }

    // (16:42) 
    function create_if_block_3(ctx) {
    	let current;
    	const css = new Css({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(css.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(css, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(css.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(css.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(css, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(16:42) ",
    		ctx
    	});

    	return block;
    }

    // (14:43) 
    function create_if_block_2(ctx) {
    	let current;
    	const html = new Html({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(html.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(html, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(html.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(html.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(html, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(14:43) ",
    		ctx
    	});

    	return block;
    }

    // (12:43) 
    function create_if_block_1(ctx) {
    	let current;
    	const json = new Json({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(json.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(json, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(json.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(json.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(json, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(12:43) ",
    		ctx
    	});

    	return block;
    }

    // (10:2) {#if $logstore.title.match('.png')}
    function create_if_block$4(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*$logstore*/ ctx[0].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image");
    			add_location(img, file$l, 10, 4, 256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$logstore*/ 1 && img.src !== (img_src_value = /*$logstore*/ ctx[0].url)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(10:2) {#if $logstore.title.match('.png')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let div;
    	let show_if;
    	let show_if_1;
    	let show_if_2;
    	let show_if_3;
    	let show_if_4;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	const if_block_creators = [
    		create_if_block$4,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*$logstore*/ 1) show_if = !!/*$logstore*/ ctx[0].title.match(".png");
    		if (show_if) return 0;
    		if (dirty & /*$logstore*/ 1) show_if_1 = !!/*$logstore*/ ctx[0].title.match(".json");
    		if (show_if_1) return 1;
    		if (dirty & /*$logstore*/ 1) show_if_2 = !!/*$logstore*/ ctx[0].title.match(".html");
    		if (show_if_2) return 2;
    		if (dirty & /*$logstore*/ 1) show_if_3 = !!/*$logstore*/ ctx[0].title.match(".css");
    		if (show_if_3) return 3;
    		if (dirty & /*$logstore*/ 1) show_if_4 = !!/*$logstore*/ ctx[0].title.match(".js");
    		if (show_if_4) return 4;
    		return 5;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "item-show svelte-1bhfci6");
    			add_location(div, file$l, 8, 0, 190);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let $logstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(0, $logstore = $$value));

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$logstore" in $$props) logstore.set($logstore = $$props.$logstore);
    	};

    	return [$logstore];
    }

    class Show extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Show",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\components\logs\Table.svelte generated by Svelte v3.16.7 */
    const file$m = "src\\components\\logs\\Table.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (73:4) <BHeader>
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
    		source: "(73:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (76:6) {#each Object.keys(_data) as logid}
    function create_each_block$8(ctx) {
    	let current;

    	const item = new Item({
    			props: {
    				item: {
    					logid: /*logid*/ ctx[8],
    					.../*_data*/ ctx[1][/*logid*/ ctx[8]],
    					nohostlogs: /*$client*/ ctx[2].nohostlogs
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

    			if (dirty & /*_data, $client*/ 6) item_changes.item = {
    				logid: /*logid*/ ctx[8],
    				.../*_data*/ ctx[1][/*logid*/ ctx[8]],
    				nohostlogs: /*$client*/ ctx[2].nohostlogs
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
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(76:6) {#each Object.keys(_data) as logid}",
    		ctx
    	});

    	return block;
    }

    // (75:4) <BTable update={nohostlogs($client.nohostlogs)}>
    function create_default_slot_2$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
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
    			if (dirty & /*Object, _data, $client*/ 6) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
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
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(75:4) <BTable update={nohostlogs($client.nohostlogs)}>",
    		ctx
    	});

    	return block;
    }

    // (72:2) <BStatic>
    function create_default_slot_1$2(ctx) {
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

    	const button = new Button$1({ $$inline: true });

    	const btable = new BTable({
    			props: {
    				update: nohostlogs(/*$client*/ ctx[2].nohostlogs),
    				$$slots: { default: [create_default_slot_2$2] },
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

    			if (dirty & /*$$scope*/ 2048) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			const btable_changes = {};
    			if (dirty & /*$client*/ 4) btable_changes.update = nohostlogs(/*$client*/ ctx[2].nohostlogs);

    			if (dirty & /*$$scope, _data, $client*/ 2054) {
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
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(72:2) <BStatic>",
    		ctx
    	});

    	return block;
    }

    // (85:2) {#if $logstore.logid}
    function create_if_block$5(ctx) {
    	let current;

    	const bresize = new BResize({
    			props: {
    				left: /*_json*/ ctx[0],
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	bresize.$on("dragend", /*dragend*/ ctx[4]);

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

    			if (dirty & /*$$scope*/ 2048) {
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(85:2) {#if $logstore.logid}",
    		ctx
    	});

    	return block;
    }

    // (86:4) <BResize left={_json} on:dragend={dragend}>
    function create_default_slot$6(ctx) {
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
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(86:4) <BResize left={_json} on:dragend={dragend}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let div;
    	let t;
    	let current;

    	const bstatic = new BStatic({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*$logstore*/ ctx[3].logid && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(bstatic.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "vbox svelte-isss4r");
    			add_location(div, file$m, 70, 0, 1538);
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

    			if (dirty & /*$$scope, $client, _data*/ 2054) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);

    			if (/*$logstore*/ ctx[3].logid) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$5(ctx);
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
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function nohostlogs(flag) {
    	console.log("nohostlogs", flag);
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let $client;
    	let $logstore;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(2, $client = $$value));
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(3, $logstore = $$value));
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
    			data.json && $$invalidate(5, json = data.json);
    		});
    	});

    	const logHandler = obj => {
    		console.log("ws__send(getLog)", obj);

    		if (window.mitm.client.clear) {
    			delete window.mitm.client.clear;

    			logstore.set({
    				respHeader: {},
    				response: "",
    				headers: "",
    				logid: "",
    				title: "",
    				path: "",
    				url: "",
    				ext: ""
    			});
    		}

    		if (window.mitm.files.log === undefined) {
    			window.mitm.files.log = obj;
    			$$invalidate(6, data = obj);
    		} else {
    			const { log } = window.mitm.files;
    			const newLog = {};

    			for (let k in obj) {
    				newLog[k] = log[k] ? log[k] : obj[k];
    			}

    			window.mitm.files.log = newLog;
    			$$invalidate(6, data = newLog);
    		}
    	};

    	window.mitm.files.log_events.LogsTable = () => {
    		ws__send("getLog", "", logHandler);
    	};

    	function dragend({ detail }) {
    		$$invalidate(5, json = detail.left);
    		chrome.storage.local.set({ json });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("json" in $$props) $$invalidate(5, json = $$props.json);
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("_json" in $$props) $$invalidate(0, _json = $$props._json);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    		if ("$client" in $$props) client.set($client = $$props.$client);
    		if ("$logstore" in $$props) logstore.set($logstore = $$props.$logstore);
    	};

    	let _json;
    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*json*/ 32) {
    			 $$invalidate(0, _json = json);
    		}

    		if ($$self.$$.dirty & /*data*/ 64) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [_json, _data, $client, $logstore, dragend];
    }

    class Table$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    const source = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content:'',
      path:'',
    });

    /* src\components\route\Button.svelte generated by Svelte v3.16.7 */
    const file$n = "src\\components\\route\\Button.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (60:0) {#if $source.path}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t0;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let t2;
    	let dispose;
    	let each_value = btns(/*$source*/ ctx[0].item);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button = element("button");
    			t1 = text("Go");
    			t2 = text(".");
    			attr_dev(button, "class", "tlb btn-go svelte-11e4kdx");
    			button.disabled = button_disabled_value = /*$source*/ ctx[0].goDisabled;
    			add_location(button, file$n, 65, 2, 1318);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$n, 60, 1, 1145);
    			dispose = listen_dev(button, "click", /*btnGo*/ ctx[4], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, button);
    			append_dev(button, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*btnUrl, btns, $source, btnTag*/ 9) {
    				each_value = btns(/*$source*/ ctx[0].item);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*$source*/ 1 && button_disabled_value !== (button_disabled_value = /*$source*/ ctx[0].goDisabled)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(60:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#each btns($source.item) as item}
    function create_each_block$9(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[5] + "";
    	let t0;
    	let button_data_url_value;
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" -");
    			attr_dev(button, "class", "tlb btn-go svelte-11e4kdx");
    			attr_dev(button, "data-url", button_data_url_value = /*btnUrl*/ ctx[3](/*item*/ ctx[5]));
    			add_location(button, file$n, 62, 2, 1212);
    			dispose = listen_dev(button, "click", btnTag, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$source*/ 1 && t0_value !== (t0_value = /*item*/ ctx[5] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$source*/ 1 && button_data_url_value !== (button_data_url_value = /*btnUrl*/ ctx[3](/*item*/ ctx[5]))) {
    				attr_dev(button, "data-url", button_data_url_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(62:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (71:0) {#if $source.path}
    function create_if_block$6(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t4;
    	let button2_disabled_value;
    	let t5;
    	let button3;
    	let t6;
    	let button3_disabled_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "[--]";
    			t1 = text(" -\n  ");
    			button1 = element("button");
    			button1.textContent = "[++]";
    			t3 = text(" -\n  ");
    			button2 = element("button");
    			t4 = text("Save");
    			t5 = text(" -\n  ");
    			button3 = element("button");
    			t6 = text("Open");
    			attr_dev(button0, "class", "tlb btn-min svelte-11e4kdx");
    			add_location(button0, file$n, 72, 2, 1516);
    			attr_dev(button1, "class", "tlb btn-plus svelte-11e4kdx");
    			add_location(button1, file$n, 73, 2, 1584);
    			attr_dev(button2, "class", "tlb btn-save svelte-11e4kdx");
    			button2.disabled = button2_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button2, file$n, 74, 2, 1652);
    			attr_dev(button3, "class", "tlb btn-open svelte-11e4kdx");
    			button3.disabled = button3_disabled_value = /*$source*/ ctx[0].openDisabled;
    			add_location(button3, file$n, 75, 2, 1752);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$n, 71, 1, 1486);

    			dispose = [
    				listen_dev(button0, "click", btnMin, false, false, false),
    				listen_dev(button1, "click", btnPlus, false, false, false),
    				listen_dev(button2, "click", /*btnSave*/ ctx[1], false, false, false),
    				listen_dev(button3, "click", /*btnOpen*/ ctx[2], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(button2, t4);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(button3, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$source*/ 1 && button2_disabled_value !== (button2_disabled_value = /*$source*/ ctx[0].saveDisabled)) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			if (dirty & /*$source*/ 1 && button3_disabled_value !== (button3_disabled_value = /*$source*/ ctx[0].openDisabled)) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(71:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$1(ctx);
    	let if_block1 = /*$source*/ ctx[0].path && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div = element("div");
    			t1 = text("Path:");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "file-path svelte-11e4kdx");
    			add_location(div, file$n, 68, 0, 1422);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$source*/ ctx[0].path) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*$source*/ 1 && t2_value !== (t2_value = /*$source*/ ctx[0].path + "")) set_data_dev(t2, t2_value);

    			if (/*$source*/ ctx[0].path) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnMin() {
    	window.monacoEditor.trigger("fold", "editor.foldAll");
    }

    function btnPlus() {
    	window.monacoEditor.trigger("unfold", "editor.unfoldAll");
    }

    function btns(id) {
    	const route = mitm.routes[id];

    	if (route && route.urls) {
    		return Object.keys(route.urls);
    	} else {
    		return [];
    	}
    }

    function btnTag(e) {
    	chrome.tabs.update({ url: e.target.dataset.url });
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(0, $source = $$value));

    	function btnSave(e) {
    		source.update(n => {
    			return {
    				...n,
    				content: window.monacoEditor.getValue()
    			};
    		});

    		console.log($source);

    		ws__send("saveRoute", $source, data => {
    			source.update(n => {
    				return { ...n, saveDisabled: true };
    			});

    			console.log("Done Save!");
    		});
    	}

    	function btnOpen() {
    		ws__send("openRoute", $source, data => {
    			console.log("Done Open!");
    		});
    	}

    	function btnUrl(id) {
    		const route = mitm.routes[$source.item];

    		if (route && route.urls) {
    			return route.urls[id];
    		} else {
    			return "";
    		}
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
    		if ("$source" in $$props) source.set($source = $$props.$source);
    	};

    	return [$source, btnSave, btnOpen, btnUrl, btnGo];
    }

    class Button$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src\components\route\Item.svelte generated by Svelte v3.16.7 */

    const { console: console_1$2 } = globals;
    const file$o = "src\\components\\route\\Item.svelte";

    function create_fragment$s(ctx) {
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
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-1arv0rl");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$o, 33, 4, 617);
    			attr_dev(td, "class", "svelte-1arv0rl");
    			add_location(td, file$o, 32, 2, 608);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$o, 31, 0, 590);
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

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-1arv0rl")) {
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let { item } = $$props;
    	let { onChange } = $$props;

    	onMount(async () => {
    		
    	});

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const url = mitm.routes[item].url;
    		const obj = window.mitm.files.route[item];
    		console.log(item, obj);
    		window.monacoEditor.setValue(obj.content);
    		window.monacoEditor.revealLine(1);
    		onChange(false);

    		source.update(n => {
    			return {
    				...n,
    				goDisabled: url === undefined,
    				content: obj.content,
    				path: obj.path,
    				item
    			};
    		});
    	}

    	const writable_props = ["item", "onChange"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => {
    		return { item, onChange, $source };
    	};

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    		if ("$source" in $$props) source.set($source = $$props.$source);
    	};

    	return [item, $source, clickHandler, onChange];
    }

    class Item$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$s, safe_not_equal, { item: 0, onChange: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$s.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$2.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChange*/ ctx[3] === undefined && !("onChange" in props)) {
    			console_1$2.warn("<Item> was created without expected prop 'onChange'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChange() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\route\Table.svelte generated by Svelte v3.16.7 */
    const file$p = "src\\components\\route\\Table.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (130:4) <BHeader>
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
    		source: "(130:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (132:6) {#each Object.keys(_data) as item}
    function create_each_block$a(ctx) {
    	let current;

    	const item = new Item$1({
    			props: {
    				item: {
    					element: /*item*/ ctx[10],
    					.../*_data*/ ctx[1][/*item*/ ctx[10]]
    				},
    				onChange: /*editorChanged*/ ctx[2]
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
    				element: /*item*/ ctx[10],
    				.../*_data*/ ctx[1][/*item*/ ctx[10]]
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
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(132:6) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    // (131:4) <BTable>
    function create_default_slot_2$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
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
    			if (dirty & /*Object, _data, editorChanged*/ 6) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
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
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(131:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (129:2) <BStatic height="47">
    function create_default_slot_1$3(ctx) {
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
    				$$slots: { default: [create_default_slot_2$3] },
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

    			if (dirty & /*$$scope*/ 8192) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			const btable_changes = {};

    			if (dirty & /*$$scope, _data*/ 8194) {
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
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(129:2) <BStatic height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    // (137:2) <BResize left={_route} on:dragend={dragend} height="47">
    function create_default_slot$7(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco");
    			attr_dev(div0, "class", "svelte-v2bbcg");
    			add_location(div0, file$p, 138, 6, 3638);
    			attr_dev(div1, "class", "edit-container svelte-v2bbcg");
    			add_location(div1, file$p, 137, 4, 3603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(137:2) <BResize left={_route} on:dragend={dragend} height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let current;
    	const button = new Button$2({ $$inline: true });

    	const bstatic = new BStatic({
    			props: {
    				height: "47",
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const bresize = new BResize({
    			props: {
    				left: /*_route*/ ctx[0],
    				height: "47",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	bresize.$on("dragend", /*dragend*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(bstatic.$$.fragment);
    			t1 = space();
    			create_component(bresize.$$.fragment);
    			attr_dev(div, "class", "vbox svelte-v2bbcg");
    			add_location(div, file$p, 127, 0, 3290);
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

    			if (dirty & /*$$scope, _data*/ 8194) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);
    			const bresize_changes = {};
    			if (dirty & /*_route*/ 1) bresize_changes.left = /*_route*/ ctx[0];

    			if (dirty & /*$$scope*/ 8192) {
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let route = 163;
    	let data = [];
    	let rerender = 0;

    	const routeHandler = obj => {
    		console.log("ws__send(getRoute)", obj);

    		if (obj._tags_) {
    			window.mitm.__tag1 = obj._tags_.__tag1;
    			window.mitm.__tag2 = obj._tags_.__tag2;
    			window.mitm.__tag3 = obj._tags_.__tag3;
    			window.mitm.__tag4 = obj._tags_.__tag4;
    		}

    		if (window.mitm.files.route === undefined) {
    			window.mitm.files.route = obj.routes;
    			$$invalidate(5, data = obj.routes);
    		} else {
    			const { route } = window.mitm.files;
    			const newRoute = {};
    			const { routes } = obj;

    			for (let k in routes) {
    				newRoute[k] = route[k] ? route[k] : routes[k];
    				newRoute[k].content = routes[k].content;
    			}

    			$$invalidate(5, data = newRoute);
    			window.mitm.files.route = newRoute;
    		}

    		const { getRoute_events } = window.mitm.files;

    		for (let key in getRoute_events) {
    			getRoute_events[key](data);
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
    			data.route && $$invalidate(4, route = data.route);
    		});

    		function initCodeEditor() {
    			const element = window.document.getElementById("monaco");

    			const editor = window.monaco.editor.create(element, {
    				language: "javascript",
    				minimap: { enabled: false },
    				value: ""
    			});

    			window.monacoEl = element;
    			window.monacoEditor = editor;
    			editor.onDidChangeModelContent(editorChanged);

    			var ro = new ResizeObserver(entries => {
    					const { width: w, height: h } = entries[0].contentRect;
    					editor.layout({ width: w, height: h });
    				});

    			ro.observe(element);
    		}

    		let intervalTic = 0;

    		const intervalID = window.setInterval(
    			() => {
    				if (window.monaco.editor) {
    					console.log("Run", { intervalTic });
    					clearInterval(intervalID);
    					initCodeEditor();
    				} else if (intervalTic > 5) {
    					console.log("Out", { intervalTic });
    					clearInterval(intervalID);
    					initCodeEditor();
    				}

    				intervalTic += 1;
    			},
    			100
    		);
    	});

    	window.mitm.files.route_events.routeTable = () => {
    		console.log("routeTable getting called!!!");
    		window.ws__send("getRoute", "", routeHandler);
    	};

    	let editbuffer;
    	let _timeout = null;

    	function editorChanged(e) {
    		let saveDisabled;

    		if (e === false) {
    			saveDisabled = true;

    			source.update(n => {
    				return { ...n, saveDisabled };
    			});

    			editbuffer = window.monacoEditor.getValue();
    		}

    		_timeout && clearTimeout(_timeout);

    		_timeout = setTimeout(
    			() => {
    				if (window.monacoEditor) {
    					saveDisabled = window.monacoEditor.getValue() === editbuffer;

    					source.update(n => {
    						return { ...n, saveDisabled };
    					});

    					console.log(e);
    				}
    			},
    			500
    		);
    	}

    	function dragend({ detail }) {
    		$$invalidate(4, route = detail.left);
    		chrome.storage.local.set({ route });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("route" in $$props) $$invalidate(4, route = $$props.route);
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("editbuffer" in $$props) editbuffer = $$props.editbuffer;
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    		if ("_route" in $$props) $$invalidate(0, _route = $$props._route);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    	};

    	let _route;
    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*route*/ 16) {
    			 $$invalidate(0, _route = route);
    		}

    		if ($$self.$$.dirty & /*data*/ 32) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [_route, _data, editorChanged, dragend];
    }

    class Table$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src\components\other\OpenHome.svelte generated by Svelte v3.16.7 */

    const file$q = "src\\components\\other\\OpenHome.svelte";

    function create_fragment$u(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open Home";
    			add_location(button, file$q, 8, 0, 137);
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
    		id: create_fragment$u.name,
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

    class OpenHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpenHome",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src\components\other\CodeHome.svelte generated by Svelte v3.16.7 */

    const file$r = "src\\components\\other\\CodeHome.svelte";

    function create_fragment$v(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Code Home";
    			add_location(button, file$r, 8, 0, 137);
    			dispose = listen_dev(button, "click", btnCode, false, false, false);
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
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnCode() {
    	ws__send("codeHome", "", data => {
    		console.log("Done code home folder!");
    	});
    }

    class CodeHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeHome",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* src\components\other\NoHostLogs.svelte generated by Svelte v3.16.7 */
    const file$s = "src\\components\\other\\NoHostLogs.svelte";

    function create_fragment$w(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\r\n  No Host Logs");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag();
    			add_location(input, file$s, 24, 2, 510);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$s, 23, 0, 482);
    			dispose = listen_dev(input, "click", /*btnNoHostLogs*/ ctx[0], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function flag() {
    	return window.mitm.client.nohostlogs;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let $client;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(1, $client = $$value));

    	function btnNoHostLogs(e) {
    		const nohostlogs = e.target.checked;

    		client.update(n => {
    			return { ...$client, nohostlogs };
    		});

    		console.log($client);

    		ws__send("setClient", { nohostlogs }, data => {
    			window.mitm.client.nohostlogs = data.nohostlogs;
    			console.log("Done change state nohostlogs", data);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$client" in $$props) client.set($client = $$props.$client);
    	};

    	return [btnNoHostLogs];
    }

    class NoHostLogs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NoHostLogs",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    /* src\components\other\Postmessage.svelte generated by Svelte v3.16.7 */

    const file$t = "src\\components\\other\\Postmessage.svelte";

    function create_fragment$x(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\r\n  Post Messages");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag$1();
    			add_location(input, file$t, 15, 2, 361);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$t, 14, 0, 333);
    			dispose = listen_dev(input, "click", btnPostmessage, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnPostmessage(e) {
    	const postmessage = e.target.checked;

    	ws__send("setClient", { postmessage }, data => {
    		window.mitm.client.postmessage = data.postmessage;
    		console.log("Done change state postmessage", data);
    	});
    }

    function flag$1() {
    	return window.mitm.client.postmessage;
    }

    class Postmessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Postmessage",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* src\components\other\Csp.svelte generated by Svelte v3.16.7 */

    const file$u = "src\\components\\other\\Csp.svelte";

    function create_fragment$y(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\r\n  Content Sec. Policy");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag$2();
    			add_location(input, file$u, 15, 2, 305);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$u, 14, 0, 277);
    			dispose = listen_dev(input, "click", btnCsp, false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnCsp(e) {
    	const csp = e.target.checked;

    	ws__send("setClient", { csp }, data => {
    		window.mitm.client.csp = data.csp;
    		console.log("Done change state csp", data);
    	});
    }

    function flag$2() {
    	return window.mitm.client.csp;
    }

    class Csp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Csp",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    /* src\components\other\Tab.svelte generated by Svelte v3.16.7 */
    const file$v = "src\\components\\other\\Tab.svelte";

    function create_fragment$z(ctx) {
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let t1;
    	let li2;
    	let t2;
    	let li3;
    	let t3;
    	let li4;
    	let current;
    	const openhome = new OpenHome({ $$inline: true });
    	const codehome = new CodeHome({ $$inline: true });
    	const nohostlogs = new NoHostLogs({ $$inline: true });
    	const postmessage = new Postmessage({ $$inline: true });
    	const csp = new Csp({ $$inline: true });

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			create_component(openhome.$$.fragment);
    			t0 = space();
    			li1 = element("li");
    			create_component(codehome.$$.fragment);
    			t1 = space();
    			li2 = element("li");
    			create_component(nohostlogs.$$.fragment);
    			t2 = space();
    			li3 = element("li");
    			create_component(postmessage.$$.fragment);
    			t3 = space();
    			li4 = element("li");
    			create_component(csp.$$.fragment);
    			attr_dev(li0, "class", "svelte-gdfpns");
    			add_location(li0, file$v, 9, 0, 244);
    			attr_dev(li1, "class", "svelte-gdfpns");
    			add_location(li1, file$v, 10, 0, 266);
    			attr_dev(li2, "class", "svelte-gdfpns");
    			add_location(li2, file$v, 11, 0, 288);
    			attr_dev(li3, "class", "svelte-gdfpns");
    			add_location(li3, file$v, 12, 0, 312);
    			attr_dev(li4, "class", "svelte-gdfpns");
    			add_location(li4, file$v, 13, 0, 337);
    			attr_dev(ul, "class", "svelte-gdfpns");
    			add_location(ul, file$v, 8, 0, 238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			mount_component(openhome, li0, null);
    			append_dev(ul, t0);
    			append_dev(ul, li1);
    			mount_component(codehome, li1, null);
    			append_dev(ul, t1);
    			append_dev(ul, li2);
    			mount_component(nohostlogs, li2, null);
    			append_dev(ul, t2);
    			append_dev(ul, li3);
    			mount_component(postmessage, li3, null);
    			append_dev(ul, t3);
    			append_dev(ul, li4);
    			mount_component(csp, li4, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(openhome.$$.fragment, local);
    			transition_in(codehome.$$.fragment, local);
    			transition_in(nohostlogs.$$.fragment, local);
    			transition_in(postmessage.$$.fragment, local);
    			transition_in(csp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(openhome.$$.fragment, local);
    			transition_out(codehome.$$.fragment, local);
    			transition_out(nohostlogs.$$.fragment, local);
    			transition_out(postmessage.$$.fragment, local);
    			transition_out(csp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(openhome);
    			destroy_component(codehome);
    			destroy_component(nohostlogs);
    			destroy_component(postmessage);
    			destroy_component(csp);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Tab$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$z.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.7 */
    const file$w = "src\\App.svelte";

    // (18:2) <Tab label="Route">
    function create_default_slot_4(ctx) {
    	let current;
    	const routetable = new Table$2({ $$inline: true });

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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(18:2) <Tab label=\\\"Route\\\">",
    		ctx
    	});

    	return block;
    }

    // (19:2) <Tab label="Logs">
    function create_default_slot_3$2(ctx) {
    	let current;
    	const logstable = new Table$1({ $$inline: true });

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
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(19:2) <Tab label=\\\"Logs\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:2) <Tab label="Tags">
    function create_default_slot_2$4(ctx) {
    	let current;
    	const tagstable = new Table({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tagstable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tagstable, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tagstable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tagstable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tagstable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(20:2) <Tab label=\\\"Tags\\\">",
    		ctx
    	});

    	return block;
    }

    // (21:2) <Tab label="Other">
    function create_default_slot_1$4(ctx) {
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
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(21:2) <Tab label=\\\"Other\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:0) <Tabs style="is-boxed" size="is-small">
    function create_default_slot$8(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	const tab0 = new Tab({
    			props: {
    				label: "Route",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab1 = new Tab({
    			props: {
    				label: "Logs",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab2 = new Tab({
    			props: {
    				label: "Tags",
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab3 = new Tab({
    			props: {
    				label: "Other",
    				$$slots: { default: [create_default_slot_1$4] },
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
    			t2 = space();
    			create_component(tab3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(tab3, target, anchor);
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
    			const tab3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tab3_changes.$$scope = { dirty, ctx };
    			}

    			tab3.$set(tab3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			transition_in(tab3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			transition_out(tab3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(tab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(tab2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(tab3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(17:0) <Tabs style=\\\"is-boxed\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$A(ctx) {
    	let main;
    	let current;

    	const tabs = new Tabs({
    			props: {
    				style: "is-boxed",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			attr_dev(main, "class", "main");
    			add_location(main, file$w, 15, 0, 484);
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
    		id: create_fragment$A.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$A, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$A.name
    		});
    	}
    }

    console.log('Load MITM plugin');

    function toRegex(str, flags='') {
      return new RegExp(str.replace(/\./g, '\\.').replace(/\?/g, '\\?'), flags);
    }

    window.mitm.fn.toRegex = toRegex;
    window.mitm.browser = { 
      chgUrl_events: {},
      activeUrl: '',
      page: {},
    };

    function chgUrl(url) {
      if (!url) {
        return;
      }
      console.log('Chg url:', url);
      const {browser} = window.mitm;
      browser.activeUrl = url;
      for (let e in browser.chgUrl_events) {
        browser.chgUrl_events[e]();
      }
    }

    function getUrl() {
      chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
        function(tabs){
          const url = tabs[0].url;
          chgUrl(url);
        }
      );
    }
    console.log('Init event tabs');
    let debounce;
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (!tab.active) {
        return;
      }

      const {browser} = window.mitm;
      browser.page = {
        ...browser.page,
        ...changeInfo,
        ...tab,
      };

      if (changeInfo.status === 'loading') {
        browser.page.title = '';
      } else if (browser.page.status === 'complete' && browser.page.title) {
        if (debounce) {
          clearTimeout(debounce);
          debounce = undefined;
        }
        debounce = setTimeout(() => {
          // console.log('Tab Update!!!', tab.url);
          debounce = undefined;
          chgUrl(tab.url);  
        }, 1000);
      }
    });

    chrome.tabs.onActivated.addListener(function(activeInfo) {
      // console.log('Tab Change!!!', activeInfo);
      getUrl();
    });

    const app = new App({target: document.body});
    console.log('Start plugin');
    getUrl();

    // let inprocess = false;
    // const replay = ()=>{
    //   setTimeout(() => {
    //     inprocess = false;
    //   },500);
    // }
    // function reportWindowSize() {
    //   if (!inprocess) {
    //     inprocess = true;
    //     const {innerWidth, innerHeight: height, ws__send} = window;
    //     chrome.windows.get(-2, {}, data => {
    //       const {width:_w} = data;
    //       const width = _w - innerWidth;
    //       console.log({width, height, _w});
    //       ws__send('setViewport', {width, height, _w}, replay);
    //     })  
    //   }
    // }
    // window.addEventListener("resize", reportWindowSize);
    // window.addEventListener('message', event => {
    //   console.log({event});
    // });

    return app;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvbW90aW9uL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWJzLnN2ZWx0ZSIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9zdG9yZXMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9ib3gvQlN0YXRpYy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL0J1dHRvbi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MxXy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MyXzEuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzMl8uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzM18zLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfMi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MzXzEuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzM18uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWJsZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9TcGxpdHRlci5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9ib3gvQlJlc2l6ZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0J1dHRvbi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0l0ZW0uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy90YWIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0J1dHRvbjIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9CYXNlVGFiLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvSnNvbi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0h0bWwuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Dc3Muc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Kcy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1Nob3cuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9UYWJsZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9zdG9yZXMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9UYWJsZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9vdGhlci9PcGVuSG9tZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9vdGhlci9Db2RlSG9tZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9vdGhlci9Ob0hvc3RMb2dzLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL1Bvc3RtZXNzYWdlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL0NzcC5zdmVsdGUiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoIXN0b3JlIHx8IHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICh0eXBlb2YgJCRzY29wZS5kaXJ0eSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMocHJvcHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmIChrWzBdICE9PSAnJCcpXG4gICAgICAgICAgICByZXN1bHRba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gb25jZShmbikge1xuICAgIGxldCByYW4gPSBmYWxzZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKHJhbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgZm4uY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gbnVsbF90b19lbXB0eSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9zdG9yZV92YWx1ZShzdG9yZSwgcmV0LCB2YWx1ZSA9IHJldCkge1xuICAgIHN0b3JlLnNldCh2YWx1ZSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmNvbnN0IGhhc19wcm9wID0gKG9iaiwgcHJvcCkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG5mdW5jdGlvbiBhY3Rpb25fZGVzdHJveWVyKGFjdGlvbl9yZXN1bHQpIHtcbiAgICByZXR1cm4gYWN0aW9uX3Jlc3VsdCAmJiBpc19mdW5jdGlvbihhY3Rpb25fcmVzdWx0LmRlc3Ryb3kpID8gYWN0aW9uX3Jlc3VsdC5kZXN0cm95IDogbm9vcDtcbn1cblxuY29uc3QgaXNfY2xpZW50ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG5sZXQgbm93ID0gaXNfY2xpZW50XG4gICAgPyAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KClcbiAgICA6ICgpID0+IERhdGUubm93KCk7XG5sZXQgcmFmID0gaXNfY2xpZW50ID8gY2IgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNiKSA6IG5vb3A7XG4vLyB1c2VkIGludGVybmFsbHkgZm9yIHRlc3RpbmdcbmZ1bmN0aW9uIHNldF9ub3coZm4pIHtcbiAgICBub3cgPSBmbjtcbn1cbmZ1bmN0aW9uIHNldF9yYWYoZm4pIHtcbiAgICByYWYgPSBmbjtcbn1cblxuY29uc3QgdGFza3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBydW5fdGFza3Mobm93KSB7XG4gICAgdGFza3MuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgaWYgKCF0YXNrLmMobm93KSkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICAgICAgdGFzay5mKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGFza3Muc2l6ZSAhPT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG59XG4vKipcbiAqIEZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkhXG4gKi9cbmZ1bmN0aW9uIGNsZWFyX2xvb3BzKCkge1xuICAgIHRhc2tzLmNsZWFyKCk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdGFzayB0aGF0IHJ1bnMgb24gZWFjaCByYWYgZnJhbWVcbiAqIHVudGlsIGl0IHJldHVybnMgYSBmYWxzeSB2YWx1ZSBvciBpcyBhYm9ydGVkXG4gKi9cbmZ1bmN0aW9uIGxvb3AoY2FsbGJhY2spIHtcbiAgICBsZXQgdGFzaztcbiAgICBpZiAodGFza3Muc2l6ZSA9PT0gMClcbiAgICAgICAgcmFmKHJ1bl90YXNrcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvbWlzZTogbmV3IFByb21pc2UoZnVsZmlsbCA9PiB7XG4gICAgICAgICAgICB0YXNrcy5hZGQodGFzayA9IHsgYzogY2FsbGJhY2ssIGY6IGZ1bGZpbGwgfSk7XG4gICAgICAgIH0pLFxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIG5vZGUpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIGFuY2hvciB8fCBudWxsKTtcbn1cbmZ1bmN0aW9uIGRldGFjaChub2RlKSB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gZGVzdHJveV9lYWNoKGl0ZXJhdGlvbnMsIGRldGFjaGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoaXRlcmF0aW9uc1tpXSlcbiAgICAgICAgICAgIGl0ZXJhdGlvbnNbaV0uZChkZXRhY2hpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGVsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gZWxlbWVudF9pcyhuYW1lLCBpcykge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUsIHsgaXMgfSk7XG59XG5mdW5jdGlvbiBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzKG9iaiwgZXhjbHVkZSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhc19wcm9wKG9iaiwgaylcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICYmIGV4Y2x1ZGUuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRhcmdldFtrXSA9IG9ialtrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gc3ZnX2VsZW1lbnQobmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5mdW5jdGlvbiB0ZXh0KGRhdGEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5mdW5jdGlvbiBzcGFjZSgpIHtcbiAgICByZXR1cm4gdGV4dCgnICcpO1xufVxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gICAgcmV0dXJuIHRleHQoJycpO1xufVxuZnVuY3Rpb24gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4gbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbn1cbmZ1bmN0aW9uIHByZXZlbnRfZGVmYXVsdChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0b3BfcHJvcGFnYXRpb24oZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc2VsZihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSB0aGlzKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhub2RlLl9fcHJvdG9fXyk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmNzc1RleHQgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvcnNba2V5XSAmJiBkZXNjcmlwdG9yc1trZXldLnNldCkge1xuICAgICAgICAgICAgbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3ZnX2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcCBpbiBub2RlKSB7XG4gICAgICAgIG5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGF0dHIobm9kZSwgcHJvcCwgdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHhsaW5rX2F0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwKSB7XG4gICAgY29uc3QgdmFsdWUgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUucHVzaChncm91cFtpXS5fX3ZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IHVuZGVmaW5lZCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuICAgICAgICAgICAgICAgIGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pXG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07IC8vIFRPRE8gc3RyaXAgdW53YW50ZWQgYXR0cmlidXRlc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0LmRhdGEgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwgfHwgaW5wdXQudmFsdWUpIHtcbiAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdHlwZShpbnB1dCwgdHlwZSkge1xuICAgIHRyeSB7XG4gICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N0eWxlKG5vZGUsIGtleSwgdmFsdWUsIGltcG9ydGFudCkge1xuICAgIG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSwgaW1wb3J0YW50ID8gJ2ltcG9ydGFudCcgOiAnJyk7XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3RfdmFsdWUoc2VsZWN0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRfb3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG4gICAgcmV0dXJuIHNlbGVjdGVkX29wdGlvbiAmJiBzZWxlY3RlZF9vcHRpb24uX192YWx1ZTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9tdWx0aXBsZV92YWx1ZShzZWxlY3QpIHtcbiAgICByZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIG9wdGlvbiA9PiBvcHRpb24uX192YWx1ZSk7XG59XG5mdW5jdGlvbiBhZGRfcmVzaXplX2xpc3RlbmVyKGVsZW1lbnQsIGZuKSB7XG4gICAgaWYgKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBvYmplY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvYmplY3QnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IGhlaWdodDogMTAwJTsgd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAtMTsnKTtcbiAgICBvYmplY3Quc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgb2JqZWN0LnR5cGUgPSAndGV4dC9odG1sJztcbiAgICBvYmplY3QudGFiSW5kZXggPSAtMTtcbiAgICBsZXQgd2luO1xuICAgIG9iamVjdC5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIHdpbiA9IG9iamVjdC5jb250ZW50RG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgfTtcbiAgICBpZiAoL1RyaWRlbnQvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChvYmplY3QpO1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvYmplY3QuZGF0YSA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsOiAoKSA9PiB7XG4gICAgICAgICAgICB3aW4gJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIgJiYgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKGh0bWwsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5lID0gZWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuYSA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgIH1cbiAgICBtKHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRhcmdldCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICB9XG4gICAgdShodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgcChodG1sKSB7XG4gICAgICAgIHRoaXMuZCgpO1xuICAgICAgICB0aGlzLnUoaHRtbCk7XG4gICAgICAgIHRoaXMubSh0aGlzLnQsIHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuXG5sZXQgc3R5bGVzaGVldDtcbmxldCBhY3RpdmUgPSAwO1xubGV0IGN1cnJlbnRfcnVsZXMgPSB7fTtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuICAgIGxldCBoYXNoID0gNTM4MTtcbiAgICBsZXQgaSA9IHN0ci5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGhhc2ggPj4+IDA7XG59XG5mdW5jdGlvbiBjcmVhdGVfcnVsZShub2RlLCBhLCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2UsIGZuLCB1aWQgPSAwKSB7XG4gICAgY29uc3Qgc3RlcCA9IDE2LjY2NiAvIGR1cmF0aW9uO1xuICAgIGxldCBrZXlmcmFtZXMgPSAne1xcbic7XG4gICAgZm9yIChsZXQgcCA9IDA7IHAgPD0gMTsgcCArPSBzdGVwKSB7XG4gICAgICAgIGNvbnN0IHQgPSBhICsgKGIgLSBhKSAqIGVhc2UocCk7XG4gICAgICAgIGtleWZyYW1lcyArPSBwICogMTAwICsgYCV7JHtmbih0LCAxIC0gdCl9fVxcbmA7XG4gICAgfVxuICAgIGNvbnN0IHJ1bGUgPSBrZXlmcmFtZXMgKyBgMTAwJSB7JHtmbihiLCAxIC0gYil9fVxcbn1gO1xuICAgIGNvbnN0IG5hbWUgPSBgX19zdmVsdGVfJHtoYXNoKHJ1bGUpfV8ke3VpZH1gO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBpZiAoIXN0eWxlc2hlZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgICAgICAgc3R5bGVzaGVldCA9IHN0eWxlLnNoZWV0O1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRfcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiBgYH0ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJylcbiAgICAgICAgLnNwbGl0KCcsICcpXG4gICAgICAgIC5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgIGlmIChuYW1lICYmICEtLWFjdGl2ZSlcbiAgICAgICAgY2xlYXJfcnVsZXMoKTtcbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBpID0gc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgIGN1cnJlbnRfcnVsZXMgPSB7fTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZ1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbmApO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZnRlclVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmFmdGVyX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX2Rlc3Ryb3kucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgLy8gVE9ETyBhcmUgdGhlcmUgc2l0dWF0aW9ucyB3aGVyZSBldmVudHMgY291bGQgYmUgZGlzcGF0Y2hlZFxuICAgICAgICAgICAgLy8gaW4gYSBzZXJ2ZXIgKG5vbi1ET00pIGVudmlyb25tZW50P1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBzZXRDb250ZXh0KGtleSwgY29udGV4dCkge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuc2V0KGtleSwgY29udGV4dCk7XG59XG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4oZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIGNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzLnNoaWZ0KCk7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSBwcm9ncmFtLmIgLSB0O1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBnbG9iYWwpO1xuXG5mdW5jdGlvbiBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5kKDEpO1xuICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cbmZ1bmN0aW9uIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gdXBkYXRlX2tleWVkX2VhY2gob2xkX2Jsb2NrcywgZGlydHksIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcbiAgICBsZXQgbyA9IG9sZF9ibG9ja3MubGVuZ3RoO1xuICAgIGxldCBuID0gbGlzdC5sZW5ndGg7XG4gICAgbGV0IGkgPSBvO1xuICAgIGNvbnN0IG9sZF9pbmRleGVzID0ge307XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgb2xkX2luZGV4ZXNbb2xkX2Jsb2Nrc1tpXS5rZXldID0gaTtcbiAgICBjb25zdCBuZXdfYmxvY2tzID0gW107XG4gICAgY29uc3QgbmV3X2xvb2t1cCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG4gICAgICAgIGlmIChrZXkgaW4gb2xkX2luZGV4ZXMpXG4gICAgICAgICAgICBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcbiAgICB9XG4gICAgY29uc3Qgd2lsbF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGRpZF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIGluc2VydChibG9jaykge1xuICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgYmxvY2subShub2RlLCBuZXh0KTtcbiAgICAgICAgbG9va3VwLnNldChibG9jay5rZXksIGJsb2NrKTtcbiAgICAgICAgbmV4dCA9IGJsb2NrLmZpcnN0O1xuICAgICAgICBuLS07XG4gICAgfVxuICAgIHdoaWxlIChvICYmIG4pIHtcbiAgICAgICAgY29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3NbbyAtIDFdO1xuICAgICAgICBjb25zdCBuZXdfa2V5ID0gbmV3X2Jsb2NrLmtleTtcbiAgICAgICAgY29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG4gICAgICAgIGlmIChuZXdfYmxvY2sgPT09IG9sZF9ibG9jaykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgbmV4dCA9IG5ld19ibG9jay5maXJzdDtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgICAgIG4tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgYmxvY2tcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFsb29rdXAuaGFzKG5ld19rZXkpIHx8IHdpbGxfbW92ZS5oYXMobmV3X2tleSkpIHtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpZF9tb3ZlLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbHRhcy5nZXQobmV3X2tleSkgPiBkZWx0YXMuZ2V0KG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBkaWRfbW92ZS5hZGQobmV3X2tleSk7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKG8tLSkge1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW29dO1xuICAgICAgICBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9ibG9jay5rZXkpKVxuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgfVxuICAgIHdoaWxlIChuKVxuICAgICAgICBpbnNlcnQobmV3X2Jsb2Nrc1tuIC0gMV0pO1xuICAgIHJldHVybiBuZXdfYmxvY2tzO1xufVxuZnVuY3Rpb24gbWVhc3VyZShibG9ja3MpIHtcbiAgICBjb25zdCByZWN0cyA9IHt9O1xuICAgIGxldCBpID0gYmxvY2tzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICByZWN0c1tibG9ja3NbaV0ua2V5XSA9IGJsb2Nrc1tpXS5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiByZWN0cztcbn1cblxuZnVuY3Rpb24gZ2V0X3NwcmVhZF91cGRhdGUobGV2ZWxzLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgdXBkYXRlID0ge307XG4gICAgY29uc3QgdG9fbnVsbF9vdXQgPSB7fTtcbiAgICBjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG4gICAgbGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgbyA9IGxldmVsc1tpXTtcbiAgICAgICAgY29uc3QgbiA9IHVwZGF0ZXNbaV07XG4gICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG4pKVxuICAgICAgICAgICAgICAgICAgICB0b19udWxsX291dFtrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFjY291bnRlZF9mb3Jba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVba2V5XSA9IG5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXZlbHNbaV0gPSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9fbnVsbF9vdXQpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHVwZGF0ZSkpXG4gICAgICAgICAgICB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZTtcbn1cbmZ1bmN0aW9uIGdldF9zcHJlYWRfb2JqZWN0KHNwcmVhZF9wcm9wcykge1xuICAgIHJldHVybiB0eXBlb2Ygc3ByZWFkX3Byb3BzID09PSAnb2JqZWN0JyAmJiBzcHJlYWRfcHJvcHMgIT09IG51bGwgPyBzcHJlYWRfcHJvcHMgOiB7fTtcbn1cblxuLy8gc291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbmNvbnN0IGJvb2xlYW5fYXR0cmlidXRlcyA9IG5ldyBTZXQoW1xuICAgICdhbGxvd2Z1bGxzY3JlZW4nLFxuICAgICdhbGxvd3BheW1lbnRyZXF1ZXN0JyxcbiAgICAnYXN5bmMnLFxuICAgICdhdXRvZm9jdXMnLFxuICAgICdhdXRvcGxheScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdjb250cm9scycsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWZlcicsXG4gICAgJ2Rpc2FibGVkJyxcbiAgICAnZm9ybW5vdmFsaWRhdGUnLFxuICAgICdoaWRkZW4nLFxuICAgICdpc21hcCcsXG4gICAgJ2xvb3AnLFxuICAgICdtdWx0aXBsZScsXG4gICAgJ211dGVkJyxcbiAgICAnbm9tb2R1bGUnLFxuICAgICdub3ZhbGlkYXRlJyxcbiAgICAnb3BlbicsXG4gICAgJ3BsYXlzaW5saW5lJyxcbiAgICAncmVhZG9ubHknLFxuICAgICdyZXF1aXJlZCcsXG4gICAgJ3JldmVyc2VkJyxcbiAgICAnc2VsZWN0ZWQnXG5dKTtcblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgY2xhc3Nlc190b19hZGQpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbih7fSwgLi4uYXJncyk7XG4gICAgaWYgKGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmNsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgIGlmIChpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3Rlci50ZXN0KG5hbWUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IFwiIFwiICsgbmFtZSArIFwiPVwiICsgSlNPTi5zdHJpbmdpZnkoU3RyaW5nKHZhbHVlKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnJiMzNDsnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBlc2NhcGVkID0ge1xuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShodG1sKSB7XG4gICAgcmV0dXJuIFN0cmluZyhodG1sKS5yZXBsYWNlKC9bXCInJjw+XS9nLCBtYXRjaCA9PiBlc2NhcGVkW21hdGNoXSk7XG59XG5mdW5jdGlvbiBlYWNoKGl0ZW1zLCBmbikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHN0ciArPSBmbihpdGVtc1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBtaXNzaW5nX2NvbXBvbmVudCA9IHtcbiAgICAkJHJlbmRlcjogKCkgPT4gJydcbn07XG5mdW5jdGlvbiB2YWxpZGF0ZV9jb21wb25lbnQoY29tcG9uZW50LCBuYW1lKSB7XG4gICAgaWYgKCFjb21wb25lbnQgfHwgIWNvbXBvbmVudC4kJHJlbmRlcikge1xuICAgICAgICBpZiAobmFtZSA9PT0gJ3N2ZWx0ZTpjb21wb25lbnQnKVxuICAgICAgICAgICAgbmFtZSArPSAnIHRoaXM9ey4uLn0nO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYDwke25hbWV9PiBpcyBub3QgYSB2YWxpZCBTU1IgY29tcG9uZW50LiBZb3UgbWF5IG5lZWQgdG8gcmV2aWV3IHlvdXIgYnVpbGQgY29uZmlnIHRvIGVuc3VyZSB0aGF0IGRlcGVuZGVuY2llcyBhcmUgY29tcGlsZWQsIHJhdGhlciB0aGFuIGltcG9ydGVkIGFzIHByZS1jb21waWxlZCBtb2R1bGVzYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBkZWJ1ZyhmaWxlLCBsaW5lLCBjb2x1bW4sIHZhbHVlcykge1xuICAgIGNvbnNvbGUubG9nKGB7QGRlYnVnfSAke2ZpbGUgPyBmaWxlICsgJyAnIDogJyd9KCR7bGluZX06JHtjb2x1bW59KWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyh2YWx1ZXMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXR1cm4gJyc7XG59XG5sZXQgb25fZGVzdHJveTtcbmZ1bmN0aW9uIGNyZWF0ZV9zc3JfY29tcG9uZW50KGZuKSB7XG4gICAgZnVuY3Rpb24gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICAgICAgY29uc3QgJCQgPSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LFxuICAgICAgICAgICAgY29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiBgYDtcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICB9KTtcbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCBwcm9wX3ZhbHVlcyA9IG9wdGlvbnMucHJvcHMgfHwge307XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5XG4gICAgfTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgcHJvcF92YWx1ZXMsIChpLCByZXQsIHZhbHVlID0gcmV0KSA9PiB7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICgkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZGVuIGJ5IGluc3RhbmNlLCBpZiBpdCBoYXMgcHJvcHNcbiAgICAgICAgfVxuICAgIH07XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAkc2V0KCkge1xuICAgICAgICAvLyBvdmVycmlkZGVuIGJ5IGluc3RhbmNlLCBpZiBpdCBoYXMgcHJvcHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NSW5zZXJ0XCIsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVcIiwgeyBub2RlIH0pO1xuICAgIGRldGFjaChub2RlKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9iZXR3ZWVuX2RldihiZWZvcmUsIGFmdGVyKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYmVmb3JlX2RldihhZnRlcikge1xuICAgIHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9hZnRlcl9kZXYoYmVmb3JlKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbGlzdGVuX2Rldihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucywgaGFzX3ByZXZlbnRfZGVmYXVsdCwgaGFzX3N0b3BfcHJvcGFnYXRpb24pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSBvcHRpb25zID09PSB0cnVlID8gW1wiY2FwdHVyZVwiXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01BZGRFdmVudExpc3RlbmVyXCIsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyXCIsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyX2Rldihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlXCIsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0QXR0cmlidXRlXCIsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0UHJvcGVydHlcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBkYXRhc2V0X2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlLmRhdGFzZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0RGF0YXNldFwiLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NU2V0RGF0YVwiLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJ3RhcmdldCcgaXMgYSByZXF1aXJlZCBvcHRpb25gKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcigpO1xuICAgIH1cbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgc3VwZXIuJGRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZGApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb29wX2d1YXJkKHRpbWVvdXQpIHtcbiAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydCA+IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5maW5pdGUgbG9vcCBkZXRlY3RlZGApO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgSHRtbFRhZywgU3ZlbHRlQ29tcG9uZW50LCBTdmVsdGVDb21wb25lbnREZXYsIFN2ZWx0ZUVsZW1lbnQsIGFjdGlvbl9kZXN0cm95ZXIsIGFkZF9hdHRyaWJ1dGUsIGFkZF9jbGFzc2VzLCBhZGRfZmx1c2hfY2FsbGJhY2ssIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXNzaWduLCBhdHRyLCBhdHRyX2RldiwgYmVmb3JlVXBkYXRlLCBiaW5kLCBiaW5kaW5nX2NhbGxiYWNrcywgYmxhbmtfb2JqZWN0LCBidWJibGUsIGNoZWNrX291dHJvcywgY2hpbGRyZW4sIGNsYWltX2NvbXBvbmVudCwgY2xhaW1fZWxlbWVudCwgY2xhaW1fc3BhY2UsIGNsYWltX3RleHQsIGNsZWFyX2xvb3BzLCBjb21wb25lbnRfc3Vic2NyaWJlLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVzY2FwZSwgZXNjYXBlZCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRDb250ZXh0LCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0LCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWVhc3VyZSwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHJhZiwgcnVuLCBydW5fYWxsLCBzYWZlX25vdF9lcXVhbCwgc2NoZWR1bGVfdXBkYXRlLCBzZWxlY3RfbXVsdGlwbGVfdmFsdWUsIHNlbGVjdF9vcHRpb24sIHNlbGVjdF9vcHRpb25zLCBzZWxlY3RfdmFsdWUsIHNlbGYsIHNldENvbnRleHQsIHNldF9hdHRyaWJ1dGVzLCBzZXRfY3VycmVudF9jb21wb25lbnQsIHNldF9jdXN0b21fZWxlbWVudF9kYXRhLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzdG9wX3Byb3BhZ2F0aW9uLCBzdWJzY3JpYmUsIHN2Z19lbGVtZW50LCB0ZXh0LCB0aWNrLCB0aW1lX3Jhbmdlc190b19hcnJheSwgdG9fbnVtYmVyLCB0b2dnbGVfY2xhc3MsIHRyYW5zaXRpb25faW4sIHRyYW5zaXRpb25fb3V0LCB1cGRhdGVfa2V5ZWRfZWFjaCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCB0eXBlID0gJydcbiAgZXhwb3J0IGxldCBwYWNrID0gJ2ZhcydcbiAgZXhwb3J0IGxldCBpY29uXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG4gIGV4cG9ydCBsZXQgY3VzdG9tQ2xhc3MgPSAnJ1xuICBleHBvcnQgbGV0IGN1c3RvbVNpemUgPSAnJ1xuICBleHBvcnQgbGV0IGlzQ2xpY2thYmxlID0gZmFsc2VcbiAgZXhwb3J0IGxldCBpc0xlZnQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzUmlnaHQgPSBmYWxzZVxuXG4gIGxldCBuZXdDdXN0b21TaXplID0gJydcbiAgbGV0IG5ld1R5cGUgPSAnJ1xuXG4gICQ6IG5ld1BhY2sgPSBwYWNrIHx8ICdmYXMnXG5cbiAgJDoge1xuICAgIGlmIChjdXN0b21TaXplKSBuZXdDdXN0b21TaXplID0gY3VzdG9tU2l6ZVxuICAgIGVsc2Uge1xuICAgICAgc3dpdGNoIChzaXplKSB7XG4gICAgICAgIGNhc2UgJ2lzLXNtYWxsJzpcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpcy1tZWRpdW0nOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtbGcnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaXMtbGFyZ2UnOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtM3gnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJydcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkOiB7XG4gICAgaWYgKCF0eXBlKSBuZXdUeXBlID0gJydcbiAgICBsZXQgc3BsaXRUeXBlID0gW11cbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzcGxpdFR5cGUgPSB0eXBlLnNwbGl0KCctJylcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQga2V5IGluIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVba2V5XSkge1xuICAgICAgICAgIHNwbGl0VHlwZSA9IGtleS5zcGxpdCgnLScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3BsaXRUeXBlLmxlbmd0aCA8PSAxKSBuZXdUeXBlID0gJydcbiAgICBlbHNlIG5ld1R5cGUgPSBgaGFzLXRleHQtJHtzcGxpdFR5cGVbMV19YFxuICB9XG48L3NjcmlwdD5cblxuPHNwYW4gY2xhc3M9XCJpY29uIHtzaXplfSB7bmV3VHlwZX0geyhpc0xlZnQgJiYgJ2lzLWxlZnQnKSB8fCAnJ30geyhpc1JpZ2h0ICYmICdpcy1yaWdodCcpIHx8ICcnfVwiIGNsYXNzOmlzLWNsaWNrYWJsZT17aXNDbGlja2FibGV9IG9uOmNsaWNrPlxuICA8aSBjbGFzcz1cIntuZXdQYWNrfSBmYS17aWNvbn0ge2N1c3RvbUNsYXNzfSB7bmV3Q3VzdG9tU2l6ZX1cIiAvPlxuPC9zcGFuPlxuIiwiaW1wb3J0IHsgc2FmZV9ub3RfZXF1YWwsIG5vb3AsIHJ1bl9hbGwsIGlzX2Z1bmN0aW9uIH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuZXhwb3J0IHsgZ2V0X3N0b3JlX3ZhbHVlIGFzIGdldCB9IGZyb20gJy4uL2ludGVybmFsJztcblxuY29uc3Qgc3Vic2NyaWJlcl9xdWV1ZSA9IFtdO1xuLyoqXG4gKiBDcmVhdGVzIGEgYFJlYWRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyfXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gcmVhZGFibGUodmFsdWUsIHN0YXJ0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3Vic2NyaWJlOiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQpLnN1YnNjcmliZSxcbiAgICB9O1xufVxuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcbiAgICAgICAgaWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIGlmIChzdG9wKSB7IC8vIHN0b3JlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgY29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBzWzFdKCk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUucHVzaChzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5fcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuICAgICAgICBzZXQoZm4odmFsdWUpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuICAgICAgICBzdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuICAgICAgICB9XG4gICAgICAgIHJ1bih2YWx1ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHN1YnNjcmliZXJzLmluZGV4T2Yoc3Vic2NyaWJlcik7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cbmZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuICAgIGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG4gICAgY29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlXG4gICAgICAgID8gW3N0b3Jlc11cbiAgICAgICAgOiBzdG9yZXM7XG4gICAgY29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG4gICAgcmV0dXJuIHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIChzZXQpID0+IHtcbiAgICAgICAgbGV0IGluaXRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgbGV0IHBlbmRpbmcgPSAwO1xuICAgICAgICBsZXQgY2xlYW51cCA9IG5vb3A7XG4gICAgICAgIGNvbnN0IHN5bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0KTtcbiAgICAgICAgICAgIGlmIChhdXRvKSB7XG4gICAgICAgICAgICAgICAgc2V0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcnMgPSBzdG9yZXNfYXJyYXkubWFwKChzdG9yZSwgaSkgPT4gc3RvcmUuc3Vic2NyaWJlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdmFsdWVzW2ldID0gdmFsdWU7XG4gICAgICAgICAgICBwZW5kaW5nICY9IH4oMSA8PCBpKTtcbiAgICAgICAgICAgIGlmIChpbml0ZWQpIHtcbiAgICAgICAgICAgICAgICBzeW5jKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHBlbmRpbmcgfD0gKDEgPDwgaSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgaW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgc3luYygpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodW5zdWJzY3JpYmVycyk7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IGRlcml2ZWQsIHJlYWRhYmxlLCB3cml0YWJsZSB9O1xuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICcuLi9zdG9yZSc7XG5pbXBvcnQgeyBub3csIGxvb3AsIGFzc2lnbiB9IGZyb20gJy4uL2ludGVybmFsJztcbmltcG9ydCB7IGxpbmVhciB9IGZyb20gJy4uL2Vhc2luZyc7XG5cbmZ1bmN0aW9uIGlzX2RhdGUob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZSwgY3VycmVudF92YWx1ZSwgdGFyZ2V0X3ZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50X3ZhbHVlID09PSAnbnVtYmVyJyB8fCBpc19kYXRlKGN1cnJlbnRfdmFsdWUpKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgZGVsdGEgPSB0YXJnZXRfdmFsdWUgLSBjdXJyZW50X3ZhbHVlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHZlbG9jaXR5ID0gKGN1cnJlbnRfdmFsdWUgLSBsYXN0X3ZhbHVlKSAvIChjdHguZHQgfHwgMSAvIDYwKTsgLy8gZ3VhcmQgZGl2IGJ5IDBcbiAgICAgICAgY29uc3Qgc3ByaW5nID0gY3R4Lm9wdHMuc3RpZmZuZXNzICogZGVsdGE7XG4gICAgICAgIGNvbnN0IGRhbXBlciA9IGN0eC5vcHRzLmRhbXBpbmcgKiB2ZWxvY2l0eTtcbiAgICAgICAgY29uc3QgYWNjZWxlcmF0aW9uID0gKHNwcmluZyAtIGRhbXBlcikgKiBjdHguaW52X21hc3M7XG4gICAgICAgIGNvbnN0IGQgPSAodmVsb2NpdHkgKyBhY2NlbGVyYXRpb24pICogY3R4LmR0O1xuICAgICAgICBpZiAoTWF0aC5hYnMoZCkgPCBjdHgub3B0cy5wcmVjaXNpb24gJiYgTWF0aC5hYnMoZGVsdGEpIDwgY3R4Lm9wdHMucHJlY2lzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0X3ZhbHVlOyAvLyBzZXR0bGVkXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjdHguc2V0dGxlZCA9IGZhbHNlOyAvLyBzaWduYWwgbG9vcCB0byBrZWVwIHRpY2tpbmdcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHJldHVybiBpc19kYXRlKGN1cnJlbnRfdmFsdWUpID9cbiAgICAgICAgICAgICAgICBuZXcgRGF0ZShjdXJyZW50X3ZhbHVlLmdldFRpbWUoKSArIGQpIDogY3VycmVudF92YWx1ZSArIGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50X3ZhbHVlKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBjdXJyZW50X3ZhbHVlLm1hcCgoXywgaSkgPT4gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2ldLCBjdXJyZW50X3ZhbHVlW2ldLCB0YXJnZXRfdmFsdWVbaV0pKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGN1cnJlbnRfdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IG5leHRfdmFsdWUgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBrIGluIGN1cnJlbnRfdmFsdWUpXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBuZXh0X3ZhbHVlW2tdID0gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2tdLCBjdXJyZW50X3ZhbHVlW2tdLCB0YXJnZXRfdmFsdWVba10pO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBuZXh0X3ZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3Qgc3ByaW5nICR7dHlwZW9mIGN1cnJlbnRfdmFsdWV9IHZhbHVlc2ApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNwcmluZyh2YWx1ZSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgc3RvcmUgPSB3cml0YWJsZSh2YWx1ZSk7XG4gICAgY29uc3QgeyBzdGlmZm5lc3MgPSAwLjE1LCBkYW1waW5nID0gMC44LCBwcmVjaXNpb24gPSAwLjAxIH0gPSBvcHRzO1xuICAgIGxldCBsYXN0X3RpbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IGN1cnJlbnRfdG9rZW47XG4gICAgbGV0IGxhc3RfdmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgdGFyZ2V0X3ZhbHVlID0gdmFsdWU7XG4gICAgbGV0IGludl9tYXNzID0gMTtcbiAgICBsZXQgaW52X21hc3NfcmVjb3ZlcnlfcmF0ZSA9IDA7XG4gICAgbGV0IGNhbmNlbF90YXNrID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSwgb3B0cyA9IHt9KSB7XG4gICAgICAgIHRhcmdldF92YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBjdXJyZW50X3Rva2VuID0ge307XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IG9wdHMuaGFyZCB8fCAoc3ByaW5nLnN0aWZmbmVzcyA+PSAxICYmIHNwcmluZy5kYW1waW5nID49IDEpKSB7XG4gICAgICAgICAgICBjYW5jZWxfdGFzayA9IHRydWU7IC8vIGNhbmNlbCBhbnkgcnVubmluZyBhbmltYXRpb25cbiAgICAgICAgICAgIGxhc3RfdGltZSA9IG5vdygpO1xuICAgICAgICAgICAgbGFzdF92YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IHRhcmdldF92YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0cy5zb2Z0KSB7XG4gICAgICAgICAgICBjb25zdCByYXRlID0gb3B0cy5zb2Z0ID09PSB0cnVlID8gLjUgOiArb3B0cy5zb2Z0O1xuICAgICAgICAgICAgaW52X21hc3NfcmVjb3ZlcnlfcmF0ZSA9IDEgLyAocmF0ZSAqIDYwKTtcbiAgICAgICAgICAgIGludl9tYXNzID0gMDsgLy8gaW5maW5pdGUgbWFzcywgdW5hZmZlY3RlZCBieSBzcHJpbmcgZm9yY2VzXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0YXNrKSB7XG4gICAgICAgICAgICBsYXN0X3RpbWUgPSBub3coKTtcbiAgICAgICAgICAgIGNhbmNlbF90YXNrID0gZmFsc2U7XG4gICAgICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjYW5jZWxfdGFzaykge1xuICAgICAgICAgICAgICAgICAgICBjYW5jZWxfdGFzayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbnZfbWFzcyA9IE1hdGgubWluKGludl9tYXNzICsgaW52X21hc3NfcmVjb3ZlcnlfcmF0ZSwgMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3R4ID0ge1xuICAgICAgICAgICAgICAgICAgICBpbnZfbWFzcyxcbiAgICAgICAgICAgICAgICAgICAgb3B0czogc3ByaW5nLFxuICAgICAgICAgICAgICAgICAgICBzZXR0bGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkdDogKG5vdyAtIGxhc3RfdGltZSkgKiA2MCAvIDEwMDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRfdmFsdWUgPSB0aWNrX3NwcmluZyhjdHgsIGxhc3RfdmFsdWUsIHZhbHVlLCB0YXJnZXRfdmFsdWUpO1xuICAgICAgICAgICAgICAgIGxhc3RfdGltZSA9IG5vdztcbiAgICAgICAgICAgICAgICBsYXN0X3ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gbmV4dF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGN0eC5zZXR0bGVkKVxuICAgICAgICAgICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWN0eC5zZXR0bGVkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bGZpbCA9PiB7XG4gICAgICAgICAgICB0YXNrLnByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRva2VuID09PSBjdXJyZW50X3Rva2VuKVxuICAgICAgICAgICAgICAgICAgICBmdWxmaWwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgc3ByaW5nID0ge1xuICAgICAgICBzZXQsXG4gICAgICAgIHVwZGF0ZTogKGZuLCBvcHRzKSA9PiBzZXQoZm4odGFyZ2V0X3ZhbHVlLCB2YWx1ZSksIG9wdHMpLFxuICAgICAgICBzdWJzY3JpYmU6IHN0b3JlLnN1YnNjcmliZSxcbiAgICAgICAgc3RpZmZuZXNzLFxuICAgICAgICBkYW1waW5nLFxuICAgICAgICBwcmVjaXNpb25cbiAgICB9O1xuICAgIHJldHVybiBzcHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldF9pbnRlcnBvbGF0b3IoYSwgYikge1xuICAgIGlmIChhID09PSBiIHx8IGEgIT09IGEpXG4gICAgICAgIHJldHVybiAoKSA9PiBhO1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgYTtcbiAgICBpZiAodHlwZSAhPT0gdHlwZW9mIGIgfHwgQXJyYXkuaXNBcnJheShhKSAhPT0gQXJyYXkuaXNBcnJheShiKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnRlcnBvbGF0ZSB2YWx1ZXMgb2YgZGlmZmVyZW50IHR5cGUnKTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgY29uc3QgYXJyID0gYi5tYXAoKGJpLCBpKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0X2ludGVycG9sYXRvcihhW2ldLCBiaSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdCA9PiBhcnIubWFwKGZuID0+IGZuKHQpKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmICghYSB8fCAhYilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGNhbm5vdCBiZSBudWxsJyk7XG4gICAgICAgIGlmIChpc19kYXRlKGEpICYmIGlzX2RhdGUoYikpIHtcbiAgICAgICAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgICAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gYiAtIGE7XG4gICAgICAgICAgICByZXR1cm4gdCA9PiBuZXcgRGF0ZShhICsgdCAqIGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYik7XG4gICAgICAgIGNvbnN0IGludGVycG9sYXRvcnMgPSB7fTtcbiAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBpbnRlcnBvbGF0b3JzW2tleV0gPSBnZXRfaW50ZXJwb2xhdG9yKGFba2V5XSwgYltrZXldKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBpbnRlcnBvbGF0b3JzW2tleV0odCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnbnVtYmVyJykge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGIgLSBhO1xuICAgICAgICByZXR1cm4gdCA9PiBhICsgdCAqIGRlbHRhO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBpbnRlcnBvbGF0ZSAke3R5cGV9IHZhbHVlc2ApO1xufVxuZnVuY3Rpb24gdHdlZW5lZCh2YWx1ZSwgZGVmYXVsdHMgPSB7fSkge1xuICAgIGNvbnN0IHN0b3JlID0gd3JpdGFibGUodmFsdWUpO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB0YXJnZXRfdmFsdWUgPSB2YWx1ZTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlLCBvcHRzKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldF92YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgbGV0IHByZXZpb3VzX3Rhc2sgPSB0YXNrO1xuICAgICAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICBsZXQgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gNDAwLCBlYXNpbmcgPSBsaW5lYXIsIGludGVycG9sYXRlID0gZ2V0X2ludGVycG9sYXRvciB9ID0gYXNzaWduKGFzc2lnbih7fSwgZGVmYXVsdHMpLCBvcHRzKTtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBsZXQgZm47XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAobm93IDwgc3RhcnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBpZiAoIXN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICBmbiA9IGludGVycG9sYXRlKHZhbHVlLCBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24odmFsdWUsIG5ld192YWx1ZSk7XG4gICAgICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJldmlvdXNfdGFzaykge1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX3Rhc2suYWJvcnQoKTtcbiAgICAgICAgICAgICAgICBwcmV2aW91c190YXNrID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBub3cgLSBzdGFydDtcbiAgICAgICAgICAgIGlmIChlbGFwc2VkID4gZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IGZuKGVhc2luZyhlbGFwc2VkIC8gZHVyYXRpb24pKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXNrLnByb21pc2U7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHNldCxcbiAgICAgICAgdXBkYXRlOiAoZm4sIG9wdHMpID0+IHNldChmbih0YXJnZXRfdmFsdWUsIHZhbHVlKSwgb3B0cyksXG4gICAgICAgIHN1YnNjcmliZTogc3RvcmUuc3Vic2NyaWJlXG4gICAgfTtcbn1cblxuZXhwb3J0IHsgc3ByaW5nLCB0d2VlbmVkIH07XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBzZXRDb250ZXh0LCBnZXRDb250ZXh0LCBvbk1vdW50LCBvbkRlc3Ryb3ksIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IHsgZ2V0LCB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcbiAgaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnXG5cbiAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gIC8qKiBJbmRleCBvZiB0aGUgYWN0aXZlIHRhYiAoemVyby1iYXNlZClcbiAgICogQHN2ZWx0ZS1wcm9wIHtOdW1iZXJ9IFt2YWx1ZT0wXVxuICAgKiAqL1xuICBleHBvcnQgbGV0IHZhbHVlID0gMFxuXG4gIC8qKiBTaXplIG9mIHRhYnNcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtzaXplXVxuICAgKiBAdmFsdWVzICQkc2l6ZXMkJFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHNpemUgPSAnJ1xuXG4gIC8qKiBQb3NpdGlvbiBvZiB0YWJzIGxpc3QsIGhvcml6b250YWxseS4gQnkgZGVmYXVsdCB0aGV5J3JlIHBvc2l0aW9uZWQgdG8gdGhlIGxlZnRcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtwb3NpdGlvbl1cbiAgICogQHZhbHVlcyBpcy1jZW50ZXJlZCwgaXMtcmlnaHRcbiAgICogKi9cbiAgZXhwb3J0IGxldCBwb3NpdGlvbiA9ICcnXG5cbiAgLyoqIFN0eWxlIG9mIHRhYnNcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtzdHlsZV1cbiAgICogQHZhbHVlcyBpcy1ib3hlZCwgaXMtdG9nZ2xlLCBpcy10b2dnbGUtcm91bmRlZCwgaXMtZnVsbHdpZHRoXG4gICAqICovXG4gIGV4cG9ydCBsZXQgc3R5bGUgPSAnJ1xuXG4gIGV4cG9ydCBsZXQgZXhwYW5kZWQgPSBmYWxzZVxuXG4gIGxldCBhY3RpdmVUYWIgPSAwXG4gICQ6IGNoYW5nZVRhYih2YWx1ZSlcblxuICBjb25zdCB0YWJzID0gd3JpdGFibGUoW10pXG5cbiAgY29uc3QgdGFiQ29uZmlnID0ge1xuICAgIGFjdGl2ZVRhYixcbiAgICB0YWJzLFxuICB9XG5cbiAgc2V0Q29udGV4dCgndGFicycsIHRhYkNvbmZpZylcblxuICAvLyBUaGlzIG9ubHkgcnVucyBhcyB0YWJzIGFyZSBhZGRlZC9yZW1vdmVkXG4gIGNvbnN0IHVuc3Vic2NyaWJlID0gdGFicy5zdWJzY3JpYmUodHMgPT4ge1xuICAgIGlmICh0cy5sZW5ndGggPiAwICYmIHRzLmxlbmd0aCA+IHZhbHVlIC0gMSkge1xuICAgICAgdHMuZm9yRWFjaCh0ID0+IHQuZGVhY3RpdmF0ZSgpKVxuICAgICAgaWYgKHRzW3ZhbHVlXSkgdHNbdmFsdWVdLmFjdGl2YXRlKClcbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gY2hhbmdlVGFiKHRhYk51bWJlcikge1xuICAgIGNvbnN0IHRzID0gZ2V0KHRhYnMpXG4gICAgLy8gTk9URTogY2hhbmdlIHRoaXMgYmFjayB0byB1c2luZyBjaGFuZ2VUYWIgaW5zdGVhZCBvZiBhY3RpdmF0ZS9kZWFjdGl2YXRlIG9uY2UgdHJhbnNpdGlvbnMvYW5pbWF0aW9ucyBhcmUgd29ya2luZ1xuICAgIGlmICh0c1thY3RpdmVUYWJdKSB0c1thY3RpdmVUYWJdLmRlYWN0aXZhdGUoKVxuICAgIGlmICh0c1t0YWJOdW1iZXJdKSB0c1t0YWJOdW1iZXJdLmFjdGl2YXRlKClcbiAgICAvLyB0cy5mb3JFYWNoKHQgPT4gdC5jaGFuZ2VUYWIoeyBmcm9tOiBhY3RpdmVUYWIsIHRvOiB0YWJOdW1iZXIgfSkpXG4gICAgYWN0aXZlVGFiID0gdGFiQ29uZmlnLmFjdGl2ZVRhYiA9IHRhYk51bWJlclxuICAgIGRpc3BhdGNoKCdhY3RpdmVUYWJDaGFuZ2VkJywgdGFiTnVtYmVyKVxuICB9XG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgY2hhbmdlVGFiKGFjdGl2ZVRhYilcbiAgfSlcblxuICBvbkRlc3Ryb3koKCkgPT4ge1xuICAgIHVuc3Vic2NyaWJlKClcbiAgfSlcbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbiAgLnRhYnMtd3JhcHBlciB7XG4gICAgJi5pcy1mdWxsd2lkdGgge1xuICAgICAgLyogVE9ETyAqL1xuICAgIH1cblxuICAgIC50YWItY29udGVudCB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgIGZsZXgtd3JhcDogbm93cmFwO1xuICAgICAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICAgIH1cbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cInRhYnMtd3JhcHBlclwiIGNsYXNzOmlzLWZ1bGx3aWR0aD17ZXhwYW5kZWR9PlxuICA8bmF2IGNsYXNzPVwidGFicyB7c2l6ZX0ge3Bvc2l0aW9ufSB7c3R5bGV9XCI+XG4gICAgPHVsPlxuICAgICAgeyNlYWNoICR0YWJzIGFzIHRhYiwgaW5kZXh9XG4gICAgICAgIDxsaSBjbGFzczppcy1hY3RpdmU9e2luZGV4ID09PSBhY3RpdmVUYWJ9PlxuICAgICAgICAgIDxhIGhyZWYgb246Y2xpY2t8cHJldmVudERlZmF1bHQ9eygpID0+IGNoYW5nZVRhYihpbmRleCl9PlxuICAgICAgICAgICAgeyNpZiB0YWIuaWNvbn1cbiAgICAgICAgICAgICAgPEljb24gcGFjaz17dGFiLmljb25QYWNrfSBpY29uPXt0YWIuaWNvbn0gLz5cbiAgICAgICAgICAgIHsvaWZ9XG5cbiAgICAgICAgICAgIDxzcGFuPnt0YWIubGFiZWx9PC9zcGFuPlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgPC9saT5cbiAgICAgIHsvZWFjaH1cbiAgICA8L3VsPlxuICA8L25hdj5cbiAgPHNlY3Rpb24gY2xhc3M9XCJ0YWItY29udGVudFwiPlxuICAgIDxzbG90IC8+XG4gIDwvc2VjdGlvbj5cbjwvZGl2PlxuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgYmVmb3JlVXBkYXRlLCBzZXRDb250ZXh0LCBnZXRDb250ZXh0LCB0aWNrLCBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJ1xuICBpbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSdcblxuICAvKiogTGFiZWwgZm9yIHRhYlxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gbGFiZWxcbiAgICogKi9cbiAgZXhwb3J0IGxldCBsYWJlbFxuXG4gIC8qKiBTaG93IHRoaXMgaWNvbiBvbiBsZWZ0LXNpZGUgb2YgdGhlIHRhYlxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW2ljb25dXG4gICAqICovXG4gIGV4cG9ydCBsZXQgaWNvbiA9ICcnXG5cbiAgLyoqIEZvbnRhd2Vzb21lIGljb24gcGFjayB0byB1c2UuIEJ5IGRlZmF1bHQgdGhlIDxjb2RlPkljb248L2NvZGU+IGNvbXBvbmVudCB1c2VzIDxjb2RlPmZhczwvY29kZT5cbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtpY29uUGFja11cbiAgICogQHZhbHVlcyA8Y29kZT5mYXM8L2NvZGU+LCA8Y29kZT5mYWI8L2NvZGU+LCBldGMuLi5cbiAgICogKi9cbiAgZXhwb3J0IGxldCBpY29uUGFjayA9ICcnXG5cbiAgbGV0IGFjdGl2ZSA9IGZhbHNlXG5cbiAgbGV0IGVsXG4gIGxldCBpbmRleFxuICBsZXQgc3RhcnRpbmcgPSBmYWxzZVxuICBsZXQgZGlyZWN0aW9uID0gJydcbiAgbGV0IGlzSW4gPSBmYWxzZVxuXG4gIGNvbnN0IHRhYkNvbmZpZyA9IGdldENvbnRleHQoJ3RhYnMnKVxuXG4gIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGFuZ2VUYWIoeyBmcm9tLCB0byB9KSB7XG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm5cblxuICAgIC8vIGNvbnNvbGUubG9nKHsgaW5kZXgsIGZyb20sIHRvIH0sIHRvID09PSBpbmRleClcbiAgICBpZiAoZnJvbSA9PT0gaW5kZXgpIHtcbiAgICAgIC8vIFRyYW5zaXRpb24gb3V0XG4gICAgICBkaXJlY3Rpb24gPSBpbmRleCA8IHRvID8gJ2xlZnQnIDogJ3JpZ2h0J1xuICAgIH0gZWxzZSBpZiAodG8gPT09IGluZGV4KSB7XG4gICAgICAvLyBUcmFuc2l0aW9uIGluOyBzdGFydCBhdCBkaXJlY3Rpb24gd2hlbiByZW5kZXJlZCwgdGhlbiByZW1vdmUgaXRcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdUUkFOU0lUSU9OJywgeyBpbmRleCwgdG8sIGFjdGl2ZSB9KVxuICAgICAgYWN0aXZlID0gdHJ1ZVxuICAgICAgZGlyZWN0aW9uID0gaW5kZXggPiBmcm9tID8gJ3JpZ2h0JyA6ICdsZWZ0J1xuICAgICAgLy8gYXdhaXQgdGljaygpXG4gICAgICAvLyBkaXJlY3Rpb24gPSAnJ1xuICAgIH0gZWxzZSBkaXJlY3Rpb24gPSAnJ1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlSW5kZXgoKSB7XG4gICAgaWYgKCFlbCkgcmV0dXJuXG4gICAgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGVsLnBhcmVudE5vZGUuY2hpbGRyZW4sIGVsKVxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gdHJhbnNpdGlvbmVuZChldmVudCkge1xuICAgIC8vIGNvbnNvbGUubG9nKHsgaW5kZXgsIGFjdGl2ZSwgYWN0aXZlVGFiOiB0YWJDb25maWcuYWN0aXZlVGFiIH0pXG4gICAgLy8gY29uc29sZS5sb2coZXZlbnQudGFyZ2V0KVxuICAgIGFjdGl2ZSA9IGluZGV4ID09PSB0YWJDb25maWcuYWN0aXZlVGFiXG4gICAgYXdhaXQgdGljaygpXG4gICAgZGlyZWN0aW9uID0gJydcbiAgfVxuXG4gIHRhYkNvbmZpZy50YWJzLnN1YnNjcmliZSh0YWJzID0+IHtcbiAgICB1cGRhdGVJbmRleCgpXG4gIH0pXG5cbiAgb25Nb3VudCgoKSA9PiB7XG4gICAgdXBkYXRlSW5kZXgoKVxuXG4gICAgdGFiQ29uZmlnLnRhYnMudXBkYXRlKHRhYnMgPT4gW1xuICAgICAgLi4udGFicyxcbiAgICAgIHtcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIGxhYmVsLFxuICAgICAgICBpY29uLFxuICAgICAgICBpY29uUGFjayxcbiAgICAgICAgYWN0aXZhdGU6ICgpID0+IChhY3RpdmUgPSB0cnVlKSxcbiAgICAgICAgZGVhY3RpdmF0ZTogKCkgPT4gKGFjdGl2ZSA9IGZhbHNlKSxcbiAgICAgICAgY2hhbmdlVGFiLFxuICAgICAgfSxcbiAgICBdKVxuICB9KVxuXG4gIGJlZm9yZVVwZGF0ZShhc3luYyAoKSA9PiB7XG4gICAgaWYgKGluZGV4ID09PSB0YWJDb25maWcuYWN0aXZlVGFiICYmIGRpcmVjdGlvbikge1xuICAgICAgYXdhaXQgdGljaygpXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGlyZWN0aW9uID0gJydcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAvLyBOT1RFOiBhZGQgdHJhbnNpdGlvbnMvYW5pbWF0aW9ucyBiYWNrIG9uY2UgdGhleSdyZSB3b3JraW5nXG4gIC50YWIge1xuICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgZmxleDogMSAwIDEwMCU7XG4gICAgLy8gd2lsbC1jaGFuZ2U6IHRyYW5zZm9ybTtcbiAgICAvLyB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gNDAwbXMgZWFzZS1pbjtcblxuICAgICYuaXMtYWN0aXZlIHtcbiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgIC8vIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwKTtcbiAgICB9XG5cbiAgICAvLyAmLnN0YXJ0aW5nIHtcbiAgICAvLyAgIHRyYW5zaXRpb246IG5vbmU7XG4gICAgLy8gfVxuXG4gICAgLy8gJi5sZWZ0IHtcbiAgICAvLyAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7XG4gICAgLy8gfVxuXG4gICAgLy8gJi5yaWdodCB7XG4gICAgLy8gICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTAwJSk7XG4gICAgLy8gfVxuXG4gICAgLy8gJi5zdGFydGluZyB7XG4gICAgLy8gICB0cmFuc2l0aW9uOiBub25lO1xuICAgIC8vIH1cbiAgfVxuPC9zdHlsZT5cblxuPGRpdlxuICBjbGFzcz1cInRhYiB7ZGlyZWN0aW9ufVwiXG4gIGNsYXNzOmlzLWFjdGl2ZT17YWN0aXZlfVxuICBiaW5kOnRoaXM9e2VsfVxuICBhcmlhLWhpZGRlbj17IWFjdGl2ZX1cbiAgb246dHJhbnNpdGlvbmVuZD17dHJhbnNpdGlvbmVuZH0+XG4gIDxzbG90IHtsYWJlbH0ge2ljb25QYWNrfSB7aWNvbn0gLz5cbjwvZGl2PlxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHRhZ3MgPSB3cml0YWJsZSh7XHJcbiAgZmlsdGVyVXJsOiB0cnVlLFxyXG4gIF9fdGFnMToge30sXHJcbiAgX190YWcyOiB7fSxcclxuICBfX3RhZzM6IHt9LFxyXG59KTtcclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBoZWlnaHQ7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoKSB7XHJcbiAgcmV0dXJuIGhlaWdodCA/IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke2hlaWdodH1weCk7YCA6ICcnO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInZib3ggbGVmdFwiPlxyXG4gIDxkaXYgY2xhc3M9XCJ0YWJsZS1jb250YWluZXJcIiBzdHlsZT1cIntyZXNpemUoKX1cIj5cclxuICAgIDxzbG90Pjwvc2xvdD5cclxuICA8L2Rpdj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi52Ym94IHtcclxuICBmbGV4OiBhdXRvO1xyXG4gIGRpc3BsYXk6IGZsZXg7XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbn1cclxuLnZib3gubGVmdCB7XHJcbiAgd2lkdGg6IDEwMCU7XHJcbn1cclxuLnRhYmxlLWNvbnRhaW5lciB7XHJcbiAgb3ZlcmZsb3c6IGF1dG87XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcbmxldCBhdXRvU2F2ZSA9IHRydWU7XG5cbmZ1bmN0aW9uIGJ0blJlc2V0KGUpIHtcbiAgd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzLnJvdXRlVGFibGUoKTtcbn1cblxuZnVuY3Rpb24gYnRuU2F2ZShlKSB7XG4gIGNvbnN0IHtfX3RhZzEsIF9fdGFnMiwgX190YWczfSA9IHdpbmRvdy5taXRtO1xuICBjb25zdCB0YWdzID0ge1xuICAgIF9fdGFnMSxcbiAgICBfX3RhZzIsXG4gICAgX190YWczLFxuICB9O1xuICB3c19fc2VuZCgnc2F2ZVRhZ3MnLCAkdGFncyk7XG59XG5cbm9uTW91bnQoKCkgPT4ge1xuICBsZXQgZGVib3VuY2UgPSBmYWxzZTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNldC10YWdzJykub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCB7dmFsdWV9ID0gZS50YXJnZXQuYXR0cmlidXRlcy50eXBlO1xuICAgIGlmIChhdXRvU2F2ZSAmJiB2YWx1ZT09PSdjaGVja2JveCcpIHtcbiAgICAgIGlmIChkZWJvdW5jZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2UpO1xuICAgICAgfVxuICAgICAgZGVib3VuY2UgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGVib3VuY2UgPSBmYWxzZTtcbiAgICAgICAgYnRuU2F2ZShlKTtcbiAgICAgIH0sNTApXG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgZS50YXJnZXQpO1xuICB9O1xuXG4gIHdpbmRvdy5taXRtLmJyb3dzZXIuY2hnVXJsX2V2ZW50cy50YWdzRXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnVXBkYXRlIHRhZ3MhJyk7XG4gICAgdGFncy5zZXQoey4uLiR0YWdzfSk7XG4gIH1cbn0pO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcbiAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLmZpbHRlclVybH0vPlxuICAgIEFjdGl2ZXVybFxuICA8L2xhYmVsPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blJlc2V0fVwiIGRpc2FibGVkPXthdXRvU2F2ZX0+UmVzZXQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5TYXZlfVwiICBkaXNhYmxlZD17YXV0b1NhdmV9PlNhdmU8L2J1dHRvbj5cbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxuICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgIGJpbmQ6Y2hlY2tlZD17YXV0b1NhdmV9Lz5cbiAgICBBdXRvc2F2ZVxuICA8L2xhYmVsPlxuICAuXG48L2Rpdj5cblxuPHN0eWxlPlxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbi5jaGVja2VyIHtcbiAgY29sb3I6IGNob2NvbGF0ZTtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIGNsaWNrZWQoZSkge1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IHtfX3RhZzEsX190YWcyLF9fdGFnM30gPSAkdGFncztcclxuICAgIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XHJcbiAgICBjb25zdCBmbGFnID0gX190YWcxW2l0ZW1dO1xyXG4gICAgY29uc29sZS5sb2coJ2UnLCBmbGFnKTtcclxuXHJcbiAgICBmb3IgKGxldCBucyBpbiBfX3RhZzIpIHtcclxuICAgICAgY29uc3QgbmFtZXNwYWNlID0gX190YWcyW25zXTtcclxuICAgICAgZm9yIChsZXQgaXRtIGluIG5hbWVzcGFjZSkge1xyXG4gICAgICAgIGNvbnN0IHR5cDIgPSBpdG0uc3BsaXQoJzonKVsxXSB8fCBpdG07XHJcbiAgICAgICAgaWYgKGl0ZW09PT10eXAyKSB7XHJcbiAgICAgICAgICBuYW1lc3BhY2VbaXRtXSA9IGZsYWc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgbnMgaW4gX190YWczKSB7XHJcbiAgICAgIGNvbnN0IHVybHMgPSBfX3RhZzNbbnNdO1xyXG4gICAgICBmb3IgKGxldCB1cmwgaW4gdXJscykge1xyXG4gICAgICAgIGNvbnN0IHR5cHMgPSB1cmxzW3VybF07XHJcbiAgICAgICAgZm9yIChsZXQgdHlwIGluIHR5cHMpIHtcclxuICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IHR5cHNbdHlwXTtcclxuICAgICAgICAgIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW09PT1pdG0pIHtcclxuICAgICAgICAgICAgICBuYW1lc3BhY2VbaXRtXSA9IGZsYWc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnN0IHtmaWx0ZXJVcmx9ID0gJHRhZ3M7XHJcbiAgICB0YWdzLnNldCh7XHJcbiAgICAgIGZpbHRlclVybCxcclxuICAgICAgX190YWcxLFxyXG4gICAgICBfX3RhZzIsXHJcbiAgICAgIF9fdGFnMyxcclxuICAgIH0pXHJcbiAgfSwgMTApO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyhpdGVtKSB7XHJcbiAgcmV0dXJuICR0YWdzLl9fdGFnMVtpdGVtXSA/ICdydGFnIHNsYycgOiAncnRhZyc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxpc3RUYWdzKHRhZ3MpIHtcclxuICBjb25zdCB7dG9SZWdleH0gPSB3aW5kb3cubWl0bS5mbjtcclxuICBjb25zdCBsaXN0ID0ge307XHJcbiAgZnVuY3Rpb24gYWRkKG5zKSB7XHJcbiAgICBmb3IgKGxldCBpZCBpbiB0YWdzLl9fdGFnMltuc10pIHtcclxuICAgICAgY29uc3QgW2ssdl0gPSBpZC5zcGxpdCgnOicpO1xyXG4gICAgICBsaXN0W3Z8fGtdID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgaWYgKHRhZ3MuZmlsdGVyVXJsKSB7XHJcbiAgICBmb3IgKGxldCBucyBpbiB0YWdzLl9fdGFnMikge1xyXG4gICAgICBjb25zdCByZ3ggPSB0b1JlZ2V4KG5zLnJlcGxhY2UoL34vLCdbXi5dKicpKTtcclxuICAgICAgaWYgKG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSkge1xyXG4gICAgICAgIGFkZChucyk7XHJcbiAgICAgICAgYWRkKCdfZ2xvYmFsXycpO1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhsaXN0KS5zb3J0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBbXTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRhZ3MuX190YWcxKTtcclxuICB9XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48dGQ+XHJcbiAgPGRpdiBjbGFzcz1cImJvcmRlclwiPlxyXG4gICAgeyNlYWNoIGxpc3RUYWdzKCR0YWdzKSBhcyBpdGVtfVxyXG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMCB7cm91dGV0YWcoaXRlbSl9XCI+XHJcbiAgICAgIDxsYWJlbD5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XHJcbiAgICAgICAgb246Y2xpY2s9e2NsaWNrZWR9IFxyXG4gICAgICAgIGJpbmQ6Y2hlY2tlZD17JHRhZ3MuX190YWcxW2l0ZW1dfS8+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJiaWdcIj57aXRlbX08L3NwYW4+XHJcbiAgICAgIDwvbGFiZWw+XHJcbiAgICA8L2Rpdj5cclxuICAgIHsvZWFjaH1cclxuICA8L2Rpdj5cclxuPC90ZD5cclxuXHJcbjxzdHlsZT5cclxuLmJvcmRlciB7XHJcbiAgYm9yZGVyOiAxcHggZG90dGVkO1xyXG59XHJcbi5zcGFjZTAge1xyXG4gIGZvbnQtc2l6ZTogbWVkaXVtO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgY29sb3I6IGRhcmtibHVlO1xyXG4gIC8qIGJhY2tncm91bmQ6IGRlZXBza3libHVlOyAqL1xyXG59XHJcbi5zcGFjZTAgLmJpZyB7XHJcbiAgbWFyZ2luLWxlZnQ6IC00cHg7XHJcbn1cclxuLnJ0YWcge1xyXG4gIGNvbG9yOiBncmV5O1xyXG4gIGZvbnQtc3R5bGU6IGl0YWxpYztcclxuICAvKiBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTsgKi9cclxufVxyXG4ucnRhZy5zbGMge1xyXG4gIGNvbG9yOiBncmVlbjtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW1zO1xyXG5leHBvcnQgbGV0IG5zO1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qge19fdGFnMSxfX3RhZzIsX190YWczfSA9ICR0YWdzO1xyXG4gICAgY29uc3Qge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICAgIGNvbnN0IGZsYWcgPSBfX3RhZzJbbnNdW2l0ZW1dO1xyXG4gICAgY29uc29sZS5sb2coJ2UnLCBmbGFnKTtcclxuXHJcbiAgICBjb25zdCB1cmxzID0gX190YWczW25zXTtcclxuICAgIGZvciAobGV0IHVybCBpbiB1cmxzKSB7XHJcbiAgICAgIGNvbnN0IHR5cHMgPSB1cmxzW3VybF07XHJcbiAgICAgIGZvciAobGV0IHR5cCBpbiB0eXBzKSB7XHJcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlID0gdHlwc1t0eXBdO1xyXG4gICAgICAgIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcclxuICAgICAgICAgIGlmIChpdGVtPT09aXRtKSB7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZVtpdG1dID0gZmxhZztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnN0IHtmaWx0ZXJVcmx9ID0gJHRhZ3M7XHJcbiAgICB0YWdzLnNldCh7XHJcbiAgICAgIGZpbHRlclVybCxcclxuICAgICAgX190YWcxLFxyXG4gICAgICBfX3RhZzIsXHJcbiAgICAgIF9fdGFnMyxcclxuICAgIH0pXHJcbiAgfSwgMTApO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyhpdGVtKSB7XHJcbiAgaWYgKGl0ZW0ubWF0Y2goJzonKSkge1xyXG4gICAgcmV0dXJuIGl0ZW1zW2l0ZW1dID8gJ3J0YWcgc2xjJyA6ICdydGFnJztcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGl0ZW1zW2l0ZW1dID8gJ3N0YWcgc2xjJyA6ICcnO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXRlbWxpc3QoaXRlbXMpIHtcclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhpdGVtcykuc29ydCgoYSxiKSA9PiB7XHJcbiAgICBjb25zdCBbazEsdjFdID0gYS5zcGxpdCgnOicpO1xyXG4gICAgY29uc3QgW2syLHYyXSA9IGIuc3BsaXQoJzonKTtcclxuICAgIGEgPSB2MSB8fCBrMTtcclxuICAgIGIgPSB2MiB8fCBrMjtcclxuICAgIGlmIChhPGIpIHJldHVybiAtMTtcclxuICAgIGlmIChhPmIpIHJldHVybiAxO1xyXG4gICAgcmV0dXJuIDA7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGFycjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvdyhpdGVtKSB7XHJcbiAgY29uc3QgW2ssdl0gPSBpdGVtLnNwbGl0KCc6Jyk7XHJcbiAgaWYgKHY9PT11bmRlZmluZWQpIHJldHVybiBrO1xyXG4gIHJldHVybiBgJHt2fXske2t9fWA7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwiYm9yZGVyXCI+XHJcbiAgPGRpdiBjbGFzcz1cInNwYWNlMFwiPlt7bnM9PT0nX2dsb2JhbF8nID8gJyAqICcgOiBuc31dPC9kaXY+XHJcbiAgeyNlYWNoIGl0ZW1saXN0KGl0ZW1zKSBhcyBpdGVtfVxyXG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMSB7cm91dGV0YWcoaXRlbSl9XCI+XHJcbiAgICAgIDxsYWJlbD5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XHJcbiAgICAgICAgb246Y2xpY2s9e2NsaWNrZWR9IFxyXG4gICAgICAgIGJpbmQ6Y2hlY2tlZD17aXRlbXNbaXRlbV19Lz5cclxuICAgICAgICA8c3BhbiBjbGFzcz1cIntpdGVtLm1hdGNoKCc6JykgPyAnYmlnJyA6ICcnfVwiPntzaG93KGl0ZW0pfTwvc3Bhbj5cclxuICAgICAgPC9sYWJlbD5cclxuICAgIDwvZGl2PlxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5ib3JkZXIge1xyXG4gIGJvcmRlcjogMXB4IGdyZXkgc29saWQ7XHJcbn1cclxuLnNwYWNlMCB7XHJcbiAgbGluZS1oZWlnaHQ6IDEuNTtcclxuICBmb250LXNpemU6IG1lZGl1bTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBkYXJrYmx1ZTtcclxuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XHJcbn1cclxuLnNwYWNlMSB7XHJcbiAgY29sb3I6IGdyZXk7XHJcbiAgcGFkZGluZy1sZWZ0OiAxMHB4O1xyXG59XHJcbi5zcGFjZTEgLmJpZyB7XHJcbiAgbWFyZ2luLWxlZnQ6IC00cHg7XHJcbn1cclxuLnJ0YWcge1xyXG4gIGNvbG9yOiBjYWRldGJsdWU7XHJcbiAgZm9udC1zaXplOiBtZWRpdW07XHJcbiAgZm9udC1zdHlsZTogaXRhbGljO1xyXG4gIGJhY2tncm91bmQtY29sb3I6IGJlaWdlO1xyXG59XHJcbi5ydGFnLnNsYyB7XHJcbiAgY29sb3I6IHJlZDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbi5zdGFnLnNsYyB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IFRhZ3MyMSBmcm9tICcuL1RhZ3MyXzEuc3ZlbHRlJztcclxuXHJcbmZ1bmN0aW9uIG9uZVNpdGUobnMpIHtcclxuICBjb25zdCB7dG9SZWdleH0gPSB3aW5kb3cubWl0bS5mbjtcclxuICBpZiAoJHRhZ3MuZmlsdGVyVXJsKSB7XHJcbiAgICBjb25zdCByZ3ggPSB0b1JlZ2V4KG5zLnJlcGxhY2UoL34vLCdbXi5dKicpKTtcclxuICAgIHJldHVybiBtaXRtLmJyb3dzZXIuYWN0aXZlVXJsLm1hdGNoKHJneCkgfHwgbnM9PT0nX2dsb2JhbF8nO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48dGQ+XHJcbnsjZWFjaCBPYmplY3Qua2V5cygkdGFncy5fX3RhZzIpIGFzIG5zfVxyXG4gIHsjaWYgb25lU2l0ZShucyl9XHJcbiAgICA8VGFnczIxIGl0ZW1zPXskdGFncy5fX3RhZzJbbnNdfSBucz17bnN9Lz5cclxuICB7L2lmfVxyXG57L2VhY2h9XHJcbjwvdGQ+XHJcblxyXG48c3R5bGU+XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW1zO1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICAgIGNvbnNvbGUubG9nKCdlJywgaXRlbXNbaXRlbV0pO1xyXG4gIH0sIDUwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcm91dGV0YWcoaXRlbSkge1xyXG4gIHJldHVybiBpdGVtc1tpdGVtXSA/ICdydGFnIHNsYycgOiAncnRhZyc7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG57I2VhY2ggT2JqZWN0LmtleXMoaXRlbXMpLnNvcnQoKSBhcyBpdGVtfVxyXG4gIDxkaXYgY2xhc3M9XCJzcGFjZTMge3JvdXRldGFnKGl0ZW0pfVwiPlxyXG4gICAgPGxhYmVsPlxyXG4gICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgZGF0YS1pdGVtPXtpdGVtfVxyXG4gICAgICBvbjpjbGljaz17Y2xpY2tlZH0gXHJcbiAgICAgIGJpbmQ6Y2hlY2tlZD17aXRlbXNbaXRlbV19Lz5cclxuICAgICAge2l0ZW19XHJcbiAgICA8L2xhYmVsPlxyXG4gIDwvZGl2PlxyXG57L2VhY2h9XHJcblxyXG48c3R5bGU+XHJcbi5zcGFjZTMge1xyXG4gIHBhZGRpbmctbGVmdDogMzBweDtcclxufVxyXG5cclxuLnJ0YWcge1xyXG4gIGNvbG9yOiBjYWRldGJsdWU7XHJcbiAgZm9udC1zaXplOiBtZWRpdW07XHJcbiAgZm9udC1zdHlsZTogaXRhbGljO1xyXG4gIGJhY2tncm91bmQtY29sb3I6IGJlaWdlO1xyXG59XHJcbi5ydGFnLnNsYyB7XHJcbiAgY29sb3I6IHJlZDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBUYWdzMzMgZnJvbSAnLi9UYWdzM18zLnN2ZWx0ZSc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW1zO1xyXG5leHBvcnQgbGV0IGtleTtcclxuXHJcbjwvc2NyaXB0PlxyXG5cclxueyNlYWNoIE9iamVjdC5rZXlzKGl0ZW1zKS5maWx0ZXIoeD0+eFswXSE9PSc6JykgYXMgaXRlbX1cclxuICA8ZGl2IGNsYXNzPVwic3BhY2UyXCI+e2l0ZW19OntpdGVtc1tgOiR7aXRlbX1gXX08L2Rpdj5cclxuICA8VGFnczMzIGl0ZW1zPXtpdGVtc1tpdGVtXX0vPlxyXG57L2VhY2h9XHJcblxyXG48c3R5bGU+XHJcbi5zcGFjZTIge1xyXG4gIHBhZGRpbmctbGVmdDogMjBweDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBncmVlbjtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgVGFnczMyIGZyb20gJy4vVGFnczNfMi5zdmVsdGUnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtcztcclxuZXhwb3J0IGxldCBrZXk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cImJvcmRlclwiPlxyXG4gIDxkaXYgY2xhc3M9XCJzcGFjZTBcIj5be2tleT09PSdfZ2xvYmFsXycgPyAnICogJyA6IGtleX1dPC9kaXY+XHJcbiAgeyNlYWNoIE9iamVjdC5rZXlzKGl0ZW1zKSBhcyBpdGVtfVxyXG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMVwiPntpdGVtfTwvZGl2PlxyXG4gICAgPFRhZ3MzMiBpdGVtcz17aXRlbXNbaXRlbV19IGtleT17aXRlbX0vPlxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5ib3JkZXIge1xyXG4gIGJvcmRlcjogMXB4IHNvbGlkO1xyXG59XHJcbi5zcGFjZTAge1xyXG4gIGxpbmUtaGVpZ2h0OiAxLjU7XHJcbiAgZm9udC1zaXplOiBtZWRpdW07XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBjb2xvcjogZGFya2JsdWU7XHJcbiAgYmFja2dyb3VuZDogbGlnaHRncmV5O1xyXG59XHJcbi5zcGFjZTEge1xyXG4gIHBhZGRpbmctbGVmdDogMTBweDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBibHVldmlvbGV0XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IFRhZ3MzMSBmcm9tICcuL1RhZ3MzXzEuc3ZlbHRlJztcclxuXHJcbmZ1bmN0aW9uIGlzdGFnKG5zKSB7XHJcbiAgY29uc3Qge3RvUmVnZXh9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgY29uc3QgYXJyID0gT2JqZWN0LmtleXMoJHRhZ3MuX190YWcyW25zXSk7XHJcbiAgY29uc3Qgb2sgPSBhcnIuZmlsdGVyKHg9PiF4Lm1hdGNoKCc6JykpLmxlbmd0aDtcclxuICBpZiAoJHRhZ3MuZmlsdGVyVXJsKSB7XHJcbiAgICBjb25zdCByZ3ggPSB0b1JlZ2V4KG5zLnJlcGxhY2UoL34vLCdbXi5dKicpKTtcclxuICAgIHJldHVybiBvayAmJiBtaXRtLmJyb3dzZXIuYWN0aXZlVXJsLm1hdGNoKHJneCkgfHwgbnM9PT0nX2dsb2JhbF8nO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gb2s7XHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRkPlxyXG57I2VhY2ggT2JqZWN0LmtleXMoJHRhZ3MuX190YWczKSBhcyBpdGVtfVxyXG4gIHsjaWYgaXN0YWcoaXRlbSl9XHJcbiAgICA8VGFnczMxIGl0ZW1zPXskdGFncy5fX3RhZzNbaXRlbV19IGtleT17aXRlbX0vPlxyXG4gIHsvaWZ9XHJcbnsvZWFjaH1cclxuPC90ZD5cclxuXHJcbjxzdHlsZT5cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IFRhZ3MxIGZyb20gJy4vVGFnczFfLnN2ZWx0ZSc7IFxuaW1wb3J0IFRhZ3MyIGZyb20gJy4vVGFnczJfLnN2ZWx0ZSc7IFxuaW1wb3J0IFRhZ3MzIGZyb20gJy4vVGFnczNfLnN2ZWx0ZSc7IFxuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcblxufSk7XG5cbndpbmRvdy5taXRtLmZpbGVzLmdldFJvdXRlX2V2ZW50cy50YWdzVGFibGUgPSAoKSA9PiB7XG4gIC8vIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcbiAgY29uc29sZS5sb2coJ3RhZ3NUYWJsZSBnZXR0aW5nIGNhbGxlZCEhIScpO1xuICBjb25zdCB7X190YWcxLCBfX3RhZzIsIF9fdGFnM30gPSB3aW5kb3cubWl0bTtcbiAgY29uc3Qge2ZpbHRlclVybH0gPSAkdGFncztcbiAgdGFncy5zZXQoe1xuICAgIGZpbHRlclVybCxcbiAgICBfX3RhZzEsXG4gICAgX190YWcyLFxuICAgIF9fdGFnMyxcbiAgfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljPlxuICAgIDxCSGVhZGVyPi1UYWdzLTwvQkhlYWRlcj5cbiAgICA8QlRhYmxlPlxuICAgICAgPHRyIGNsYXNzPVwic2V0LXRhZ3NcIj5cbiAgICAgICAgPFRhZ3MxLz5cbiAgICAgICAgPFRhZ3MyLz5cbiAgICAgICAgPFRhZ3MzLz5cbiAgICAgIDwvdHI+XG4gICAgPC9CVGFibGU+XG4gIDwvQlN0YXRpYz5cbjwvZGl2PlxuXG48c3R5bGU+XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbjwvc3R5bGU+XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSc7XG5cbmV4cG9ydCBjb25zdCBsb2dzdG9yZSA9IHdyaXRhYmxlKHtcbiAgcmVzcEhlYWRlcjoge30sXG4gIHJlc3BvbnNlOiAnJyxcbiAgaGVhZGVyczogJycsXG4gIGxvZ2lkOiAnJyxcbiAgdGl0bGU6ICcnLFxuICBwYXRoOiAnJyxcbiAgdXJsOiAnJyxcbiAgZXh0OiAnJyxcbn0pO1xuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnO1xuXG5leHBvcnQgY29uc3QgY2xpZW50ID0gd3JpdGFibGUoe1xuICAuLi53aW5kb3cubWl0bS5jbGllbnQsXG59KTtcbiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgaGVpZ2h0O1xyXG5cclxuaW1wb3J0IHtzcHJpbmd9IGZyb20gJ3N2ZWx0ZS9tb3Rpb24nXHJcbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSc7XHJcblxyXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG4gIFxyXG5sZXQgZHJvcFRhcmdldDtcclxuZnVuY3Rpb24gZHJhZ2dhYmxlKG5vZGUsIHBhcmFtcykge1xyXG4gIFxyXG4gIGxldCBsYXN0WDtcclxuICBsZXQgcGFyZW50WDtcclxuICBsZXQgb2Zmc2V0WCA9IDBcclxuICBjb25zdCBvZmZzZXQgPSBzcHJpbmcoe3g6IG9mZnNldFgsIHk6IDB9LCB7XHJcblx0XHRzdGlmZm5lc3M6IDAuMixcclxuXHRcdGRhbXBpbmc6IDAuNFxyXG5cdH0pO1xyXG5cclxuICBvZmZzZXQuc3Vic2NyaWJlKG9mZnNldCA9PiB7XHJcbiAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcbiAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgIGNvbnN0IGxlZnQgPSBwYXJlbnRYICsgb2Zmc2V0LnhcclxuICAgICAgcGFyZW50LnN0eWxlLmxlZnQgPSBgJHtsZWZ0fXB4YDtcclxuICAgICAgcGFyZW50LnN0eWxlLndpZHRoID0gYGNhbGMoMTAwdncgLSAke2xlZnR9cHhgO1xyXG4gICAgfVxyXG4gIH0pXHJcblxyXG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duKTtcclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2Vkb3duKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRsYXN0WCA9IGV2ZW50LmNsaWVudFg7XHJcbiAgICBwYXJlbnRYID0gbm9kZS5wYXJlbnROb2RlLm9mZnNldExlZnQ7XHJcbiAgICBub2RlLmNsYXNzTGlzdC5hZGQoJ2RyYWdnZWQnKVxyXG5cclxuICAgIGRpc3BhdGNoKCdkcmFnc3RhcnQnLCB7dGFyZ2V0Om5vZGUsIGxhc3RYfSk7XHJcblxyXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSk7XHJcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNldXApO1xyXG5cdH1cclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2Vtb3ZlKGUpIHtcclxuICAgIG9mZnNldFggKz0gZS5jbGllbnRYIC0gbGFzdFg7XHJcbiAgICBvZmZzZXQuc2V0KHt4OiBvZmZzZXRYLCB5OiAwfSk7XHJcbiAgICBcclxuXHRcdGxhc3RYID0gZS5jbGllbnRYO1xyXG4gICAgZGlzcGF0Y2goJ2RyYWcnLCB7dGFyZ2V0Om5vZGUsIGxlZnQ6IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0fSk7XHJcblx0fVxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZXVwKGV2ZW50KSB7XHJcbiAgICBvZmZzZXRYID0gMDtcclxuICAgIGRyb3BUYXJnZXQgPSBudWxsO1xyXG4gICAgbGFzdFggPSB1bmRlZmluZWQ7XHJcbiAgICBwYXJlbnRYID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIG5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnZHJhZ2dlZCcpO1xyXG4gICAgb2Zmc2V0LnNldCh7eDogbm9kZS5vZmZzZXRMZWZ0LCB5OiAwfSk7XHJcbiAgICBkaXNwYXRjaCgnZHJhZ2VuZCcsIHt0YXJnZXQ6IG5vZGUsIGxlZnQ6IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0fSk7XHJcbiAgICBcclxuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUpO1xyXG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVNb3VzZXVwKTtcclxuXHR9XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuXHRcdGRlc3Ryb3koKSB7XHJcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcclxuICByZXR1cm4gaGVpZ2h0ID8gYGhlaWdodDogY2FsYygxMDB2aCAtICR7aGVpZ2h0fXB4KTtgIDogJyc7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwicmVzaXplXCIgdXNlOmRyYWdnYWJsZSBzdHlsZT1cIntyZXNpemUoKX1cIj4gPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5yZXNpemUge1xyXG4gIHdpZHRoOiAycHg7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xyXG4gIGJhY2tncm91bmQtY29sb3I6ICNmM2M0OWQ7XHJcbiAgY3Vyc29yOiBjb2wtcmVzaXplO1xyXG4gIHotaW5kZXg6IDU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuZXhwb3J0IGxldCBsZWZ0O1xuZXhwb3J0IGxldCBoZWlnaHQ7XG5cbmltcG9ydCB7Y3JlYXRlRXZlbnREaXNwYXRjaGVyfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IFNwbGl0dGVyIGZyb20gJy4vU3BsaXR0ZXIuc3ZlbHRlJztcblxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblxuZnVuY3Rpb24gcmVzaXplKCkge1xuICBsZXQgY3NzID0gYGxlZnQ6ICR7bGVmdH1weDt3aWR0aDogY2FsYygxMDB2dyAtICR7bGVmdH1weCk7YFxuICBpZiAoaGVpZ2h0KSB7XG4gICAgY3NzICs9IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke2hlaWdodH1weCk7YDtcbiAgfVxuICByZXR1cm4gY3NzO1xufVxuXG5mdW5jdGlvbiBkcmFnZ2VkKGUpIHtcbiAgZGlzcGF0Y2goJ2RyYWcnLCAgZS5kZXRhaWwpO1xufVxuXG5mdW5jdGlvbiBkcmFnZW5kKGUpIHtcbiAgZGlzcGF0Y2goJ2RyYWdlbmQnLCAgZS5kZXRhaWwpO1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ2Ym94IHJpZ2h0XCIgc3R5bGU9XCJ7cmVzaXplKCl9XCI+XG4gIDxTcGxpdHRlciBvbjpkcmFnPXtkcmFnZ2VkfSBvbjpkcmFnZW5kPXtkcmFnZW5kfSBoZWlnaHQ9XCJ7aGVpZ2h0fVwiLz5cbiAgPHNsb3Q+PC9zbG90PlxuPC9kaXY+XG5cbjxzdHlsZT5cbi52Ym94IHtcbiAgZmxleDogYXV0bztcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuLnZib3gucmlnaHQge1xuICByaWdodDogMDtcbiAgbGVmdDogMTYzcHg7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgYmFja2dyb3VuZDogI2YxZjdmN2UzO1xuICB3aWR0aDogY2FsYygxMDB2dyAtIDE2M3B4KTtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XG4gIG92ZXJmbG93OiBoaWRkZW47XG59XG5cblxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5cbmZ1bmN0aW9uIGJ0bkNsZWFyKGUpIHtcbiAgd3NfX3NlbmQoJ2NsZWFyTG9ncycsIHticm93c2VyTmFtZTogJ2Nocm9taXVtJ30sIGRhdGEgPT4ge1xuICAgIC8vIGxvZ3MgdmlldyB3aWxsIGJlIGNsb3NlIHdoZW4gLmxvZ19ldmVudHMuTG9nc1RhYmxlXG4gICAgLy8gbG9nc3RvcmUuc2V0KCkgdG8gZW1wdHkgb24gVGFibGUuc3ZlbHRlIFxuICAgIHdpbmRvdy5taXRtLmNsaWVudC5jbGVhciA9IHRydWU7XG4gICAgY29uc29sZS5sb2coJ0RvbmUgQ2xlYXIhJyk7XG4gIH0pO1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG48YnV0dG9uIG9uOmNsaWNrPVwie2J0bkNsZWFyfVwiPlxuPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHZpZXdCb3g9XCIwIDAgNTEyIDUxMlwiPjxwYXRoIHN0eWxlPVwiZmlsbDpyZWRcIiBkPVwiTTI1NiA4QzExOS4wMzQgOCA4IDExOS4wMzMgOCAyNTZzMTExLjAzNCAyNDggMjQ4IDI0OCAyNDgtMTExLjAzNCAyNDgtMjQ4UzM5Mi45NjcgOCAyNTYgOHptMTMwLjEwOCAxMTcuODkyYzY1LjQ0OCA2NS40NDggNzAgMTY1LjQ4MSAyMC42NzcgMjM1LjYzN0wxNTAuNDcgMTA1LjIxNmM3MC4yMDQtNDkuMzU2IDE3MC4yMjYtNDQuNzM1IDIzNS42MzggMjAuNjc2ek0xMjUuODkyIDM4Ni4xMDhjLTY1LjQ0OC02NS40NDgtNzAtMTY1LjQ4MS0yMC42NzctMjM1LjYzN0wzNjEuNTMgNDA2Ljc4NGMtNzAuMjAzIDQ5LjM1Ni0xNzAuMjI2IDQ0LjczNi0yMzUuNjM4LTIwLjY3NnpcIi8+PC9zdmc+XG48L2J1dHRvbj5cbjwvZGl2PlxuXG48c3R5bGU+XG4uYnRuLWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbWFyZ2luLXRvcDogLTFweDtcbiAgbGVmdDogNzBweDtcbiAgdG9wOiAxcHg7XG59XG5idXR0b24ge1xuICBib3JkZXI6IDA7XG4gIHdpZHRoOiAyNnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5leHBvcnQgbGV0IGl0ZW07XG5cbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSAnLi4vb3RoZXIvc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIGxvZ3N0b3JlLnNldCh7XG4gICAgcmVzcEhlYWRlcjoge30sXG4gICAgcmVzcG9uc2U6ICcnLFxuICAgIGhlYWRlcnM6ICcnLFxuICAgIGxvZ2lkOiAnJyxcbiAgICB0aXRsZTogJycsXG4gICAgcGF0aDogJycsXG4gICAgdXJsOiAnJyxcbiAgICBleHQ6ICcnLFxuICB9KVxufVxuXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xuICBsZXQge2xvZ2lkfSA9IGUuY3VycmVudFRhcmdldC5kYXRhc2V0O1xuICBpZiAobG9naWQ9PT0kbG9nc3RvcmUubG9naWQpIHtcbiAgICBlbXB0eSgpO1xuICB9IGVsc2Uge1xuICAgIGVtcHR5KCk7XG4gICAgY29uc3QgbyA9IHdpbmRvdy5taXRtLmZpbGVzLmxvZ1tsb2dpZF07XG4gICAgY29uc3Qgc3JjID0ge1xuICAgICAgcmVzcEhlYWRlcjogby5yZXNwSGVhZGVyLFxuICAgICAgcmVzcG9uc2U6ICc8ZW1wdHk+JyxcbiAgICAgIGhlYWRlcnM6ICc8ZW1wdHk+JyxcbiAgICAgIGxvZ2lkOiBsb2dpZCxcbiAgICAgIHRpdGxlOiBvLnRpdGxlLFxuICAgICAgcGF0aDogby5wYXRoLFxuICAgICAgdXJsOiBsb2dpZC5yZXBsYWNlKC9eLitcXC5taXRtLXBsYXkvLCdodHRwczovL2xvY2FsaG9zdDozMDAxJyksXG4gICAgICBleHQ6IG8uZXh0LFxuICAgIH1cbiAgICBpZiAoby50aXRsZS5tYXRjaCgnLnBuZycpKSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbG9nc3RvcmUudXBkYXRlKG4gPT4gc3JjKVxuICAgICAgfSwgMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdzX19zZW5kKCdnZXRDb250ZW50Jywge2ZwYXRoOiBsb2dpZH0sICh7aGVhZGVycywgcmVzcG9uc2UsIGV4dH0pID0+IHtcbiAgICAgICAgbG9nc3RvcmUudXBkYXRlKG4gPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5zcmMsXG4gICAgICAgICAgICByZXNwb25zZSxcbiAgICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgICBleHQsXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc3RhdHVzKHtnZW5lcmFsOmd9KSB7XG4gIHJldHVybiBgXyR7TWF0aC50cnVuYyhnLnN0YXR1cy8xMDApfWA7XG59XG5cbmZ1bmN0aW9uIG1ldGhvZCh7Z2VuZXJhbDpnfSkge1xuICByZXR1cm4gYCR7Zy5tZXRob2QudG9Mb3dlckNhc2UoKX1gO1xufVxuZnVuY3Rpb24gbWV0aG9kMih7Z2VuZXJhbDpnfSkge1xuICByZXR1cm4gZy5tZXRob2QgKyAoZy5leHQgPyBgIDwke2cuZXh0LnRvVXBwZXJDYXNlKCl9PiBgIDogJycpO1xufVxuZnVuY3Rpb24gdXJsKHtnZW5lcmFsOmd9KSB7XG4gIGlmIChnLnVybC5tYXRjaCgnL2xvZy8nKSkge1xuICAgIHJldHVybiBnLnVybC5zcGxpdCgnQCcpWzFdO1xuICB9IGVsc2UgaWYgKCRjbGllbnQubm9ob3N0bG9ncykge1xuICAgIHJldHVybiBnLnBhdGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAke2cudXJsLnNwbGl0KCc/JylbMF19YDtcbiAgfVxufVxuZnVuY3Rpb24gcHRoKHtnZW5lcmFsOmd9KSB7XG4gIGlmIChnLnVybC5tYXRjaCgnL2xvZy8nKSkge1xuICAgIHJldHVybiAnJztcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwYXJtcyA9IGcudXJsLnNwbGl0KCc/JylbMV07XG4gICAgcmV0dXJuIHBhcm1zID8gYD8ke3Bhcm1zfWAgOiAnJztcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbjx0ciBjbGFzcz1cInRyXCI+XG4gIDx0ZCBjbGFzcz1cIntpdGVtLmxvZ2lkID8gJ3NlbGVjdGVkJyA6ICcnfVwiPlxuICAgIDxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskbG9nc3RvcmUubG9naWQ9PT1pdGVtLmxvZ2lkfVwiXG4gICAgZGF0YS1sb2dpZD17aXRlbS5sb2dpZH1cbiAgICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcbiAgICA+XG4gICAgICA8c3BhbiBjbGFzcz1cInN0YXR1cyB7c3RhdHVzKGl0ZW0pfVwiPntpdGVtLmdlbmVyYWwuc3RhdHVzfTwvc3Bhbj4gXG4gICAgICA8c3BhbiBjbGFzcz1cIm1ldGhvZCB7bWV0aG9kKGl0ZW0pfVwiPnttZXRob2QyKGl0ZW0pfTwvc3Bhbj4gXG4gICAgICA8c3BhbiBjbGFzcz1cInVybFwiPnt1cmwoaXRlbSl9PC9zcGFuPiBcbiAgICAgIDxzcGFuIGNsYXNzPVwicHJtXCI+e3B0aChpdGVtKX08L3NwYW4+IFxuICAgIDwvZGl2PlxuICA8L3RkPlxuPC90cj5cblxuPHN0eWxlPlxuLnRkLWl0ZW06aG92ZXIge1xuICBjb2xvcjogYmx1ZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbn1cbnRkIHtcbiAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICNjMGQ4Y2NhMTtcbiAgZm9udC1mYW1pbHk6ICdHaWxsIFNhbnMnLCAnR2lsbCBTYW5zIE1UJywgQ2FsaWJyaSwgJ1RyZWJ1Y2hldCBNUycsIHNhbnMtc2VyaWY7XG59XG4udGQtaXRlbSxcbi50ZC1zaG93IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAwLjFyZW07XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBwYWRkaW5nLWxlZnQ6IDVweDtcbn1cbi50ZC1pdGVtLnRydWUge1xuICBjb2xvcjogYmx1ZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XG59XG4uc3RhdHVzIHtcbiAgY29sb3I6IGdyZWVuO1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cbi5zdGF0dXMuXzQsXG4uc3RhdHVzLl81IHtcbiAgY29sb3I6IHJlZDtcbn1cbi5tZXRob2Qge1xuICBjb2xvcjogZ3JlZW47XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xufVxuLm1ldGhvZC5wb3N0IHtcbiAgY29sb3I6ICNhNzI2N2Y7XG59XG4ucHJtIHtcbiAgY29sb3I6ICNjY2I3Yjc7XG59XG48L3N0eWxlPiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcblxuZXhwb3J0IGNvbnN0IHRhYnN0b3JlID0gd3JpdGFibGUoe1xuICBlZGl0b3I6IHt9LFxuICB0YWI6IDAsXG59KTtcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcblxuZnVuY3Rpb24gYnRuTWluKCkge1xuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xuICBjb25zdCBpZCA9IGBlZGl0b3Ike3RhYisxfWA7XG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IuZm9sZEFsbCcpO1xufVxuXG5mdW5jdGlvbiBidG5QbHVzKCkge1xuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xuICBjb25zdCBpZCA9IGBlZGl0b3Ike3RhYisxfWA7XG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tbWluXCIgIG9uOmNsaWNrPVwie2J0bk1pbn1cIiA+Wy0tXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXBsdXNcIiBvbjpjbGljaz1cIntidG5QbHVzfVwiPlsrK108L2J1dHRvbj4uXG48L2Rpdj5cblxuPHN0eWxlPlxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCB7IFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5cbmNvbnN0IG1pbmltYXAgPSB7ZW5hYmxlZDogZmFsc2V9O1xuY29uc3Qgb3B0aW9uID0ge1xuICBjb250ZXh0bWVudTogZmFsc2UsXG4gIHJlYWRPbmx5OiB0cnVlLFxuICAvLyBtb2RlbDogbnVsbCxcbiAgbWluaW1hcCxcbn1cblxubGV0IGVsZW1lbnQxO1xubGV0IGVsZW1lbnQyO1xubGV0IGVsZW1lbnQzO1xuXG5sZXQgZWRpdG9yMTtcbmxldCBlZGl0b3IyO1xubGV0IGVkaXRvcjM7XG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjb25zb2xlLmxvZygkbG9nc3RvcmUpXG4gIGVsZW1lbnQxID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28xJyk7XG4gIGVkaXRvcjEgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKGVsZW1lbnQxLCB7XG4gICAgdmFsdWU6ICRsb2dzdG9yZS5oZWFkZXJzLFxuICAgIGxhbmd1YWdlOiAnanNvbicsXG4gICAgLi4ub3B0aW9uLFxuICB9KTtcblxuICB2YXIgcm8xID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGVudHJpZXNbMF0uY29udGVudFJlY3RcbiAgICBlZGl0b3IxLmxheW91dCh7d2lkdGgsIGhlaWdodH0pXG4gIH0pO1xuICBybzEub2JzZXJ2ZShlbGVtZW50MSk7XG5cbiAgZWxlbWVudDIgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbzInKTtcbiAgZWRpdG9yMiA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUoZWxlbWVudDIsIHtcbiAgICB2YWx1ZTogJGxvZ3N0b3JlLnJlc3BvbnNlLFxuICAgIGxhbmd1YWdlOiAkbG9nc3RvcmUuZXh0LFxuICAgIC4uLm9wdGlvbixcbiAgfSk7XG5cbiAgdmFyIHJvMiA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSBlbnRyaWVzWzBdLmNvbnRlbnRSZWN0XG4gICAgZWRpdG9yMi5sYXlvdXQoe3dpZHRoLCBoZWlnaHR9KVxuICB9KTtcbiAgcm8yLm9ic2VydmUoZWxlbWVudDIpO1xuXG4gIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UoJGxvZ3N0b3JlLmhlYWRlcnMpO1xuICBpZiAob2JqLkNTUCkge1xuICAgIGVsZW1lbnQzID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28zJyk7XG4gICAgZWRpdG9yMyA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUoZWxlbWVudDMsIHtcbiAgICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeShvYmouQ1NQLCBudWxsLCAyKSxcbiAgICAgIGxhbmd1YWdlOiAnanNvbicsXG4gICAgICAuLi5vcHRpb24sXG4gICAgfSk7XG5cbiAgICB2YXIgcm8zID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgICAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gZW50cmllc1swXS5jb250ZW50UmVjdFxuICAgICAgZWRpdG9yMy5sYXlvdXQoe3dpZHRoLCBoZWlnaHR9KVxuICAgIH0pO1xuICAgIHJvMy5vYnNlcnZlKGVsZW1lbnQzKTtcbiAgfVxuICBjb25zdCBlZGl0b3IgPSB7XG4gICAgZWRpdG9yMTogZWRpdG9yMSxcbiAgICBlZGl0b3IyOiBlZGl0b3IyLFxuICAgIGVkaXRvcjM6IGVkaXRvcjMsXG4gIH1cbiAgdGFic3RvcmUuc2V0KHtcbiAgICAuLi4kdGFic3RvcmUsXG4gICAgZWRpdG9yLFxuICB9KVxufSk7XG5mdW5jdGlvbiBpc0NTUCgpIHtcbiAgY29uc3QgaCA9ICRsb2dzdG9yZS5yZXNwSGVhZGVyO1xuICBjb25zdCBjc3AgPSBoWydjb250ZW50LXNlY3VyaXR5LXBvbGljeSddIHx8IGhbJ2NvbnRlbnQtc2VjdXJpdHktcG9saWN5LXJlcG9ydC1vbmx5J107XG4gIHJldHVybiBjc3A7XG59XG48L3NjcmlwdD5cblxuPFRhYiBsYWJlbD1cIkhlYWRlcnNcIj5cbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XG4gICAgPGRpdiBpZD1cIm1vbmFjbzFcIj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L1RhYj5cbjxUYWIgbGFiZWw9XCJSZXNwb25zZVwiPlxuICA8ZGl2IGNsYXNzPVwidmlldy1jb250YWluZXJcIj5cbiAgICA8ZGl2IGlkPVwibW9uYWNvMlwiPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvVGFiPlxueyNpZiBpc0NTUCgpfVxuICA8VGFiIGxhYmVsPVwiQ1NQXCI+XG4gICAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XG4gICAgICA8ZGl2IGlkPVwibW9uYWNvM1wiPlxuICAgIDwvZGl2PlxuICA8L1RhYj5cbnsvaWZ9IFxuXG48c3R5bGU+XG4udmlldy1jb250YWluZXIge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDUwcHgpO1xufVxuI21vbmFjbzEsXG4jbW9uYWNvMixcbiNtb25hY28zIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIGJvdHRvbTogMDtcbiAgcmlnaHQ6IDA7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcblxub25Nb3VudCgoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCk9PntcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItanNvbiBhJyk7XG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRhYnN0b3JlLnNldCh7XG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxuICAgICAgICAgIHRhYjogaSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCA1MDApO1xufSk7XG48L3NjcmlwdD5cblxuPEJ1dHRvbjIvPlxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWpzb25cIiBzaXplPVwiaXMtc21hbGxcIj5cbiAgPEJhc2VUYWIvPlxuPC9UYWJzPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcblxub25Nb3VudCgoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCk9PntcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItaHRtbCBhJyk7XG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRhYnN0b3JlLnNldCh7XG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxuICAgICAgICAgIHRhYjogaSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCA1MDApO1xufSk7XG48L3NjcmlwdD5cblxuPEJ1dHRvbjIvPlxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWh0bWxcIiBzaXplPVwiaXMtc21hbGxcIj5cbiAgPEJhc2VUYWIvPlxuPC9UYWJzPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcblxub25Nb3VudCgoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCk9PntcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItY3NzIGEnKTtcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXG4gICAgICAgICAgdGFiOiBpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDUwMCk7XG59KTtcbjwvc2NyaXB0PlxuXG48QnV0dG9uMi8+XG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItY3NzXCIgc2l6ZT1cImlzLXNtYWxsXCI+XG4gIDxCYXNlVGFiLz5cbjwvVGFicz5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XG5cbm9uTW91bnQoKCkgPT4ge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWpzIGEnKTtcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXG4gICAgICAgICAgdGFiOiBpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDUwMCk7XG59KTtcbjwvc2NyaXB0PlxuXG48QnV0dG9uMi8+XG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItanNcIiBzaXplPVwiaXMtc21hbGxcIj5cbiAgPEJhc2VUYWIvPlxuPC9UYWJzPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IEpzb24gZnJvbSAnLi9Kc29uLnN2ZWx0ZSc7XG5pbXBvcnQgSHRtbCBmcm9tICcuL0h0bWwuc3ZlbHRlJztcbmltcG9ydCBDc3MgZnJvbSAnLi9Dc3Muc3ZlbHRlJztcbmltcG9ydCBKcyBmcm9tICcuL0pzLnN2ZWx0ZSc7XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cIml0ZW0tc2hvd1wiPlxuICB7I2lmICRsb2dzdG9yZS50aXRsZS5tYXRjaCgnLnBuZycpfVxuICAgIDxpbWcgc3JjPVwieyRsb2dzdG9yZS51cmx9XCIgYWx0PVwiaW1hZ2VcIi8+XG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUudGl0bGUubWF0Y2goJy5qc29uJyl9XG4gICAgPEpzb24vPlxuICB7OmVsc2UgaWYgJGxvZ3N0b3JlLnRpdGxlLm1hdGNoKCcuaHRtbCcpfVxuICAgIDxIdG1sLz5cbiAgezplbHNlIGlmICRsb2dzdG9yZS50aXRsZS5tYXRjaCgnLmNzcycpfVxuICAgIDxDc3MvPlxuICB7OmVsc2UgaWYgJGxvZ3N0b3JlLnRpdGxlLm1hdGNoKCcuanMnKX1cbiAgICA8SnMvPlxuICB7OmVsc2V9XG4gICAgPHByZT57JGxvZ3N0b3JlLnJlc3BvbnNlfTwvcHJlPlxuICB7L2lmfVxuPC9kaXY+XG5cbjxzdHlsZT5cbi5pdGVtLXNob3cge1xuICBtYXJnaW4tbGVmdDogMnB4O1xufVxuLml0ZW0tc2hvdyBwcmV7XG4gIHBhZGRpbmc6IDAgMCAwIDVweDtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XG5cbmltcG9ydCBCU3RhdGljIGZyb20gJy4uL2JveC9CU3RhdGljLnN2ZWx0ZSc7XG5pbXBvcnQgQlJlc2l6ZSBmcm9tICcuLi9ib3gvQlJlc2l6ZS5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IEl0ZW0gZnJvbSAnLi9JdGVtLnN2ZWx0ZSc7XG5pbXBvcnQgU2hvdyBmcm9tICcuL1Nob3cuc3ZlbHRlJztcblxubGV0IGpzb24gPSAxNjM7XG5sZXQgZGF0YSA9ICBbXTtcblxuJDogX2pzb24gPSBqc29uO1xuJDogX2RhdGEgPSBkYXRhO1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgd3NfX3NlbmQoJ2dldExvZycsICcnLCBsb2dIYW5kbGVyKVxuICB9LCAxMCk7XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnanNvbicsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBkYXRhLmpzb24gJiYgKGpzb24gPSBkYXRhLmpzb24pO1xuICB9KTtcbn0pO1xuXG5jb25zdCBsb2dIYW5kbGVyID0gb2JqID0+IHtcbiAgY29uc29sZS5sb2coJ3dzX19zZW5kKGdldExvZyknLCBvYmopO1xuICBpZiAoIHdpbmRvdy5taXRtLmNsaWVudC5jbGVhcikge1xuICAgIGRlbGV0ZSB3aW5kb3cubWl0bS5jbGllbnQuY2xlYXI7XG4gICAgbG9nc3RvcmUuc2V0KHtcbiAgICAgIHJlc3BIZWFkZXI6IHt9LFxuICAgICAgcmVzcG9uc2U6ICcnLFxuICAgICAgaGVhZGVyczogJycsXG4gICAgICBsb2dpZDogJycsXG4gICAgICB0aXRsZTogJycsXG4gICAgICBwYXRoOiAnJyxcbiAgICAgIHVybDogJycsXG4gICAgICBleHQ6ICcnLFxuICAgIH0pXG4gIH1cbiAgaWYgKHdpbmRvdy5taXRtLmZpbGVzLmxvZz09PXVuZGVmaW5lZCkge1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLmxvZyA9IG9iajtcbiAgICBkYXRhID0gb2JqO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHtsb2d9ID0gd2luZG93Lm1pdG0uZmlsZXM7XG4gICAgY29uc3QgbmV3TG9nID0ge307XG4gICAgZm9yIChsZXQgayBpbiBvYmopIHtcbiAgICAgIG5ld0xvZ1trXSA9IGxvZ1trXSA/IGxvZ1trXSA6IG9ialtrXTsgXG4gICAgfVxuICAgIHdpbmRvdy5taXRtLmZpbGVzLmxvZyA9IG5ld0xvZ1xuICAgIGRhdGEgPSBuZXdMb2c7XG4gIH1cbn1cblxud2luZG93Lm1pdG0uZmlsZXMubG9nX2V2ZW50cy5Mb2dzVGFibGUgPSAoKSA9PiB7XG4gIHdzX19zZW5kKCdnZXRMb2cnLCAnJywgbG9nSGFuZGxlcilcbn1cblxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xuICBqc29uID0gZGV0YWlsLmxlZnQ7XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7anNvbn0pXG59XG5mdW5jdGlvbiBub2hvc3Rsb2dzKGZsYWcpIHtcbiAgY29uc29sZS5sb2coJ25vaG9zdGxvZ3MnLCBmbGFnKTtcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidmJveFwiPlxuICA8QlN0YXRpYz5cbiAgICA8QkhlYWRlcj4tTG9ncy08L0JIZWFkZXI+XG4gICAgPEJ1dHRvbi8+XG4gICAgPEJUYWJsZSB1cGRhdGU9e25vaG9zdGxvZ3MoJGNsaWVudC5ub2hvc3Rsb2dzKX0+XG4gICAgICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGEpIGFzIGxvZ2lkfVxuICAgICAgPEl0ZW0gaXRlbT17e1xuICAgICAgICBsb2dpZCxcbiAgICAgICAgLi4uX2RhdGFbbG9naWRdLFxuICAgICAgICBub2hvc3Rsb2dzOiAkY2xpZW50Lm5vaG9zdGxvZ3MsXG4gICAgICAgIH19Lz5cbiAgICAgIHsvZWFjaH1cbiAgICA8L0JUYWJsZT5cbiAgPC9CU3RhdGljPlxuICB7I2lmICRsb2dzdG9yZS5sb2dpZH1cbiAgICA8QlJlc2l6ZSBsZWZ0PXtfanNvbn0gb246ZHJhZ2VuZD17ZHJhZ2VuZH0+XG4gICAgICA8U2hvdy8+XG4gICAgPC9CUmVzaXplPlxuICB7L2lmfVxuPC9kaXY+XG5cbjxzdHlsZT5cbi52Ym94IHtcbiAgZmxleDogYXV0bztcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuPC9zdHlsZT5cbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJztcclxuXHJcbmV4cG9ydCBjb25zdCBzb3VyY2UgPSB3cml0YWJsZSh7XHJcbiAgb3BlbkRpc2FibGVkOiBmYWxzZSxcclxuICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgZ29EaXNhYmxlZDogdHJ1ZSxcclxuICBjb250ZW50OicnLFxyXG4gIHBhdGg6JycsXHJcbn0pO1xyXG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5mdW5jdGlvbiBidG5NaW4oKSB7XG4gIHdpbmRvdy5tb25hY29FZGl0b3IudHJpZ2dlcignZm9sZCcsICdlZGl0b3IuZm9sZEFsbCcpO1xufVxuXG5mdW5jdGlvbiBidG5QbHVzKCkge1xuICB3aW5kb3cubW9uYWNvRWRpdG9yLnRyaWdnZXIoJ3VuZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xuICBzb3VyY2UudXBkYXRlKG4gPT4ge1xuICAgIHJldHVybiB7Li4ubiwgY29udGVudDogd2luZG93Lm1vbmFjb0VkaXRvci5nZXRWYWx1ZSgpfVxuICB9KVxuICBjb25zb2xlLmxvZygkc291cmNlKTtcblxuICB3c19fc2VuZCgnc2F2ZVJvdXRlJywgJHNvdXJjZSwgZGF0YSA9PiB7XG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4gey4uLm4sIHNhdmVEaXNhYmxlZDogdHJ1ZX19KTtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBTYXZlIScpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gYnRuT3BlbigpIHtcbiAgd3NfX3NlbmQoJ29wZW5Sb3V0ZScsICRzb3VyY2UsIGRhdGEgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdEb25lIE9wZW4hJyk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBidG5zKGlkKSB7XG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbaWRdO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhyb3V0ZS51cmxzKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZnVuY3Rpb24gYnRuVXJsKGlkKSB7XG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybHMpIHtcbiAgICByZXR1cm4gcm91dGUudXJsc1tpZF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ0blRhZyhlKSB7XG4gIGNocm9tZS50YWJzLnVwZGF0ZSh7dXJsOiBlLnRhcmdldC5kYXRhc2V0LnVybH0pO1xufVxuXG5mdW5jdGlvbiBidG5HbyhlKSB7XG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybCkge1xuICAgIGNocm9tZS50YWJzLnVwZGF0ZSh7dXJsOiByb3V0ZS51cmx9KTtcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbnsjaWYgJHNvdXJjZS5wYXRofVxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICB7I2VhY2ggYnRucygkc291cmNlLml0ZW0pIGFzIGl0ZW19XG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLWdvXCIgb246Y2xpY2s9XCJ7YnRuVGFnfVwiXG4gIGRhdGEtdXJsPVwie2J0blVybChpdGVtKX1cIj57aXRlbX08L2J1dHRvbj4gLSBcbiAgey9lYWNofVxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIGRpc2FibGVkPXskc291cmNlLmdvRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bkdvfVwiPkdvPC9idXR0b24+LlxuICA8L2Rpdj5cbnsvaWZ9XG48ZGl2IGNsYXNzPVwiZmlsZS1wYXRoXCI+XG5QYXRoOnskc291cmNlLnBhdGh9XG57I2lmICRzb3VyY2UucGF0aH1cblx0PGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tbWluXCIgIG9uOmNsaWNrPVwie2J0bk1pbn1cIiA+Wy0tXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXBsdXNcIiBvbjpjbGljaz1cIntidG5QbHVzfVwiPlsrK108L2J1dHRvbj4gLVxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1zYXZlXCIgZGlzYWJsZWQ9eyRzb3VyY2Uuc2F2ZURpc2FibGVkfSBvbjpjbGljaz1cIntidG5TYXZlfVwiPlNhdmU8L2J1dHRvbj4gLVxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1vcGVuXCIgZGlzYWJsZWQ9eyRzb3VyY2Uub3BlbkRpc2FibGVkfSBvbjpjbGljaz1cIntidG5PcGVufVwiPk9wZW48L2J1dHRvbj5cbiAgPC9kaXY+XG57L2lmfVxuPC9kaXY+XG5cbjxzdHlsZT5cbi5maWxlLXBhdGgge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGZvbnQtZmFtaWx5OiBhdXRvO1xuICBmb250LXNpemU6IDAuOWVtO1xuICBjb2xvcjogYmx1ZTtcbn1cbi5idG4tY29udGFpbmVyIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBtYXJnaW4tdG9wOiAtMXB4O1xuICBwYWRkaW5nLXJpZ2h0OiA0cHg7XG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XG4gIHJpZ2h0OiAwO1xuICB6LWluZGV4OiA1O1xuICB0b3A6IC0ycHg7XG59XG4uYnRuLWNvbnRhaW5lciBidXR0b24ge1xuICBmb250LXNpemU6IDEwcHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbjpkaXNhYmxlZCB7XG4gIGN1cnNvcjogYXV0bztcbn1cbi50bGIge1xuICBib3JkZXI6IG5vbmU7XG59XG48L3N0eWxlPiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcblxuZXhwb3J0IGxldCBpdGVtO1xuZXhwb3J0IGxldCBvbkNoYW5nZTtcblxub25Nb3VudChhc3luYyAoKSA9PiB7fSk7XG5cbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XG4gIGxldCB7aXRlbX0gPSBlLnRhcmdldC5kYXRhc2V0O1xuICBjb25zdCB1cmwgPSBtaXRtLnJvdXRlc1tpdGVtXS51cmw7XG4gIGNvbnN0IG9iaiA9IHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlW2l0ZW1dO1xuICBjb25zb2xlLmxvZyhpdGVtLCBvYmopO1xuXG4gIHdpbmRvdy5tb25hY29FZGl0b3Iuc2V0VmFsdWUob2JqLmNvbnRlbnQpO1xuICB3aW5kb3cubW9uYWNvRWRpdG9yLnJldmVhbExpbmUoMSk7XG4gIG9uQ2hhbmdlKGZhbHNlKTtcblxuICBzb3VyY2UudXBkYXRlKG4gPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAuLi5uLFxuICAgICAgZ29EaXNhYmxlZDogKHVybD09PXVuZGVmaW5lZCksXG4gICAgICBjb250ZW50OiBvYmouY29udGVudCxcbiAgICAgIHBhdGg6IG9iai5wYXRoLFxuICAgICAgaXRlbSxcbiAgICB9XG4gIH0pO1xufVxuPC9zY3JpcHQ+XG5cbjx0ciBjbGFzcz1cInRyXCI+XG4gIDx0ZD5cbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5wYXRoPT09aXRlbS5wYXRofVwiXG4gICAgICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cbiAgICAgIG9uOmNsaWNrPVwie2NsaWNrSGFuZGxlcn1cIlxuICAgID57aXRlbS50aXRsZX08L2Rpdj5cbiAgPC90ZD5cbjwvdHI+XG5cbjxzdHlsZT5cbi50ZC1pdGVtOmhvdmVyIHtcbiAgY29sb3I6IGJsdWU7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG50ZCB7XG4gIGJvcmRlci1ib3R0b206IDNweCBzb2xpZCAjYzBkOGNjYTE7XG59XG4udGQtaXRlbSxcbi50ZC1zaG93IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAwLjFyZW07XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBwYWRkaW5nLWxlZnQ6IDVweDsgIFxufVxuLnRkLWl0ZW0udHJ1ZSB7XG4gIGNvbG9yOiBibHVlO1xuICBmb250LXdlaWdodDogYm9sZGVyO1xuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5cbmltcG9ydCBCU3RhdGljIGZyb20gJy4uL2JveC9CU3RhdGljLnN2ZWx0ZSc7XG5pbXBvcnQgQlJlc2l6ZSBmcm9tICcuLi9ib3gvQlJlc2l6ZS5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IEl0ZW0gZnJvbSAnLi9JdGVtLnN2ZWx0ZSc7XG5cbmxldCByb3V0ZSA9IDE2MztcbmxldCBkYXRhID0gW107XG5cbmxldCByZXJlbmRlciA9IDA7XG5cbiQ6IF9yb3V0ZSA9IHJvdXRlO1xuJDogX2RhdGEgPSBkYXRhO1xuXG5jb25zdCByb3V0ZUhhbmRsZXIgPSBvYmogPT4ge1xuICBjb25zb2xlLmxvZygnd3NfX3NlbmQoZ2V0Um91dGUpJywgb2JqKTtcbiAgaWYgKG9iai5fdGFnc18pIHtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzEgPSBvYmouX3RhZ3NfLl9fdGFnMTtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzIgPSBvYmouX3RhZ3NfLl9fdGFnMjtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzMgPSBvYmouX3RhZ3NfLl9fdGFnMztcbiAgICB3aW5kb3cubWl0bS5fX3RhZzQgPSBvYmouX3RhZ3NfLl9fdGFnNDtcbiAgfVxuICBpZiAod2luZG93Lm1pdG0uZmlsZXMucm91dGU9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG9iai5yb3V0ZXM7XG4gICAgZGF0YSA9IG9iai5yb3V0ZXM7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qge3JvdXRlfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld1JvdXRlID0ge307XG4gICAgY29uc3Qge3JvdXRlc30gPSBvYmo7XG4gICAgZm9yIChsZXQgayBpbiByb3V0ZXMpIHtcbiAgICAgIG5ld1JvdXRlW2tdID0gcm91dGVba10gPyByb3V0ZVtrXSA6IHJvdXRlc1trXTtcbiAgICAgIG5ld1JvdXRlW2tdLmNvbnRlbnQgPSByb3V0ZXNba10uY29udGVudDtcbiAgICB9XG4gICAgZGF0YSA9IG5ld1JvdXRlO1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlID0gbmV3Um91dGVcbiAgfVxuICAvKipcbiAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRSb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XG4gICAqL1xuICBjb25zdCB7Z2V0Um91dGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICBmb3IgKGxldCBrZXkgaW4gZ2V0Um91dGVfZXZlbnRzKSB7XG4gICAgZ2V0Um91dGVfZXZlbnRzW2tleV0oZGF0YSk7XG4gIH1cbiAgcmVyZW5kZXIrKztcbn1cblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKVxuICB9LCAxMCk7XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncm91dGUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgZGF0YS5yb3V0ZSAmJiAocm91dGUgPSBkYXRhLnJvdXRlKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gaW5pdENvZGVFZGl0b3IoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9uYWNvJyk7XG4gICAgY29uc3QgZWRpdG9yID0gIHdpbmRvdy5tb25hY28uZWRpdG9yLmNyZWF0ZShlbGVtZW50LCB7XG4gICAgICBsYW5ndWFnZTogJ2phdmFzY3JpcHQnLFxuICAgICAgLy8gdGhlbWU6IFwidnMtZGFya1wiLFxuICAgICAgbWluaW1hcDoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICB2YWx1ZTogJycsXG4gICAgfSk7XG5cbiAgICB3aW5kb3cubW9uYWNvRWwgPSBlbGVtZW50O1xuICAgIHdpbmRvdy5tb25hY29FZGl0b3IgPSBlZGl0b3I7XG4gICAgZWRpdG9yLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KGVkaXRvckNoYW5nZWQpO1xuXG4gICAgdmFyIHJvID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgICAgY29uc3Qge3dpZHRoOiB3LCBoZWlnaHQ6IGh9ID0gZW50cmllc1swXS5jb250ZW50UmVjdDtcbiAgICAgIGVkaXRvci5sYXlvdXQoe3dpZHRoOiB3LCBoZWlnaHQ6IGh9KVxuICAgIH0pO1xuICAgIHJvLm9ic2VydmUoZWxlbWVudCk7XG4gIH1cbiAgbGV0IGludGVydmFsVGljID0gMDtcbiAgY29uc3QgaW50ZXJ2YWxJRCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgaWYgKHdpbmRvdy5tb25hY28uZWRpdG9yKSB7XG4gICAgICBjb25zb2xlLmxvZygnUnVuJywge2ludGVydmFsVGljfSk7XG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsSUQpO1xuICAgICAgaW5pdENvZGVFZGl0b3IoKTtcbiAgICB9IGVsc2UgaWYgKGludGVydmFsVGljID4gNSkge1xuICAgICAgY29uc29sZS5sb2coJ091dCcsIHtpbnRlcnZhbFRpY30pO1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElEKTtcbiAgICAgIGluaXRDb2RlRWRpdG9yKCk7XG4gICAgfVxuICAgIGludGVydmFsVGljICs9IDE7XG4gIH0sIDEwMCk7XG59KTtcblxud2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzLnJvdXRlVGFibGUgPSAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdyb3V0ZVRhYmxlIGdldHRpbmcgY2FsbGVkISEhJyk7XG4gIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcbn1cblxubGV0IGVkaXRidWZmZXI7XG5sZXQgX3RpbWVvdXQgPSBudWxsO1xuZnVuY3Rpb24gZWRpdG9yQ2hhbmdlZChlKSB7XG4gIGxldCBzYXZlRGlzYWJsZWQ7XG4gIGlmIChlPT09ZmFsc2UpIHtcbiAgICBzYXZlRGlzYWJsZWQgPSB0cnVlO1xuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHsuLi5uLCBzYXZlRGlzYWJsZWR9fSlcbiAgICBlZGl0YnVmZmVyID0gd2luZG93Lm1vbmFjb0VkaXRvci5nZXRWYWx1ZSgpO1xuICB9XG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XG4gIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKHdpbmRvdy5tb25hY29FZGl0b3Ipe1xuICAgICAgc2F2ZURpc2FibGVkID0gKHdpbmRvdy5tb25hY29FZGl0b3IuZ2V0VmFsdWUoKT09PWVkaXRidWZmZXIpXG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7Li4ubiwgc2F2ZURpc2FibGVkfX0pO1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgfVxuICB9LCA1MDApICBcbn1cblxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xuICByb3V0ZSA9IGRldGFpbC5sZWZ0O1xuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe3JvdXRlfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljIGhlaWdodD1cIjQ3XCI+XG4gICAgPEJIZWFkZXI+LVJvdXRlKHMpLTwvQkhlYWRlcj5cbiAgICA8QlRhYmxlPlxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICAgICAgPEl0ZW0gaXRlbT17e2VsZW1lbnQ6IGl0ZW0sIC4uLl9kYXRhW2l0ZW1dfX0gb25DaGFuZ2U9e2VkaXRvckNoYW5nZWR9Lz5cbiAgICAgIHsvZWFjaH1cbiAgICA8L0JUYWJsZT5cbiAgPC9CU3RhdGljPlxuICA8QlJlc2l6ZSBsZWZ0PXtfcm91dGV9IG9uOmRyYWdlbmQ9e2RyYWdlbmR9IGhlaWdodD1cIjQ3XCI+XG4gICAgPGRpdiBjbGFzcz1cImVkaXQtY29udGFpbmVyXCI+XG4gICAgICA8ZGl2IGlkPVwibW9uYWNvXCI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9CUmVzaXplPlxuPC9kaXY+XG5cblxuPHN0eWxlPlxuLnZib3gge1xuICBmbGV4OiBhdXRvO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5lZGl0LWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XG59XG4jbW9uYWNvIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIGJvdHRvbTogMDtcbiAgcmlnaHQ6IDA7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cclxuZnVuY3Rpb24gYnRuT3BlbigpIHtcclxuICB3c19fc2VuZCgnb3BlbkhvbWUnLCAnJywgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBvcGVuIGhvbWUgZm9sZGVyIScpO1xyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGJ1dHRvbiBvbjpjbGljaz17YnRuT3Blbn0+T3BlbiBIb21lPC9idXR0b24+XHJcbiIsIjxzY3JpcHQ+XHJcbmZ1bmN0aW9uIGJ0bkNvZGUoKSB7XHJcbiAgd3NfX3NlbmQoJ2NvZGVIb21lJywgJycsIGRhdGEgPT4ge1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgY29kZSBob21lIGZvbGRlciEnKTtcclxuICB9KTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxidXR0b24gb246Y2xpY2s9e2J0bkNvZGV9PkNvZGUgSG9tZTwvYnV0dG9uPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5mdW5jdGlvbiBidG5Ob0hvc3RMb2dzKGUpIHtcclxuICBjb25zdCBub2hvc3Rsb2dzID0gZS50YXJnZXQuY2hlY2tlZDtcclxuICBjbGllbnQudXBkYXRlKG4gPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uJGNsaWVudCxcclxuICAgICAgbm9ob3N0bG9ncyxcclxuICAgIH1cclxuICB9KTtcclxuICBjb25zb2xlLmxvZygkY2xpZW50KTtcclxuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywge25vaG9zdGxvZ3N9LCBkYXRhID0+IHtcclxuICAgIHdpbmRvdy5taXRtLmNsaWVudC5ub2hvc3Rsb2dzID0gZGF0YS5ub2hvc3Rsb2dzO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgY2hhbmdlIHN0YXRlIG5vaG9zdGxvZ3MnLCBkYXRhKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmxhZygpIHtcclxuICByZXR1cm4gd2luZG93Lm1pdG0uY2xpZW50Lm5vaG9zdGxvZ3M7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiPlxyXG4gIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuTm9Ib3N0TG9nc30gY2hlY2tlZD17ZmxhZygpfT5cclxuICBObyBIb3N0IExvZ3NcclxuPC9sYWJlbD5cclxuIiwiPHNjcmlwdD5cclxuZnVuY3Rpb24gYnRuUG9zdG1lc3NhZ2UoZSkge1xyXG4gIGNvbnN0IHBvc3RtZXNzYWdlID0gZS50YXJnZXQuY2hlY2tlZDtcclxuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywge3Bvc3RtZXNzYWdlfSwgZGF0YSA9PiB7XHJcbiAgICB3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UgPSBkYXRhLnBvc3RtZXNzYWdlO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgY2hhbmdlIHN0YXRlIHBvc3RtZXNzYWdlJywgZGF0YSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZsYWcoKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XHJcbiAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG9uOmNsaWNrPXtidG5Qb3N0bWVzc2FnZX0gY2hlY2tlZD17ZmxhZygpfT5cclxuICBQb3N0IE1lc3NhZ2VzXHJcbjwvbGFiZWw+XHJcbiIsIjxzY3JpcHQ+XHJcbmZ1bmN0aW9uIGJ0bkNzcChlKSB7XHJcbiAgY29uc3QgY3NwID0gZS50YXJnZXQuY2hlY2tlZDtcclxuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywge2NzcH0sIGRhdGEgPT4ge1xyXG4gICAgd2luZG93Lm1pdG0uY2xpZW50LmNzcCA9IGRhdGEuY3NwO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgY2hhbmdlIHN0YXRlIGNzcCcsIGRhdGEpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmbGFnKCkge1xyXG4gIHJldHVybiB3aW5kb3cubWl0bS5jbGllbnQuY3NwO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj5cclxuICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0bkNzcH0gY2hlY2tlZD17ZmxhZygpfT5cclxuICBDb250ZW50IFNlYy4gUG9saWN5XHJcbjwvbGFiZWw+XHJcbiIsImltcG9ydCBBcHAgZnJvbSAnLi9BcHAuc3ZlbHRlJztcblxuY29uc29sZS5sb2coJ0xvYWQgTUlUTSBwbHVnaW4nKTtcblxuZnVuY3Rpb24gdG9SZWdleChzdHIsIGZsYWdzPScnKSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKHN0ci5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJykucmVwbGFjZSgvXFw/L2csICdcXFxcPycpLCBmbGFncyk7XG59XG5cbndpbmRvdy5taXRtLmZuLnRvUmVnZXggPSB0b1JlZ2V4O1xud2luZG93Lm1pdG0uYnJvd3NlciA9IHsgXG4gIGNoZ1VybF9ldmVudHM6IHt9LFxuICBhY3RpdmVVcmw6ICcnLFxuICBwYWdlOiB7fSxcbn1cblxuZnVuY3Rpb24gY2hnVXJsKHVybCkge1xuICBpZiAoIXVybCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zb2xlLmxvZygnQ2hnIHVybDonLCB1cmwpO1xuICBjb25zdCB7YnJvd3Nlcn0gPSB3aW5kb3cubWl0bTtcbiAgYnJvd3Nlci5hY3RpdmVVcmwgPSB1cmw7XG4gIGZvciAobGV0IGUgaW4gYnJvd3Nlci5jaGdVcmxfZXZlbnRzKSB7XG4gICAgYnJvd3Nlci5jaGdVcmxfZXZlbnRzW2VdKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VXJsKCkge1xuICBjaHJvbWUudGFicy5xdWVyeSh7J2FjdGl2ZSc6IHRydWUsICd3aW5kb3dJZCc6IGNocm9tZS53aW5kb3dzLldJTkRPV19JRF9DVVJSRU5UfSxcbiAgICBmdW5jdGlvbih0YWJzKXtcbiAgICAgIGNvbnN0IHVybCA9IHRhYnNbMF0udXJsO1xuICAgICAgY2hnVXJsKHVybCk7XG4gICAgfVxuICApO1xufTtcblxuY29uc29sZS5sb2coJ0luaXQgZXZlbnQgdGFicycpO1xubGV0IGRlYm91bmNlO1xuY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uKHRhYklkLCBjaGFuZ2VJbmZvLCB0YWIpIHtcbiAgaWYgKCF0YWIuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qge2Jyb3dzZXJ9ID0gd2luZG93Lm1pdG07XG4gIGJyb3dzZXIucGFnZSA9IHtcbiAgICAuLi5icm93c2VyLnBhZ2UsXG4gICAgLi4uY2hhbmdlSW5mbyxcbiAgICAuLi50YWIsXG4gIH1cblxuICBpZiAoY2hhbmdlSW5mby5zdGF0dXMgPT09ICdsb2FkaW5nJykge1xuICAgIGJyb3dzZXIucGFnZS50aXRsZSA9ICcnO1xuICB9IGVsc2UgaWYgKGJyb3dzZXIucGFnZS5zdGF0dXMgPT09ICdjb21wbGV0ZScgJiYgYnJvd3Nlci5wYWdlLnRpdGxlKSB7XG4gICAgaWYgKGRlYm91bmNlKSB7XG4gICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2UpO1xuICAgICAgZGVib3VuY2UgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGRlYm91bmNlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnVGFiIFVwZGF0ZSEhIScsIHRhYi51cmwpO1xuICAgICAgZGVib3VuY2UgPSB1bmRlZmluZWQ7XG4gICAgICBjaGdVcmwodGFiLnVybCk7ICBcbiAgICB9LCAxMDAwKTtcbiAgfVxufSk7XG5cbmNocm9tZS50YWJzLm9uQWN0aXZhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uKGFjdGl2ZUluZm8pIHtcbiAgLy8gY29uc29sZS5sb2coJ1RhYiBDaGFuZ2UhISEnLCBhY3RpdmVJbmZvKTtcbiAgZ2V0VXJsKCk7XG59KTtcblxuY29uc3QgYXBwID0gbmV3IEFwcCh7dGFyZ2V0OiBkb2N1bWVudC5ib2R5fSk7XG5jb25zb2xlLmxvZygnU3RhcnQgcGx1Z2luJyk7XG5nZXRVcmwoKTtcblxuZXhwb3J0IGRlZmF1bHQgYXBwO1xuXG4vLyBsZXQgaW5wcm9jZXNzID0gZmFsc2U7XG4vLyBjb25zdCByZXBsYXkgPSAoKT0+e1xuLy8gICBzZXRUaW1lb3V0KCgpID0+IHtcbi8vICAgICBpbnByb2Nlc3MgPSBmYWxzZTtcbi8vICAgfSw1MDApO1xuLy8gfVxuLy8gZnVuY3Rpb24gcmVwb3J0V2luZG93U2l6ZSgpIHtcbi8vICAgaWYgKCFpbnByb2Nlc3MpIHtcbi8vICAgICBpbnByb2Nlc3MgPSB0cnVlO1xuLy8gICAgIGNvbnN0IHtpbm5lcldpZHRoLCBpbm5lckhlaWdodDogaGVpZ2h0LCB3c19fc2VuZH0gPSB3aW5kb3c7XG4vLyAgICAgY2hyb21lLndpbmRvd3MuZ2V0KC0yLCB7fSwgZGF0YSA9PiB7XG4vLyAgICAgICBjb25zdCB7d2lkdGg6X3d9ID0gZGF0YTtcbi8vICAgICAgIGNvbnN0IHdpZHRoID0gX3cgLSBpbm5lcldpZHRoO1xuLy8gICAgICAgY29uc29sZS5sb2coe3dpZHRoLCBoZWlnaHQsIF93fSk7XG4vLyAgICAgICB3c19fc2VuZCgnc2V0Vmlld3BvcnQnLCB7d2lkdGgsIGhlaWdodCwgX3d9LCByZXBsYXkpO1xuLy8gICAgIH0pICBcbi8vICAgfVxuLy8gfVxuLy8gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVwb3J0V2luZG93U2l6ZSk7XG4vLyB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGV2ZW50ID0+IHtcbi8vICAgY29uc29sZS5sb2coe2V2ZW50fSk7XG4vLyB9KTtcblxuXG4iXSwibmFtZXMiOlsiZ2V0IiwiZW1wdHkiLCJmbGFnIl0sIm1hcHBpbmdzIjoiOzs7OztJQUFBLFNBQVMsSUFBSSxHQUFHLEdBQUc7SUFFbkIsU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtJQUMxQjtJQUNBLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHO0lBQ3ZCLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixJQUFJLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUlELFNBQVMsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7SUFDekQsSUFBSSxPQUFPLENBQUMsYUFBYSxHQUFHO0lBQzVCLFFBQVEsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0lBQ3pDLEtBQUssQ0FBQztJQUNOLENBQUM7SUFDRCxTQUFTLEdBQUcsQ0FBQyxFQUFFLEVBQUU7SUFDakIsSUFBSSxPQUFPLEVBQUUsRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxTQUFTLFlBQVksR0FBRztJQUN4QixJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFO0lBQ3RCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBQ0QsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFO0lBQzVCLElBQUksT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7SUFDdkMsQ0FBQztJQUNE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
