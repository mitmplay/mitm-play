
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

    /* d:\Projects\mitm-play\plugins\chrome\node_modules\svelma\src\components\Icon.svelte generated by Svelte v3.16.7 */

    const file = "d:\\Projects\\mitm-play\\plugins\\chrome\\node_modules\\svelma\\src\\components\\Icon.svelte";

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

    /* d:\Projects\mitm-play\plugins\chrome\node_modules\svelma\src\components\Tabs\Tabs.svelte generated by Svelte v3.16.7 */
    const file$1 = "d:\\Projects\\mitm-play\\plugins\\chrome\\node_modules\\svelma\\src\\components\\Tabs\\Tabs.svelte";

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

    /* d:\Projects\mitm-play\plugins\chrome\node_modules\svelma\src\components\Tabs\Tab.svelte generated by Svelte v3.16.7 */
    const file$2 = "d:\\Projects\\mitm-play\\plugins\\chrome\\node_modules\\svelma\\src\\components\\Tabs\\Tab.svelte";

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
      __tag3: {}
    });

    /* d:\Projects\mitm-play\plugins\chrome\src\components\box\BStatic.svelte generated by Svelte v3.16.7 */

    const file$3 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\box\\BStatic.svelte";

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
    			attr_dev(div0, "class", "table-container svelte-1x2hxw3");
    			attr_dev(div0, "style", div0_style_value = /*resize*/ ctx[0]());
    			add_location(div0, file$3, 9, 2, 149);
    			attr_dev(div1, "class", "vbox left svelte-1x2hxw3");
    			add_location(div1, file$3, 8, 0, 123);
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\box\BHeader.svelte generated by Svelte v3.16.7 */

    const file$4 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\box\\BHeader.svelte";

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
    			attr_dev(div, "class", "td-header svelte-6s8rfe");
    			add_location(div, file$4, 3, 6, 51);
    			attr_dev(td, "class", "svelte-6s8rfe");
    			add_location(td, file$4, 2, 4, 40);
    			add_location(tr, file$4, 1, 2, 31);
    			attr_dev(table, "class", "table-header svelte-6s8rfe");
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\box\BTable.svelte generated by Svelte v3.16.7 */

    const file$5 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\box\\BTable.svelte";

    function create_fragment$5(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			attr_dev(table, "class", "table-content svelte-z01nhz");
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Button.svelte generated by Svelte v3.16.7 */
    const file$6 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Button.svelte";

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
    			add_location(input0, file$6, 47, 4, 993);
    			attr_dev(label0, "class", "checker svelte-12umemg");
    			add_location(label0, file$6, 46, 2, 965);
    			attr_dev(button0, "class", "tlb btn-go svelte-12umemg");
    			button0.disabled = /*autoSave*/ ctx[0];
    			add_location(button0, file$6, 51, 2, 1080);
    			attr_dev(button1, "class", "tlb btn-go svelte-12umemg");
    			button1.disabled = /*autoSave*/ ctx[0];
    			add_location(button1, file$6, 52, 2, 1166);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$6, 54, 4, 1279);
    			attr_dev(label1, "class", "checker svelte-12umemg");
    			add_location(label1, file$6, 53, 2, 1251);
    			attr_dev(div, "class", "btn-container svelte-12umemg");
    			add_location(div, file$6, 45, 0, 935);

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
    			const { type } = e.target.attributes;

    			if (type) {
    				const { value } = type;

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
    			}
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags1_.svelte generated by Svelte v3.16.7 */
    const file$7 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags1_.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (105:4) {#each listTags($tags) as item}
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
    			add_location(input, file$7, 107, 8, 2440);
    			attr_dev(span, "class", "big svelte-1o2u3cr");
    			add_location(span, file$7, 111, 8, 2567);
    			add_location(label, file$7, 106, 6, 2424);
    			attr_dev(div, "class", div_class_value = "space0 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-1o2u3cr");
    			add_location(div, file$7, 105, 4, 2380);

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

    			if (dirty & /*$tags*/ 1 && div_class_value !== (div_class_value = "space0 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-1o2u3cr")) {
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
    		source: "(105:4) {#each listTags($tags) as item}",
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

    			attr_dev(div, "class", "border svelte-1o2u3cr");
    			add_location(div, file$7, 103, 2, 2319);
    			add_location(td, file$7, 102, 0, 2312);
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

    	let tgs;

    	if (tags.filterUrl) {
    		for (let ns in tags.__tag2) {
    			const rgx = toRegex(ns.replace(/~/, "[^.]*"));

    			if (mitm.browser.activeUrl.match(rgx)) {
    				add(ns);
    				break;
    			}
    		}

    		add("_global_");
    		tgs = Object.keys(list).sort();
    	} else {
    		tgs = Object.keys(tags.__tag1);
    	}

    	return tgs;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));

    	function clicked(e) {
    		const { __tag1: { ...tagx } } = $tags;

    		setTimeout(
    			() => {
    				const { __tag1, __tag2, __tag3 } = $tags;
    				const { item } = e.target.dataset;
    				const flag = __tag1[item];
    				console.log("e", $tags);
    				const [group1, id1] = item.split("~");

    				if (id1) {
    					for (let ns in __tag1) {
    						const [group2, id2] = ns.split("~");

    						if (!tagx[item] && group1 === group2 && id1 !== id2) {
    							__tag1[ns] = !flag;
    						}
    					}
    				}

    				for (let ns in __tag2) {
    					const namespace = __tag2[ns];

    					for (let itm in namespace) {
    						const typ2 = itm.split(":")[1] || itm;

    						if (item === typ2) {
    							namespace[itm] = flag;
    						}

    						if (group1 === typ2.split("~")[0]) {
    							namespace[itm] = __tag1[typ2] || false;
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

    								if (group1 === itm.split("~")[0]) {
    									namespace[itm] = __tag1[itm] || false;
    								}
    							}
    						}
    					}
    				}

    				const { filterUrl, tgroup } = $tags;

    				tags.set({
    					filterUrl,
    					__tag1,
    					__tag2,
    					__tag3,
    					tgroup
    				});
    			},
    			10
    		);
    	}

    	function routetag(item) {
    		const slc = $tags.__tag1[item] ? "slc" : "";
    		const grp = $tags.tgroup[item] ? "grp" : "";
    		return `rtag ${grp} ${slc}`;
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags2_1.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$8 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags2_1.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (89:2) {#each itemlist(items) as item}
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
    			add_location(input, file$8, 91, 8, 2044);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*item*/ ctx[6].match(":") ? "big" : "") + " svelte-s6cnnu"));
    			add_location(span, file$8, 95, 8, 2165);
    			add_location(label, file$8, 90, 6, 2028);
    			attr_dev(div, "class", div_class_value = "space1 " + /*routetag*/ ctx[3](/*item*/ ctx[6]) + " svelte-s6cnnu");
    			add_location(div, file$8, 89, 4, 1984);

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

    			if (dirty & /*items*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty(/*item*/ ctx[6].match(":") ? "big" : "") + " svelte-s6cnnu"))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*items*/ 1 && div_class_value !== (div_class_value = "space1 " + /*routetag*/ ctx[3](/*item*/ ctx[6]) + " svelte-s6cnnu")) {
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
    		source: "(89:2) {#each itemlist(items) as item}",
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

    			attr_dev(div0, "class", "space0 svelte-s6cnnu");
    			add_location(div0, file$8, 87, 2, 1887);
    			attr_dev(div1, "class", "border svelte-s6cnnu");
    			add_location(div1, file$8, 86, 0, 1864);
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
    		const { __tag1, __tag2, __tag3 } = $tags;
    		const { item } = e.target.dataset;
    		const typ1 = item.split(":")[1] || item;
    		const [group1, id1] = typ1.split("~");
    		const namespace = __tag2[ns];
    		const tagx = {};

    		for (let itm in namespace) {
    			tagx[itm] = namespace[itm];
    		}

    		setTimeout(
    			() => {
    				const flag = namespace[item];
    				console.log("e", { __tag2, __tag3 });

    				if (id1) {
    					for (let itm in namespace) {
    						const typ2 = itm.split(":")[1] || itm;
    						const [group2, id2] = typ2.split("~");

    						if (!(tagx && tagx[item])) {
    							if (group1 === group2 && id1 !== id2) {
    								namespace[itm] = !flag;
    							}
    						}
    					}
    				}

    				const urls = __tag3[ns];

    				for (let url in urls) {
    					const typs = urls[url];

    					for (let typ in typs) {
    						const namespace3 = typs[typ];

    						for (let itm in namespace3) {
    							if (item === itm) {
    								namespace3[itm] = flag;
    							}

    							if (group1 === itm.split("~")[0]) {
    								namespace3[itm] = namespace[itm] || false;
    							}
    						}
    					}
    				}

    				const { filterUrl, tgroup } = $tags;

    				tags.set({
    					filterUrl,
    					__tag1,
    					__tag2,
    					__tag3,
    					tgroup
    				});
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags2_.svelte generated by Svelte v3.16.7 */
    const file$9 = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags2_.svelte";

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

    			add_location(td, file$9, 15, 0, 329);
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags3_3.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$a = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags3_3.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (51:0) {#each xitems($tags) as item}
    function create_each_block$4(ctx) {
    	let div;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[1] + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[8].call(input, /*item*/ ctx[1]);
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
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[1]);
    			add_location(input, file$a, 53, 6, 1175);
    			add_location(span, file$a, 57, 6, 1288);
    			add_location(label, file$a, 52, 4, 1161);
    			attr_dev(div, "class", div_class_value = "space3 " + /*routetag*/ ctx[4](/*item*/ ctx[1]) + " svelte-olxey7");
    			add_location(div, file$a, 51, 2, 1119);

    			dispose = [
    				listen_dev(input, "click", /*clicked*/ ctx[3], false, false, false),
    				listen_dev(input, "change", input_change_handler)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*items*/ ctx[0][/*item*/ ctx[1]];
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$tags*/ 4 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[1])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*items, xitems, $tags*/ 37) {
    				input.checked = /*items*/ ctx[0][/*item*/ ctx[1]];
    			}

    			if (dirty & /*$tags*/ 4 && t1_value !== (t1_value = /*item*/ ctx[1] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$tags*/ 4 && div_class_value !== (div_class_value = "space3 " + /*routetag*/ ctx[4](/*item*/ ctx[1]) + " svelte-olxey7")) {
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
    		source: "(51:0) {#each xitems($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let each_1_anchor;
    	let each_value = /*xitems*/ ctx[5](/*$tags*/ ctx[2]);
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
    			if (dirty & /*routetag, xitems, $tags, items, clicked*/ 61) {
    				each_value = /*xitems*/ ctx[5](/*$tags*/ ctx[2]);
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
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { items } = $$props;
    	let { item } = $$props;
    	let { path } = $$props;
    	let { ns } = $$props;

    	function clicked(e) {
    		setTimeout(
    			() => {
    				const { __tag3 } = $tags;
    				const namespace = __tag3[ns];
    				const { item: i } = e.target.dataset;
    				const [group1, id1] = i.split("~");
    				console.log("e", { __tag3 });

    				for (let pth in namespace) {
    					const typs = namespace[pth];

    					for (let tsk in typs) {
    						const items2 = typs[tsk];

    						if (typeof items2 !== "string") {
    							for (let itm in items2) {
    								const [group2, id2] = itm.split("~");

    								if (group1 === group2 && id1 !== id2) {
    									items2[itm] = false;
    									tags.set({ ...$tags, __tag3 });
    								}
    							}
    						}
    					}
    				}
    			},
    			50
    		);
    	}

    	function routetag(item) {
    		return items[item] ? "rtag slc" : "rtag";
    	}

    	function xitems(tags) {
    		const { __tag3 } = tags;
    		const namespace = __tag3[ns];
    		const typs = namespace[path];
    		const itms = typs[item];
    		return Object.keys(itms).sort();
    	}

    	const writable_props = ["items", "item", "path", "ns"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Tags3_3> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		items[item] = this.checked;
    		$$invalidate(0, items);
    		$$invalidate(5, xitems);
    	}

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("path" in $$props) $$invalidate(6, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(7, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => {
    		return { items, item, path, ns, $tags };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("path" in $$props) $$invalidate(6, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(7, ns = $$props.ns);
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [items, item, $tags, clicked, routetag, xitems, path, ns, input_change_handler];
    }

    class Tags3_3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { items: 0, item: 1, path: 6, ns: 7 });

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

    		if (/*item*/ ctx[1] === undefined && !("item" in props)) {
    			console_1$1.warn("<Tags3_3> was created without expected prop 'item'");
    		}

    		if (/*path*/ ctx[6] === undefined && !("path" in props)) {
    			console_1$1.warn("<Tags3_3> was created without expected prop 'path'");
    		}

    		if (/*ns*/ ctx[7] === undefined && !("ns" in props)) {
    			console_1$1.warn("<Tags3_3> was created without expected prop 'ns'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags3_3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags3_3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Tags3_3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Tags3_3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error("<Tags3_3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Tags3_3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ns() {
    		throw new Error("<Tags3_3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ns(value) {
    		throw new Error("<Tags3_3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags3_2.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1$2 } = globals;
    const file$b = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags3_2.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (17:0) {#each xitems($tags).filter(x=>x[0]!==':') as item}
    function create_each_block$5(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let t2_value = /*items*/ ctx[0][`:${/*item*/ ctx[5]}`] + "";
    	let t2;
    	let t3;
    	let current;

    	const tags33 = new Tags3_3({
    			props: {
    				items: /*items*/ ctx[0][/*item*/ ctx[5]],
    				item: /*item*/ ctx[5],
    				path: /*path*/ ctx[1],
    				ns: /*ns*/ ctx[2]
    			},
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
    			attr_dev(div, "class", "space2 svelte-1ytw30n");
    			add_location(div, file$b, 17, 2, 344);
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
    			if ((!current || dirty & /*$tags*/ 8) && t0_value !== (t0_value = /*item*/ ctx[5] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*items, $tags*/ 9) && t2_value !== (t2_value = /*items*/ ctx[0][`:${/*item*/ ctx[5]}`] + "")) set_data_dev(t2, t2_value);
    			const tags33_changes = {};
    			if (dirty & /*items, $tags*/ 9) tags33_changes.items = /*items*/ ctx[0][/*item*/ ctx[5]];
    			if (dirty & /*$tags*/ 8) tags33_changes.item = /*item*/ ctx[5];
    			if (dirty & /*path*/ 2) tags33_changes.path = /*path*/ ctx[1];
    			if (dirty & /*ns*/ 4) tags33_changes.ns = /*ns*/ ctx[2];
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
    		source: "(17:0) {#each xitems($tags).filter(x=>x[0]!==':') as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*xitems*/ ctx[4](/*$tags*/ ctx[3]).filter(func);
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
    			if (dirty & /*items, xitems, $tags, path, ns*/ 31) {
    				each_value = /*xitems*/ ctx[4](/*$tags*/ ctx[3]).filter(func);
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
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(3, $tags = $$value));
    	let { items } = $$props;
    	let { path } = $$props;
    	let { ns } = $$props;

    	function xitems(tags) {
    		const { __tag3 } = tags;
    		const namespace = __tag3[ns];
    		const typs = namespace[path];
    		return Object.keys(typs);
    	}

    	const writable_props = ["items", "path", "ns"];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_2> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("path" in $$props) $$invalidate(1, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(2, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => {
    		return { items, path, ns, $tags };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("path" in $$props) $$invalidate(1, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(2, ns = $$props.ns);
    		if ("$tags" in $$props) tags.set($tags = $$props.$tags);
    	};

    	return [items, path, ns, $tags, xitems];
    }

    class Tags3_2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { items: 0, path: 1, ns: 2 });

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

    		if (/*path*/ ctx[1] === undefined && !("path" in props)) {
    			console.warn("<Tags3_2> was created without expected prop 'path'");
    		}

    		if (/*ns*/ ctx[2] === undefined && !("ns" in props)) {
    			console.warn("<Tags3_2> was created without expected prop 'ns'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags3_2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags3_2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error("<Tags3_2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Tags3_2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ns() {
    		throw new Error("<Tags3_2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ns(value) {
    		throw new Error("<Tags3_2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags3_1.svelte generated by Svelte v3.16.7 */

    const { Object: Object_1$3 } = globals;
    const file$c = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags3_1.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (17:2) {#each xitems($tags) as path}
    function create_each_block$6(ctx) {
    	let div;
    	let t0_value = /*path*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let current;

    	const tags32 = new Tags3_2({
    			props: {
    				items: /*items*/ ctx[0][/*path*/ ctx[4]],
    				path: /*path*/ ctx[4],
    				ns: /*ns*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(tags32.$$.fragment);
    			attr_dev(div, "class", "space1 svelte-dueni6");
    			add_location(div, file$c, 17, 4, 364);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(tags32, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$tags*/ 4) && t0_value !== (t0_value = /*path*/ ctx[4] + "")) set_data_dev(t0, t0_value);
    			const tags32_changes = {};
    			if (dirty & /*items, $tags*/ 5) tags32_changes.items = /*items*/ ctx[0][/*path*/ ctx[4]];
    			if (dirty & /*$tags*/ 4) tags32_changes.path = /*path*/ ctx[4];
    			if (dirty & /*ns*/ 2) tags32_changes.ns = /*ns*/ ctx[1];
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
    		source: "(17:2) {#each xitems($tags) as path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = (/*ns*/ ctx[1] === "_global_" ? " * " : /*ns*/ ctx[1]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let current;
    	let each_value = /*xitems*/ ctx[3](/*$tags*/ ctx[2]);
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

    			attr_dev(div0, "class", "space0 svelte-dueni6");
    			add_location(div0, file$c, 15, 2, 269);
    			attr_dev(div1, "class", "border svelte-dueni6");
    			add_location(div1, file$c, 14, 0, 246);
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
    			if ((!current || dirty & /*ns*/ 2) && t1_value !== (t1_value = (/*ns*/ ctx[1] === "_global_" ? " * " : /*ns*/ ctx[1]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items, xitems, $tags, ns*/ 15) {
    				each_value = /*xitems*/ ctx[3](/*$tags*/ ctx[2]);
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
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { items } = $$props;
    	let { ns } = $$props;

    	function xitems(tags) {
    		const { __tag3 } = tags;
    		const namespace = __tag3[ns];
    		return Object.keys(namespace);
    	}

    	const writable_props = ["items", "ns"];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_1> was created with unknown prop '${key}'`);
    	});

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

    	return [items, ns, $tags, xitems];
    }

    class Tags3_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { items: 0, ns: 1 });

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

    		if (/*ns*/ ctx[1] === undefined && !("ns" in props)) {
    			console.warn("<Tags3_1> was created without expected prop 'ns'");
    		}
    	}

    	get items() {
    		throw new Error("<Tags3_1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tags3_1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ns() {
    		throw new Error("<Tags3_1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ns(value) {
    		throw new Error("<Tags3_1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Tags3_.svelte generated by Svelte v3.16.7 */
    const file$d = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Tags3_.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (20:2) {#if istag(ns)}
    function create_if_block$2(ctx) {
    	let current;

    	const tags31 = new Tags3_1({
    			props: {
    				items: /*$tags*/ ctx[0].__tag3[/*ns*/ ctx[2]],
    				ns: /*ns*/ ctx[2]
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
    			if (dirty & /*$tags*/ 1) tags31_changes.items = /*$tags*/ ctx[0].__tag3[/*ns*/ ctx[2]];
    			if (dirty & /*$tags*/ 1) tags31_changes.ns = /*ns*/ ctx[2];
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
    		source: "(20:2) {#if istag(ns)}",
    		ctx
    	});

    	return block;
    }

    // (19:0) {#each Object.keys($tags.__tag3) as ns}
    function create_each_block$7(ctx) {
    	let show_if = /*istag*/ ctx[1](/*ns*/ ctx[2]);
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
    			if (dirty & /*$tags*/ 1) show_if = /*istag*/ ctx[1](/*ns*/ ctx[2]);

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
    		source: "(19:0) {#each Object.keys($tags.__tag3) as ns}",
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

    			add_location(td, file$d, 17, 0, 426);
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\tags\Table.svelte generated by Svelte v3.16.7 */
    const file$e = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\tags\\Table.svelte";

    // (43:4) <BHeader>
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
    		source: "(43:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (44:4) <BTable>
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
    			add_location(tr, file$e, 44, 6, 1001);
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
    		source: "(44:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (42:2) <BStatic height="0">
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
    		source: "(42:2) <BStatic height=\\\"0\\\">",
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
    				height: "0",
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
    			add_location(div, file$e, 40, 0, 910);
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
    		const tgroup = {};

    		for (let ns in __tag2) {
    			const tsks = __tag2[ns];

    			for (let task in tsks) {
    				const [,v] = task.split(":");
    				v && (tgroup[v] = true);
    			}
    		}

    		tags.set({
    			filterUrl,
    			__tag1,
    			__tag2,
    			__tag3,
    			tgroup
    		});
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
      ext: ''
    });

    const client = writable({
      ...window.mitm.client
    });

    /* d:\Projects\mitm-play\plugins\chrome\src\components\box\Splitter.svelte generated by Svelte v3.16.7 */
    const file$f = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\box\\Splitter.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let div_style_value;
    	let draggable_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resize svelte-l4qu26");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$f, 76, 0, 1755);
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\box\BResize.svelte generated by Svelte v3.16.7 */
    const file$g = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\box\\BResize.svelte";

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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Button.svelte generated by Svelte v3.16.7 */
    const file$h = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\logs\\Button.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let button;
    	let svg;
    	let path;
    	let t0;
    	let label0;
    	let input0;
    	let input0_checked_value;
    	let t1;
    	let t2;
    	let label1;
    	let input1;
    	let input1_checked_value;
    	let t3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			label0 = element("label");
    			input0 = element("input");
    			t1 = text("host");
    			t2 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t3 = text("args");
    			set_style(path, "fill", "red");
    			attr_dev(path, "d", "M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z");
    			add_location(path, file$h, 46, 6, 1064);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$h, 45, 4, 968);
    			attr_dev(button, "class", "svelte-16f7euc");
    			add_location(button, file$h, 44, 2, 933);
    			attr_dev(input0, "type", "checkbox");
    			input0.checked = input0_checked_value = hostflag();
    			add_location(input0, file$h, 50, 4, 1473);
    			attr_dev(label0, "class", "checkbox");
    			add_location(label0, file$h, 49, 2, 1444);
    			attr_dev(input1, "type", "checkbox");
    			input1.checked = input1_checked_value = argsflag();
    			add_location(input1, file$h, 53, 4, 1587);
    			attr_dev(label1, "class", "checkbox");
    			add_location(label1, file$h, 52, 2, 1558);
    			attr_dev(div, "class", "btn-container svelte-16f7euc");
    			add_location(div, file$h, 43, 0, 903);

    			dispose = [
    				listen_dev(button, "click", btnClear, false, false, false),
    				listen_dev(input0, "click", /*btnHostswch*/ ctx[0], false, false, false),
    				listen_dev(input1, "click", /*btnArgswch*/ ctx[1], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(div, t0);
    			append_dev(div, label0);
    			append_dev(label0, input0);
    			append_dev(label0, t1);
    			append_dev(div, t2);
    			append_dev(div, label1);
    			append_dev(label1, input1);
    			append_dev(label1, t3);
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

    function hostflag() {
    	return !window.mitm.client.nohostlogs;
    }

    function argsflag() {
    	return !window.mitm.client.noarglogs;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $client;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(2, $client = $$value));

    	function toogle(prop) {
    		client.update(n => {
    			return { ...$client, ...prop };
    		});

    		console.log($client);

    		ws__send("setClient", { ...prop }, data => {
    			console.log("Done change state", data);
    			window.mitm.client = data;
    		});
    	}

    	function btnHostswch(e) {
    		toogle({ nohostlogs: !e.target.checked });
    	}

    	function btnArgswch(e) {
    		toogle({ noarglogs: !e.target.checked });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$client" in $$props) client.set($client = $$props.$client);
    	};

    	return [btnHostswch, btnArgswch];
    }

    class Button$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Item.svelte generated by Svelte v3.16.7 */
    const file$i = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\logs\\Item.svelte";

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
    	let t6_value = /*pth*/ ctx[4](/*item*/ ctx[0]) + "";
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
    			attr_dev(span0, "class", span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-42oe8u");
    			add_location(span0, file$i, 90, 6, 1920);
    			attr_dev(span1, "class", span1_class_value = "method " + method(/*item*/ ctx[0]) + " svelte-42oe8u");
    			add_location(span1, file$i, 91, 6, 1992);
    			attr_dev(span2, "class", "url");
    			add_location(span2, file$i, 92, 6, 2058);
    			attr_dev(span3, "class", "prm svelte-42oe8u");
    			add_location(span3, file$i, 93, 6, 2102);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-42oe8u");
    			attr_dev(div, "data-logid", div_data_logid_value = /*item*/ ctx[0].logid);
    			add_location(div, file$i, 86, 4, 1798);
    			attr_dev(td, "class", td_class_value = "" + (null_to_empty(/*item*/ ctx[0].logid ? "selected" : "") + " svelte-42oe8u"));
    			add_location(td, file$i, 85, 2, 1750);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$i, 84, 0, 1732);
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

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-42oe8u")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = method2(/*item*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "method " + method(/*item*/ ctx[0]) + " svelte-42oe8u")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*url*/ ctx[3](/*item*/ ctx[0]) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = /*pth*/ ctx[4](/*item*/ ctx[0]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$logstore, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-42oe8u")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_logid_value !== (div_data_logid_value = /*item*/ ctx[0].logid)) {
    				attr_dev(div, "data-logid", div_data_logid_value);
    			}

    			if (dirty & /*item*/ 1 && td_class_value !== (td_class_value = "" + (null_to_empty(/*item*/ ctx[0].logid ? "selected" : "") + " svelte-42oe8u"))) {
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
    	return g.method.toLowerCase() + (g.ext ? `<${g.ext}> ` : "");
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $client;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(1, $logstore = $$value));
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(5, $client = $$value));
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

    	function pth({ general: g }) {
    		if ($client.noarglogs || g.url.match("/log/")) {
    			return "";
    		} else {
    			const parms = g.url.split("?")[1];
    			return parms ? `?${parms}` : "";
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

    	return [item, $logstore, clickHandler, url, pth];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { item: 0 });

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
      tab: 0
    });

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Button2.svelte generated by Svelte v3.16.7 */
    const file$j = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\logs\\Button2.svelte";

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

    function instance$j($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button2",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\BaseTab.svelte generated by Svelte v3.16.7 */
    const file$k = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\logs\\BaseTab.svelte";

    // (95:0) <Tab label="Headers">
    function create_default_slot_2$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco1");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 96, 4, 2173);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 95, 2, 2140);
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
    		source: "(95:0) <Tab label=\\\"Headers\\\">",
    		ctx
    	});

    	return block;
    }

    // (101:0) <Tab label="Response">
    function create_default_slot_1$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco2");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 102, 4, 2277);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 101, 2, 2244);
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
    		source: "(101:0) <Tab label=\\\"Response\\\">",
    		ctx
    	});

    	return block;
    }

    // (107:0) <Tab label="CSP">
    function create_default_slot$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco3");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 108, 4, 2376);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 107, 2, 2343);
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
    		source: "(107:0) <Tab label=\\\"CSP\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let t0;
    	let t1;
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

    	const tab2 = new Tab({
    			props: {
    				label: "CSP",
    				$$slots: { default: [create_default_slot$1] },
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
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
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
    			const tab2_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function resize(editor) {
    	return entries => {
    		const { width, height } = entries[0].contentRect;
    		editor.layout({ width, height });
    	};
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $tabstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(6, $logstore = $$value));
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(7, $tabstore = $$value));
    	const minimap = { enabled: false };

    	const option = {
    		contextmenu: false,
    		readOnly: true,
    		minimap
    	};

    	let node1;
    	let node2;
    	let node3;
    	let edit1;
    	let edit2;
    	let edit3;

    	onMount(async () => {
    		console.warn("onMount logs - BaseTab.svelte");
    		console.log($logstore);
    		const hdrs = JSON.parse($logstore.headers);
    		const csp3 = hdrs.CSP || ({});

    		const val1 = {
    			value: $logstore.headers,
    			language: "json",
    			...option
    		};

    		const val2 = {
    			value: $logstore.response,
    			language: $logstore.ext,
    			...option
    		};

    		const val3 = {
    			value: JSON.stringify(csp3, null, 2),
    			language: "json",
    			...option
    		};

    		const ctype = $logstore.respHeader["content-type"] || "text/plain";

    		if (ctype.match("html")) {
    			val2.value = val2.value.replace(/\\n\\n/g, "").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, "\"").replace(/^"/, "").replace(/"$/, "");
    			val2.language = "html";
    		}

    		node1 = window.document.getElementById("monaco1");
    		node2 = window.document.getElementById("monaco2");
    		node3 = window.document.getElementById("monaco3");
    		edit1 = window.monaco.editor.create(node1, val1);
    		edit2 = window.monaco.editor.create(node2, val2);
    		edit3 = window.monaco.editor.create(node3, val3);
    		console.log("load monaco: logs 1,2,3");
    		const ro1 = new ResizeObserver(resize(edit1));
    		const ro2 = new ResizeObserver(resize(edit2));
    		const ro3 = new ResizeObserver(resize(edit3));
    		ro1.observe(node1);
    		ro2.observe(node2);
    		ro3.observe(node3);

    		tabstore.set({
    			...$tabstore,
    			editor: { edit1, edit2, edit3 }
    		});
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("node1" in $$props) node1 = $$props.node1;
    		if ("node2" in $$props) node2 = $$props.node2;
    		if ("node3" in $$props) node3 = $$props.node3;
    		if ("edit1" in $$props) edit1 = $$props.edit1;
    		if ("edit2" in $$props) edit2 = $$props.edit2;
    		if ("edit3" in $$props) edit3 = $$props.edit3;
    		if ("$logstore" in $$props) logstore.set($logstore = $$props.$logstore);
    		if ("$tabstore" in $$props) tabstore.set($tabstore = $$props.$tabstore);
    	};

    	return [];
    }

    class BaseTab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BaseTab",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Json.svelte generated by Svelte v3.16.7 */

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

    function instance$l($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Json",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Html.svelte generated by Svelte v3.16.7 */

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

    function instance$m($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Html",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Text.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-text" size="is-small">
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
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-text\\\" size=\\\"is-small\\\">",
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
    				style: "is-boxed tab-text",
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

    function instance$n($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));

    	onMount(() => {
    		setTimeout(
    			() => {
    				const nodes = document.querySelectorAll(".tab-text a");

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

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Css.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-css" size="is-small">
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
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-css\\\" size=\\\"is-small\\\">",
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
    				style: "is-boxed tab-css",
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

    function instance$o($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Css",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Js.svelte generated by Svelte v3.16.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-js" size="is-small">
    function create_default_slot$6(ctx) {
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
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-js\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let t;
    	let current;
    	const button2 = new Button2({ $$inline: true });

    	const tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-js",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$6] },
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Js",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Show.svelte generated by Svelte v3.16.7 */
    const file$l = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\logs\\Show.svelte";

    // (23:2) {:else}
    function create_else_block(ctx) {
    	let pre;
    	let t_value = /*$logstore*/ ctx[0].response + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(t_value);
    			attr_dev(pre, "class", "svelte-1bhfci6");
    			add_location(pre, file$l, 23, 4, 618);
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
    		source: "(23:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:41) 
    function create_if_block_5(ctx) {
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(21:41) ",
    		ctx
    	});

    	return block;
    }

    // (19:42) 
    function create_if_block_4(ctx) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(19:42) ",
    		ctx
    	});

    	return block;
    }

    // (17:42) 
    function create_if_block_3(ctx) {
    	let current;
    	const text_1 = new Text({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(text_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(text_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(text_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(17:42) ",
    		ctx
    	});

    	return block;
    }

    // (15:43) 
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
    		source: "(15:43) ",
    		ctx
    	});

    	return block;
    }

    // (13:43) 
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
    		source: "(13:43) ",
    		ctx
    	});

    	return block;
    }

    // (11:2) {#if $logstore.title.match('.png')}
    function create_if_block$3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*$logstore*/ ctx[0].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image");
    			add_location(img, file$l, 11, 4, 290);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(11:2) {#if $logstore.title.match('.png')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let div;
    	let show_if;
    	let show_if_1;
    	let show_if_2;
    	let show_if_3;
    	let show_if_4;
    	let show_if_5;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	const if_block_creators = [
    		create_if_block$3,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
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
    		if (dirty & /*$logstore*/ 1) show_if_3 = !!/*$logstore*/ ctx[0].title.match(".txt");
    		if (show_if_3) return 3;
    		if (dirty & /*$logstore*/ 1) show_if_4 = !!/*$logstore*/ ctx[0].title.match(".css");
    		if (show_if_4) return 4;
    		if (dirty & /*$logstore*/ 1) show_if_5 = !!/*$logstore*/ ctx[0].title.match(".js");
    		if (show_if_5) return 5;
    		return 6;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "item-show svelte-1bhfci6");
    			add_location(div, file$l, 9, 0, 224);
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
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Show",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\logs\Table.svelte generated by Svelte v3.16.7 */
    const file$m = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\logs\\Table.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (74:4) <BHeader>
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
    		source: "(74:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (77:6) {#each Object.keys(_data) as logid}
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
    		source: "(77:6) {#each Object.keys(_data) as logid}",
    		ctx
    	});

    	return block;
    }

    // (76:4) <BTable update={nohostlogs($client.nohostlogs)}>
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
    		source: "(76:4) <BTable update={nohostlogs($client.nohostlogs)}>",
    		ctx
    	});

    	return block;
    }

    // (73:2) <BStatic height="0">
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
    		source: "(73:2) <BStatic height=\\\"0\\\">",
    		ctx
    	});

    	return block;
    }

    // (86:2) {#if $logstore.logid}
    function create_if_block$4(ctx) {
    	let current;

    	const bresize = new BResize({
    			props: {
    				left: /*_json*/ ctx[0],
    				$$slots: { default: [create_default_slot$7] },
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(86:2) {#if $logstore.logid}",
    		ctx
    	});

    	return block;
    }

    // (87:4) <BResize left={_json} on:dragend={dragend}>
    function create_default_slot$7(ctx) {
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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(87:4) <BResize left={_json} on:dragend={dragend}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let div;
    	let t;
    	let current;

    	const bstatic = new BStatic({
    			props: {
    				height: "0",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*$logstore*/ ctx[3].logid && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(bstatic.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "vbox svelte-isss4r");
    			add_location(div, file$m, 71, 0, 1572);
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
    					if_block = create_if_block$4(ctx);
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
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function nohostlogs(flag) {
    	console.log("nohostlogs", flag);
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $client;
    	let $logstore;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(2, $client = $$value));
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(3, $logstore = $$value));
    	let json = 163;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount logs");
    		_ws_connect.logOnMount = () => ws__send("getLog", "", logHandler);

    		chrome.storage.local.get("json", function (data) {
    			data.json && $$invalidate(5, json = data.json);
    		});
    	});

    	const logHandler = obj => {
    		console.warn("ws__send(getLog)", obj);

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
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    const source = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: '',
      path: ''
    });

    /* d:\Projects\mitm-play\plugins\chrome\src\components\route\Button.svelte generated by Svelte v3.16.7 */
    const file$n = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\route\\Button.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (71:0) {#if $source.path}
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
    			add_location(button, file$n, 76, 2, 1570);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$n, 71, 1, 1397);
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
    		source: "(71:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    // (73:2) {#each btns($source.item) as item}
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
    			add_location(button, file$n, 73, 2, 1464);
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
    		source: "(73:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (82:0) {#if $source.path}
    function create_if_block$5(ctx) {
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
    			add_location(button0, file$n, 83, 2, 1768);
    			attr_dev(button1, "class", "tlb btn-plus svelte-11e4kdx");
    			add_location(button1, file$n, 84, 2, 1836);
    			attr_dev(button2, "class", "tlb btn-save svelte-11e4kdx");
    			button2.disabled = button2_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button2, file$n, 85, 2, 1904);
    			attr_dev(button3, "class", "tlb btn-open svelte-11e4kdx");
    			button3.disabled = button3_disabled_value = /*$source*/ ctx[0].openDisabled;
    			add_location(button3, file$n, 86, 2, 2004);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$n, 82, 1, 1738);

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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(82:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$1(ctx);
    	let if_block1 = /*$source*/ ctx[0].path && create_if_block$5(ctx);

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
    			add_location(div, file$n, 79, 0, 1674);
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
    					if_block1 = create_if_block$5(ctx);
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnMin() {
    	const { editor: { _route } } = window.mitm;
    	_route && _route.trigger("fold", "editor.foldAll");
    }

    function btnPlus() {
    	const { editor: { _route } } = window.mitm;
    	_route && _route.trigger("unfold", "editor.unfoldAll");
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

    function instance$s($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(0, $source = $$value));

    	function btnSave(e) {
    		const { editor: { _route } } = window.mitm;

    		if (_route) {
    			const content = _route.getValue();

    			source.update(n => {
    				return {
    					...n,
    					content,
    					saveDisabled: true,
    					editbuffer: content
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
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\route\Item.svelte generated by Svelte v3.16.7 */

    const { console: console_1$2 } = globals;
    const file$o = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\route\\Item.svelte";

    function create_fragment$t(ctx) {
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
    			add_location(div, file$o, 67, 4, 1497);
    			attr_dev(td, "class", "svelte-1arv0rl");
    			add_location(td, file$o, 66, 2, 1488);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$o, 65, 0, 1470);
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let { item } = $$props;
    	let { onChange } = $$props;

    	onMount(async () => {
    		const { editor: { _route } } = window.mitm;
    		const element = window.document.getElementById("monaco");

    		const ro = new ResizeObserver(entries => {
    				const { width: w, height: h } = entries[0].contentRect;
    				_route && _route.layout({ width: w, height: h });
    			});

    		ro.observe(element);
    		window.mitm.editor._routeEl = element;
    	});

    	function initCodeEditor(src) {
    		console.log("load monaco: route");
    		const element = window.mitm.editor._routeEl;

    		const _route = window.monaco.editor.create(element, {
    			language: "javascript",
    			minimap: { enabled: false },
    			value: ""
    		});

    		window.mitm.editor._route = _route;
    		_route.onDidChangeModelContent(onChange);
    		_route.setValue(src);
    	}

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const url = mitm.routes[item].url;
    		const { editor: { _route }, files } = window.mitm;
    		const obj = files.route[item];
    		console.log(item, obj);

    		if (_route === undefined) {
    			initCodeEditor(obj.content);
    		} else {
    			_route.setValue(obj.content || "");
    			_route.revealLine(1);
    		}

    		setTimeout(() => {
    			onChange(false);

    			source.update(
    				n => {
    					return {
    						...n,
    						goDisabled: url === undefined,
    						content: obj.content,
    						path: obj.path,
    						item
    					};
    				},
    				1
    			);
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
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, { item: 0, onChange: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$t.name
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\route\Table.svelte generated by Svelte v3.16.7 */
    const file$p = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\route\\Table.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (100:4) <BHeader>
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
    		source: "(100:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (102:6) {#each Object.keys(_data) as item}
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
    		source: "(102:6) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    // (101:4) <BTable>
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
    		source: "(101:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (99:2) <BStatic height="47">
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
    		source: "(99:2) <BStatic height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    // (107:2) <BResize left={_route} on:dragend={dragend} height="47">
    function create_default_slot$8(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco");
    			attr_dev(div0, "class", "svelte-v2bbcg");
    			add_location(div0, file$p, 108, 6, 2767);
    			attr_dev(div1, "class", "edit-container svelte-v2bbcg");
    			add_location(div1, file$p, 107, 4, 2732);
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
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(107:2) <BResize left={_route} on:dragend={dragend} height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
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
    				$$slots: { default: [create_default_slot$8] },
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
    			add_location(div, file$p, 97, 0, 2419);
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
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(8, $source = $$value));
    	let rerender = 0;
    	let route = 163;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount route");
    		_ws_connect.routeOnMount = () => ws__send("getRoute", "", routeHandler);

    		chrome.storage.local.get("route", function (data) {
    			data.route && $$invalidate(5, route = data.route);
    		});
    	});

    	const routeHandler = obj => {
    		console.warn("ws__send(getRoute)", obj);

    		if (obj._tags_) {
    			window.mitm.__tag1 = obj._tags_.__tag1;
    			window.mitm.__tag2 = obj._tags_.__tag2;
    			window.mitm.__tag3 = obj._tags_.__tag3;
    			window.mitm.__tag4 = obj._tags_.__tag4;
    		}

    		if (window.mitm.files.route === undefined) {
    			window.mitm.files.route = obj.routes;
    			$$invalidate(6, data = obj.routes);
    		} else {
    			const { route } = window.mitm.files;
    			const newRoute = {};
    			const { routes } = obj;

    			for (let k in routes) {
    				newRoute[k] = route[k] ? route[k] : routes[k];
    				newRoute[k].content = routes[k].content;
    			}

    			$$invalidate(6, data = newRoute);
    			window.mitm.files.route = newRoute;
    		}

    		const { getRoute_events } = window.mitm.files;

    		for (let key in getRoute_events) {
    			getRoute_events[key](data);
    		}

    		rerender = rerender + 1;
    	};

    	window.mitm.files.route_events.routeTable = () => {
    		console.log("routeTable getting called!!!");
    		window.ws__send("getRoute", "", routeHandler);
    	};

    	let _timeout = null;

    	function editorChanged(e) {
    		const { editor: { _route } } = window.mitm;
    		let saveDisabled;

    		if (e === false) {
    			saveDisabled = true;

    			source.update(n => {
    				return {
    					...n,
    					saveDisabled: true,
    					editbuffer: _route.getValue()
    				};
    			});
    		}

    		_timeout && clearTimeout(_timeout);

    		_timeout = setTimeout(
    			() => {
    				if (_route) {
    					saveDisabled = _route.getValue() === $source.editbuffer;

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
    		$$invalidate(5, route = detail.left);
    		chrome.storage.local.set({ route });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("route" in $$props) $$invalidate(5, route = $$props.route);
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    		if ("_route" in $$props) $$invalidate(0, _route = $$props._route);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    		if ("$source" in $$props) source.set($source = $$props.$source);
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

    	return [_route, _data, editorChanged, dragend];
    }

    class Table$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    // feat: profile

    const source$1 = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: '',
      fpath: '',
      path: ''
    });

    /* d:\Projects\mitm-play\plugins\chrome\src\components\profile\Button.svelte generated by Svelte v3.16.7 */
    const file$q = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\profile\\Button.svelte";

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (71:0) {#if $source.path}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let t2;
    	let dispose;
    	let each_value = btns$1(/*$source*/ ctx[0].item);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
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
    			add_location(button, file$q, 76, 2, 1606);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$q, 71, 1, 1433);
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
    				each_value = btns$1(/*$source*/ ctx[0].item);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$b(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$b(child_ctx);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(71:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    // (73:2) {#each btns($source.item) as item}
    function create_each_block$b(ctx) {
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
    			add_location(button, file$q, 73, 2, 1500);
    			dispose = listen_dev(button, "click", btnTag$1, false, false, false);
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
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(73:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (82:0) {#if $source.path}
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
    			add_location(button0, file$q, 83, 2, 1804);
    			attr_dev(button1, "class", "tlb btn-plus svelte-11e4kdx");
    			add_location(button1, file$q, 84, 2, 1872);
    			attr_dev(button2, "class", "tlb btn-save svelte-11e4kdx");
    			button2.disabled = button2_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button2, file$q, 85, 2, 1940);
    			attr_dev(button3, "class", "tlb btn-open svelte-11e4kdx");
    			button3.disabled = button3_disabled_value = /*$source*/ ctx[0].openDisabled;
    			add_location(button3, file$q, 86, 2, 2040);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$q, 82, 1, 1774);

    			dispose = [
    				listen_dev(button0, "click", btnMin$1, false, false, false),
    				listen_dev(button1, "click", btnPlus$1, false, false, false),
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
    		source: "(82:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$2(ctx);
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
    			add_location(div, file$q, 79, 0, 1710);
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
    					if_block0 = create_if_block_1$2(ctx);
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
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnMin$1() {
    	const { editor: { _profile } } = window.mitm;
    	_profile && _profile.trigger("fold", "editor.foldAll");
    }

    function btnPlus$1() {
    	const { editor: { _profile } } = window.mitm;
    	_profile && _profile.trigger("unfold", "editor.unfoldAll");
    }

    function btns$1(id) {
    	const route = mitm.routes[id];

    	if (route && route.urls) {
    		return Object.keys(route.urls);
    	} else {
    		return [];
    	}
    }

    function btnTag$1(e) {
    	chrome.tabs.update({ url: e.target.dataset.url });
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(0, $source = $$value));

    	function btnSave(e) {
    		const { editor: { _profile } } = window.mitm;

    		if (_profile) {
    			const content = _profile.getValue();

    			source$1.update(n => {
    				return {
    					...n,
    					content,
    					saveDisabled: true,
    					editbuffer: content
    				};
    			});

    			console.log($source);

    			ws__send("saveProfile", $source, data => {
    				source$1.update(n => {
    					return { ...n, saveDisabled: true };
    				});

    				console.log("Done Save!");
    			});
    		}
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
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	return [$source, btnSave, btnOpen, btnUrl, btnGo];
    }

    class Button$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\profile\Item.svelte generated by Svelte v3.16.7 */

    const { console: console_1$3 } = globals;
    const file$r = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\profile\\Item.svelte";

    function create_fragment$w(ctx) {
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
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-1arv0rl");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$r, 68, 4, 1555);
    			attr_dev(td, "class", "svelte-1arv0rl");
    			add_location(td, file$r, 67, 2, 1546);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$r, 66, 0, 1528);
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

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-1arv0rl")) {
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
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(1, $source = $$value));
    	let { item } = $$props;
    	let { onChange } = $$props;

    	onMount(async () => {
    		const { editor: { _profile } } = window.mitm;
    		const element = window.document.getElementById("profile");

    		var ro = new ResizeObserver(entries => {
    				const { width: w, height: h } = entries[0].contentRect;
    				_profile && _profile.layout({ width: w, height: h });
    			});

    		ro.observe(element);
    		window.mitm.editor._profileEl = element;
    	});

    	function initCodeEditor(src) {
    		console.log("load monaco: profile");
    		const element = window.mitm.editor._profileEl;

    		const _profile = window.monaco.editor.create(element, {
    			language: "javascript",
    			minimap: { enabled: false },
    			value: ""
    		});

    		window.mitm.editor._profile = _profile;
    		_profile.onDidChangeModelContent(onChange);
    		_profile.setValue(src);
    	}

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const url = item;
    		const { editor: { _profile }, files } = window.mitm;
    		const obj = files.profile[item];
    		console.log(item, obj);

    		if (_profile === undefined) {
    			initCodeEditor(obj.content);
    		} else {
    			_profile.setValue(obj.content || "");
    			_profile.revealLine(1);
    		}

    		setTimeout(
    			() => {
    				onChange(false);

    				source$1.update(n => {
    					return {
    						...n,
    						goDisabled: url === undefined,
    						content: obj.content,
    						fpath: obj.fpath,
    						path: obj.path,
    						item
    					};
    				});
    			},
    			1
    		);
    	}

    	const writable_props = ["item", "onChange"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Item> was created with unknown prop '${key}'`);
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
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	return [item, $source, clickHandler, onChange];
    }

    class Item$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, { item: 0, onChange: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$w.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$3.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChange*/ ctx[3] === undefined && !("onChange" in props)) {
    			console_1$3.warn("<Item> was created without expected prop 'onChange'");
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

    /* d:\Projects\mitm-play\plugins\chrome\src\components\profile\Table.svelte generated by Svelte v3.16.7 */
    const file$s = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\profile\\Table.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (93:4) <BHeader>
    function create_default_slot_3$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("-profile(s)-");
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
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(93:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (95:6) {#each Object.keys(_data) as item}
    function create_each_block$c(ctx) {
    	let current;

    	const item = new Item$2({
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
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(95:6) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    // (94:4) <BTable>
    function create_default_slot_2$4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
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
    					const child_ctx = get_each_context$c(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$c(child_ctx);
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
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(94:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (92:2) <BStatic height="47">
    function create_default_slot_1$4(ctx) {
    	let t;
    	let current;

    	const bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_2$4] },
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
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(92:2) <BStatic height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    // (100:2) <BResize left={_profile} on:dragend={dragend} height="47">
    function create_default_slot$9(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "profile");
    			attr_dev(div0, "class", "svelte-1imtnte");
    			add_location(div0, file$s, 101, 6, 2597);
    			attr_dev(div1, "class", "edit-container svelte-1imtnte");
    			add_location(div1, file$s, 100, 4, 2562);
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
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(100:2) <BResize left={_profile} on:dragend={dragend} height=\\\"47\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$x(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let current;
    	const button = new Button$3({ $$inline: true });

    	const bstatic = new BStatic({
    			props: {
    				height: "47",
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const bresize = new BResize({
    			props: {
    				left: /*_profile*/ ctx[0],
    				height: "47",
    				$$slots: { default: [create_default_slot$9] },
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
    			attr_dev(div, "class", "vbox svelte-1imtnte");
    			add_location(div, file$s, 90, 0, 2245);
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
    			if (dirty & /*_profile*/ 1) bresize_changes.left = /*_profile*/ ctx[0];

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
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(8, $source = $$value));
    	let rerender = 0;
    	let profile = 163;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount profile");
    		_ws_connect.profileOnMount = () => ws__send("getProfile", "", profileHandler);

    		chrome.storage.local.get("profile", function (data) {
    			data.profile && $$invalidate(5, profile = data.profile);
    		});
    	});

    	const profileHandler = obj => {
    		console.warn("ws__send(getProfile)", obj);

    		if (window.mitm.files.profile === undefined) {
    			window.mitm.files.profile = obj;
    			$$invalidate(6, data = obj);
    		} else {
    			const { profile } = window.mitm.files;
    			const newprofile = {};

    			for (let k in obj) {
    				newprofile[k] = profile[k] ? profile[k] : obj[k];
    				newprofile[k].content = obj[k].content;
    			}

    			$$invalidate(6, data = newprofile);
    			window.mitm.files.profile = newprofile;
    		}

    		const { getProfile_events } = window.mitm.files;

    		for (let key in getProfile_events) {
    			getProfile_events[key](data);
    		}

    		rerender = rerender + 1;
    	};

    	window.mitm.files.profile_events.profileTable = () => {
    		console.log("profileTable getting called!!!");
    		window.ws__send("getProfile", "", profileHandler);
    	};

    	let _timeout = null;

    	function editorChanged(e) {
    		const { editor: { _profile } } = window.mitm;
    		let saveDisabled;

    		if (e === false) {
    			source$1.update(n => {
    				return {
    					...n,
    					saveDisabled: true,
    					editbuffer: _profile.getValue()
    				};
    			});
    		}

    		_timeout && clearTimeout(_timeout);

    		_timeout = setTimeout(
    			() => {
    				if (_profile) {
    					saveDisabled = _profile.getValue() === $source.editbuffer;

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
    		$$invalidate(5, profile = detail.left);
    		chrome.storage.local.set({ profile });
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("profile" in $$props) $$invalidate(5, profile = $$props.profile);
    		if ("data" in $$props) $$invalidate(6, data = $$props.data);
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    		if ("_profile" in $$props) $$invalidate(0, _profile = $$props._profile);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    		if ("$source" in $$props) source$1.set($source = $$props.$source);
    	};

    	let _profile;
    	let _data;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*profile*/ 32) {
    			 $$invalidate(0, _profile = profile);
    		}

    		if ($$self.$$.dirty & /*data*/ 64) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [_profile, _data, editorChanged, dragend];
    }

    class Table$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\other\OpenHome.svelte generated by Svelte v3.16.7 */

    const file$t = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\other\\OpenHome.svelte";

    function create_fragment$y(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open Home";
    			add_location(button, file$t, 8, 0, 129);
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
    		id: create_fragment$y.name,
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
    		init(this, options, null, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpenHome",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\other\CodeHome.svelte generated by Svelte v3.16.7 */

    const file$u = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\other\\CodeHome.svelte";

    function create_fragment$z(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Code Home";
    			add_location(button, file$u, 8, 0, 129);
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
    		id: create_fragment$z.name,
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
    		init(this, options, null, create_fragment$z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeHome",
    			options,
    			id: create_fragment$z.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\other\Postmessage.svelte generated by Svelte v3.16.7 */

    const file$v = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\other\\Postmessage.svelte";

    function create_fragment$A(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\n  Post Messages");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag();
    			add_location(input, file$v, 15, 2, 346);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$v, 14, 0, 319);
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
    		id: create_fragment$A.name,
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

    function flag() {
    	return window.mitm.client.postmessage;
    }

    class Postmessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$A, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Postmessage",
    			options,
    			id: create_fragment$A.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\other\Csp.svelte generated by Svelte v3.16.7 */

    const file$w = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\other\\Csp.svelte";

    function create_fragment$B(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\n  Content Sec. Policy");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag$1();
    			add_location(input, file$w, 15, 2, 290);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$w, 14, 0, 263);
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
    		id: create_fragment$B.name,
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

    function flag$1() {
    	return window.mitm.client.csp;
    }

    class Csp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$B, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Csp",
    			options,
    			id: create_fragment$B.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\components\other\Tab.svelte generated by Svelte v3.16.7 */
    const file$x = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\components\\other\\Tab.svelte";

    function create_fragment$C(ctx) {
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let t1;
    	let li2;
    	let t2;
    	let li3;
    	let current;
    	const openhome = new OpenHome({ $$inline: true });
    	const codehome = new CodeHome({ $$inline: true });
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
    			create_component(postmessage.$$.fragment);
    			t2 = space();
    			li3 = element("li");
    			create_component(csp.$$.fragment);
    			attr_dev(li0, "class", "svelte-eb1kd7");
    			add_location(li0, file$x, 8, 0, 189);
    			attr_dev(li1, "class", "svelte-eb1kd7");
    			add_location(li1, file$x, 9, 0, 210);
    			attr_dev(li2, "class", "svelte-eb1kd7");
    			add_location(li2, file$x, 10, 0, 231);
    			attr_dev(li3, "class", "svelte-eb1kd7");
    			add_location(li3, file$x, 11, 0, 255);
    			attr_dev(ul, "class", "svelte-eb1kd7");
    			add_location(ul, file$x, 7, 0, 184);
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
    			mount_component(postmessage, li2, null);
    			append_dev(ul, t2);
    			append_dev(ul, li3);
    			mount_component(csp, li3, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(openhome.$$.fragment, local);
    			transition_in(codehome.$$.fragment, local);
    			transition_in(postmessage.$$.fragment, local);
    			transition_in(csp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(openhome.$$.fragment, local);
    			transition_out(codehome.$$.fragment, local);
    			transition_out(postmessage.$$.fragment, local);
    			transition_out(csp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(openhome);
    			destroy_component(codehome);
    			destroy_component(postmessage);
    			destroy_component(csp);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$C.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Tab$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$C, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$C.name
    		});
    	}
    }

    /* d:\Projects\mitm-play\plugins\chrome\src\App.svelte generated by Svelte v3.16.7 */
    const file$y = "d:\\Projects\\mitm-play\\plugins\\chrome\\src\\App.svelte";

    // (25:2) <Tab label="Route">
    function create_default_slot_5(ctx) {
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
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(25:2) <Tab label=\\\"Route\\\">",
    		ctx
    	});

    	return block;
    }

    // (26:2) <Tab label="Profile">
    function create_default_slot_4(ctx) {
    	let current;
    	const profiletable = new Table$3({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(profiletable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(profiletable, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(profiletable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(profiletable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(profiletable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(26:2) <Tab label=\\\"Profile\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:2) <Tab label="Logs">
    function create_default_slot_3$3(ctx) {
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
    		id: create_default_slot_3$3.name,
    		type: "slot",
    		source: "(27:2) <Tab label=\\\"Logs\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:2) <Tab label="Tags">
    function create_default_slot_2$5(ctx) {
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
    		id: create_default_slot_2$5.name,
    		type: "slot",
    		source: "(28:2) <Tab label=\\\"Tags\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:2) <Tab label="Other">
    function create_default_slot_1$5(ctx) {
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
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(29:2) <Tab label=\\\"Other\\\">",
    		ctx
    	});

    	return block;
    }

    // (24:0) <Tabs style="is-boxed" size="is-small">
    function create_default_slot$a(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let current;

    	const tab0 = new Tab({
    			props: {
    				label: "Route",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab1 = new Tab({
    			props: {
    				label: "Profile",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab2 = new Tab({
    			props: {
    				label: "Logs",
    				$$slots: { default: [create_default_slot_3$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab3 = new Tab({
    			props: {
    				label: "Tags",
    				$$slots: { default: [create_default_slot_2$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tab4 = new Tab({
    			props: {
    				label: "Other",
    				$$slots: { default: [create_default_slot_1$5] },
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
    			t3 = space();
    			create_component(tab4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(tab3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(tab4, target, anchor);
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
    			const tab4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tab4_changes.$$scope = { dirty, ctx };
    			}

    			tab4.$set(tab4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			transition_in(tab3.$$.fragment, local);
    			transition_in(tab4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			transition_out(tab3.$$.fragment, local);
    			transition_out(tab4.$$.fragment, local);
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
    			if (detaching) detach_dev(t3);
    			destroy_component(tab4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(24:0) <Tabs style=\\\"is-boxed\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$D(ctx) {
    	let main;
    	let current;

    	const tabs = new Tabs({
    			props: {
    				style: "is-boxed",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			attr_dev(main, "class", "main");
    			add_location(main, file$y, 22, 0, 694);
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
    		id: create_fragment$D.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$y($$self) {
    	onMount(async () => {
    		setTimeout(
    			() => {
    				const node = document.querySelector("nav.tabs>ul");
    				const li = document.createElement("LI");
    				li.innerHTML = "v" + window.mitm.version;
    				li.classList.add("version");
    				node.appendChild(li);
    			},
    			10
    		);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$y, create_fragment$D, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$D.name
    		});
    	}
    }

    /* global chrome */

    console.log('Load MITM plugin');

    function toRegex (str, flags = '') {
      return new RegExp(str
        .replace(/\//g, '\\/')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '\\?'), flags)
    }

    window.mitm.fn.toRegex = toRegex;
    window.mitm.editor = {};
    window.mitm.browser = {
      chgUrl_events: {},
      activeUrl: '',
      page: {}
    };

    function chgUrl (url) {
      if (!url) {
        return
      }
      console.log('Chg url:', url);
      const { browser } = window.mitm;
      browser.activeUrl = url;
      for (const e in browser.chgUrl_events) {
        browser.chgUrl_events[e]();
      }
    }

    function getUrl () {
      chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
        function (tabs) {
          const url = tabs[0].url;
          chgUrl(url);
        }
      );
    }
    let debounce;
    let firstRunTabsOnUpdated = 1;
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (firstRunTabsOnUpdated) {
        console.log('first run chrome.tabs.onUpdated');
        firstRunTabsOnUpdated = 0;
      }
      if (!tab.active) {
        return
      }

      const { browser } = window.mitm;
      browser.page = {
        ...browser.page,
        ...changeInfo,
        ...tab
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

    let firstRunTabsOnActivated = 1;
    chrome.tabs.onActivated.addListener(function (activeInfo) {
      if (firstRunTabsOnActivated) {
        console.log('first run chrome.tabs.onActivated');
        firstRunTabsOnActivated = 0;
      }
      // console.log('Tab Change!!!', activeInfo);
      getUrl();
    });

    const app = new App({ target: document.body });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvbm9kZV9tb2R1bGVzL3N2ZWx0ZS9pbnRlcm5hbC9pbmRleC5tanMiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvbm9kZV9tb2R1bGVzL3N2ZWxtYS9zcmMvY29tcG9uZW50cy9JY29uLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9ub2RlX21vZHVsZXMvc3ZlbHRlL21vdGlvbi9pbmRleC5tanMiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvbm9kZV9tb2R1bGVzL3N2ZWxtYS9zcmMvY29tcG9uZW50cy9UYWJzL1RhYnMuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3RhZ3Mvc3RvcmVzLmpzIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL2JveC9CU3RhdGljLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy90YWdzL0J1dHRvbi5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzMV8uc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczJfMS5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzMl8uc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfMy5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzM18yLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MzXzEuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy90YWdzL1RhYmxlLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9sb2dzL3N0b3Jlcy5qcyIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9vdGhlci9zdG9yZXMuanMiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvYm94L1NwbGl0dGVyLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9ib3gvQlJlc2l6ZS5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvbG9ncy9CdXR0b24uc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL2xvZ3MvSXRlbS5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvbG9ncy90YWIuanMiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvbG9ncy9CdXR0b24yLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9sb2dzL0Jhc2VUYWIuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL2xvZ3MvSnNvbi5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvbG9ncy9IdG1sLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9sb2dzL1RleHQuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL2xvZ3MvQ3NzLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9sb2dzL0pzLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9sb2dzL1Nob3cuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL2xvZ3MvVGFibGUuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3JvdXRlL3N0b3Jlcy5qcyIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9yb3V0ZS9CdXR0b24uc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3JvdXRlL0l0ZW0uc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL3JvdXRlL1RhYmxlLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9wcm9maWxlL3N0b3Jlcy5qcyIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9wcm9maWxlL0J1dHRvbi5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9JdGVtLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9wcm9maWxlL1RhYmxlLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9vdGhlci9PcGVuSG9tZS5zdmVsdGUiLCJkOi9Qcm9qZWN0cy9taXRtLXBsYXkvcGx1Z2lucy9jaHJvbWUvc3JjL2NvbXBvbmVudHMvb3RoZXIvQ29kZUhvbWUuc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9jb21wb25lbnRzL290aGVyL1Bvc3RtZXNzYWdlLnN2ZWx0ZSIsImQ6L1Byb2plY3RzL21pdG0tcGxheS9wbHVnaW5zL2Nocm9tZS9zcmMvY29tcG9uZW50cy9vdGhlci9Dc3Auc3ZlbHRlIiwiZDovUHJvamVjdHMvbWl0bS1wbGF5L3BsdWdpbnMvY2hyb21lL3NyYy9BcHAuc3ZlbHRlIiwiLi4vc3JjL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gbm9vcCgpIHsgfVxuY29uc3QgaWRlbnRpdHkgPSB4ID0+IHg7XG5mdW5jdGlvbiBhc3NpZ24odGFyLCBzcmMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZm9yIChjb25zdCBrIGluIHNyYylcbiAgICAgICAgdGFyW2tdID0gc3JjW2tdO1xuICAgIHJldHVybiB0YXI7XG59XG5mdW5jdGlvbiBpc19wcm9taXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBhZGRfbG9jYXRpb24oZWxlbWVudCwgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyKSB7XG4gICAgZWxlbWVudC5fX3N2ZWx0ZV9tZXRhID0ge1xuICAgICAgICBsb2M6IHsgZmlsZSwgbGluZSwgY29sdW1uLCBjaGFyIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gcnVuKGZuKSB7XG4gICAgcmV0dXJuIGZuKCk7XG59XG5mdW5jdGlvbiBibGFua19vYmplY3QoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5mdW5jdGlvbiBydW5fYWxsKGZucykge1xuICAgIGZucy5mb3JFYWNoKHJ1bik7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09ICdmdW5jdGlvbic7XG59XG5mdW5jdGlvbiBzYWZlX25vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxuZnVuY3Rpb24gbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYjtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3N0b3JlKHN0b3JlLCBuYW1lKSB7XG4gICAgaWYgKCFzdG9yZSB8fCB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgdW5zdWIgPSBzdG9yZS5zdWJzY3JpYmUoY2FsbGJhY2spO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAodHlwZW9mICQkc2NvcGUuZGlydHkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUgPSByZXQpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCkge1xuICAgIGNvbnN0IHZhbHVlID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLnB1c2goZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyB1bmRlZmluZWQgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gY2xhaW1fZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcywgc3ZnKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKVxuICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdOyAvLyBUT0RPIHN0cmlwIHVud2FudGVkIGF0dHJpYnV0ZXNcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3ZnID8gc3ZnX2VsZW1lbnQobmFtZSkgOiBlbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gY2xhaW1fdGV4dChub2RlcywgZGF0YSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gJycgKyBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dChkYXRhKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3NwYWNlKG5vZGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX3RleHQobm9kZXMsICcgJyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC5kYXRhICE9PSBkYXRhKVxuICAgICAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3ZhbHVlKGlucHV0LCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsIHx8IGlucHV0LnZhbHVlKSB7XG4gICAgICAgIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdHlsZShub2RlLCBrZXksIHZhbHVlLCBpbXBvcnRhbnQpIHtcbiAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgaWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihlbGVtZW50LCBmbikge1xuICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xuICAgICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICB9XG4gICAgY29uc3Qgb2JqZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2JqZWN0Jyk7XG4gICAgb2JqZWN0LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTogYmxvY2s7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBsZWZ0OiAwOyBoZWlnaHQ6IDEwMCU7IHdpZHRoOiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTE7Jyk7XG4gICAgb2JqZWN0LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIG9iamVjdC50eXBlID0gJ3RleHQvaHRtbCc7XG4gICAgb2JqZWN0LnRhYkluZGV4ID0gLTE7XG4gICAgbGV0IHdpbjtcbiAgICBvYmplY3Qub25sb2FkID0gKCkgPT4ge1xuICAgICAgICB3aW4gPSBvYmplY3QuY29udGVudERvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZm4pO1xuICAgIH07XG4gICAgaWYgKC9UcmlkZW50Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQob2JqZWN0KTtcbiAgICAgICAgb2JqZWN0LmRhdGEgPSAnYWJvdXQ6YmxhbmsnO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb2JqZWN0LmRhdGEgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKG9iamVjdCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGNhbmNlbDogKCkgPT4ge1xuICAgICAgICAgICAgd2luICYmIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyICYmIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmbik7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKG9iamVjdCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCkge1xuICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBlLmluaXRDdXN0b21FdmVudCh0eXBlLCBmYWxzZSwgZmFsc2UsIGRldGFpbCk7XG4gICAgcmV0dXJuIGU7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihodG1sLCBhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZSA9IGVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmEgPSBhbmNob3I7XG4gICAgICAgIHRoaXMudShodG1sKTtcbiAgICB9XG4gICAgbSh0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0YXJnZXQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIHUoaHRtbCkge1xuICAgICAgICB0aGlzLmUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgdGhpcy5uID0gQXJyYXkuZnJvbSh0aGlzLmUuY2hpbGROb2Rlcyk7XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy51KGh0bWwpO1xuICAgICAgICB0aGlzLm0odGhpcy50LCB0aGlzLmEpO1xuICAgIH1cbiAgICBkKCkge1xuICAgICAgICB0aGlzLm4uZm9yRWFjaChkZXRhY2gpO1xuICAgIH1cbn1cblxubGV0IHN0eWxlc2hlZXQ7XG5sZXQgYWN0aXZlID0gMDtcbmxldCBjdXJyZW50X3J1bGVzID0ge307XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3J1bGUobm9kZSwgYSwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNlLCBmbiwgdWlkID0gMCkge1xuICAgIGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcbiAgICBsZXQga2V5ZnJhbWVzID0gJ3tcXG4nO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDw9IDE7IHAgKz0gc3RlcCkge1xuICAgICAgICBjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuICAgICAgICBrZXlmcmFtZXMgKz0gcCAqIDEwMCArIGAleyR7Zm4odCwgMSAtIHQpfX1cXG5gO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcbiAgICBjb25zdCBuYW1lID0gYF9fc3ZlbHRlXyR7aGFzaChydWxlKX1fJHt1aWR9YDtcbiAgICBpZiAoIWN1cnJlbnRfcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgaWYgKCFzdHlsZXNoZWV0KSB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZSA9IGVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAgICAgICAgIHN0eWxlc2hlZXQgPSBzdHlsZS5zaGVldDtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogYGB9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpXG4gICAgICAgIC5zcGxpdCgnLCAnKVxuICAgICAgICAuZmlsdGVyKG5hbWVcbiAgICAgICAgPyBhbmltID0+IGFuaW0uaW5kZXhPZihuYW1lKSA8IDAgLy8gcmVtb3ZlIHNwZWNpZmljIGFuaW1hdGlvblxuICAgICAgICA6IGFuaW0gPT4gYW5pbS5pbmRleE9mKCdfX3N2ZWx0ZScpID09PSAtMSAvLyByZW1vdmUgYWxsIFN2ZWx0ZSBhbmltYXRpb25zXG4gICAgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICBpZiAobmFtZSAmJiAhLS1hY3RpdmUpXG4gICAgICAgIGNsZWFyX3J1bGVzKCk7XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuICAgICAgICBjdXJyZW50X3J1bGVzID0ge307XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb25gKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBjb25zdCBzZWVuX2NhbGxiYWNrcyA9IG5ldyBTZXQoKTtcbiAgICBkbyB7XG4gICAgICAgIC8vIGZpcnN0LCBjYWxsIGJlZm9yZVVwZGF0ZSBmdW5jdGlvbnNcbiAgICAgICAgLy8gYW5kIHVwZGF0ZSBjb21wb25lbnRzXG4gICAgICAgIHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZGlydHlfY29tcG9uZW50cy5zaGlmdCgpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG59XG5mdW5jdGlvbiB1cGRhdGUoJCQpIHtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgJCQudXBkYXRlKCk7XG4gICAgICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgICAgIGNvbnN0IGRpcnR5ID0gJCQuZGlydHk7XG4gICAgICAgICQkLmRpcnR5ID0gWy0xXTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQucCgkJC5jdHgsIGRpcnR5KTtcbiAgICAgICAgJCQuYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG4gICAgfVxufVxuXG5sZXQgcHJvbWlzZTtcbmZ1bmN0aW9uIHdhaXQoKSB7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHByb21pc2UgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBkaXNwYXRjaChub2RlLCBkaXJlY3Rpb24sIGtpbmQpIHtcbiAgICBub2RlLmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KGAke2RpcmVjdGlvbiA/ICdpbnRybycgOiAnb3V0cm8nfSR7a2luZH1gKSk7XG59XG5jb25zdCBvdXRyb2luZyA9IG5ldyBTZXQoKTtcbmxldCBvdXRyb3M7XG5mdW5jdGlvbiBncm91cF9vdXRyb3MoKSB7XG4gICAgb3V0cm9zID0ge1xuICAgICAgICByOiAwLFxuICAgICAgICBjOiBbXSxcbiAgICAgICAgcDogb3V0cm9zIC8vIHBhcmVudCBncm91cFxuICAgIH07XG59XG5mdW5jdGlvbiBjaGVja19vdXRyb3MoKSB7XG4gICAgaWYgKCFvdXRyb3Mucikge1xuICAgICAgICBydW5fYWxsKG91dHJvcy5jKTtcbiAgICB9XG4gICAgb3V0cm9zID0gb3V0cm9zLnA7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX2luKGJsb2NrLCBsb2NhbCkge1xuICAgIGlmIChibG9jayAmJiBibG9jay5pKSB7XG4gICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgIGJsb2NrLmkobG9jYWwpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25fb3V0KGJsb2NrLCBsb2NhbCwgZGV0YWNoLCBjYWxsYmFjaykge1xuICAgIGlmIChibG9jayAmJiBibG9jay5vKSB7XG4gICAgICAgIGlmIChvdXRyb2luZy5oYXMoYmxvY2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBvdXRyb2luZy5hZGQoYmxvY2spO1xuICAgICAgICBvdXRyb3MuYy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dHJvaW5nLmRlbGV0ZShibG9jayk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoKVxuICAgICAgICAgICAgICAgICAgICBibG9jay5kKDEpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBibG9jay5vKGxvY2FsKTtcbiAgICB9XG59XG5jb25zdCBudWxsX3RyYW5zaXRpb24gPSB7IGR1cmF0aW9uOiAwIH07XG5mdW5jdGlvbiBjcmVhdGVfaW5fdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHVpZCA9IDA7XG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcywgdWlkKyspO1xuICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGlmICh0YXNrKVxuICAgICAgICAgICAgdGFzay5hYm9ydCgpO1xuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCB0cnVlLCAnc3RhcnQnKSk7XG4gICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSk7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKGdvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVuZCgpIHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfb3V0X3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWU7XG4gICAgY29uc3QgZ3JvdXAgPSBvdXRyb3M7XG4gICAgZ3JvdXAuciArPSAxO1xuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAxLCAwLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnc3RhcnQnKSk7XG4gICAgICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDAsIDEpO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIS0tZ3JvdXAucikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB3aWxsIHJlc3VsdCBpbiBgZW5kKClgIGJlaW5nIGNhbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGRvbid0IG5lZWQgdG8gY2xlYW4gdXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVuX2FsbChncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gc3RhcnRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZWFzaW5nKChub3cgLSBzdGFydF90aW1lKSAvIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdGljaygxIC0gdCwgdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmc7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICB3YWl0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgIGdvKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW5kKHJlc2V0KSB7XG4gICAgICAgICAgICBpZiAocmVzZXQgJiYgY29uZmlnLnRpY2spIHtcbiAgICAgICAgICAgICAgICBjb25maWcudGljaygxLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcywgaW50cm8pIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgdCA9IGludHJvID8gMCA6IDE7XG4gICAgbGV0IHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lID0gbnVsbDtcbiAgICBmdW5jdGlvbiBjbGVhcl9hbmltYXRpb24oKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5pdChwcm9ncmFtLCBkdXJhdGlvbikge1xuICAgICAgICBjb25zdCBkID0gcHJvZ3JhbS5iIC0gdDtcbiAgICAgICAgZHVyYXRpb24gKj0gTWF0aC5hYnMoZCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhOiB0LFxuICAgICAgICAgICAgYjogcHJvZ3JhbS5iLFxuICAgICAgICAgICAgZCxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgc3RhcnQ6IHByb2dyYW0uc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IHByb2dyYW0uc3RhcnQgKyBkdXJhdGlvbixcbiAgICAgICAgICAgIGdyb3VwOiBwcm9ncmFtLmdyb3VwXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKGIpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgY29uc3QgcHJvZ3JhbSA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiBub3coKSArIGRlbGF5LFxuICAgICAgICAgICAgYlxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBwcm9ncmFtLmdyb3VwID0gb3V0cm9zO1xuICAgICAgICAgICAgb3V0cm9zLnIgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ja3NbaV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiB3ZSBwcmV2aW91c2x5IGhhZCBhIHRoZW4vY2F0Y2ggYmxvY2ssIGRlc3Ryb3kgaXRcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby5wZW5kaW5nKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby5wZW5kaW5nLCAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnRoZW4pIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHByb21pc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHByb21pc2U7XG4gICAgfVxufVxuXG5jb25zdCBnbG9iYWxzID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKTtcblxuZnVuY3Rpb24gZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZCgxKTtcbiAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG59XG5mdW5jdGlvbiBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gZml4X2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9rZXllZF9lYWNoKG9sZF9ibG9ja3MsIGRpcnR5LCBnZXRfa2V5LCBkeW5hbWljLCBjdHgsIGxpc3QsIGxvb2t1cCwgbm9kZSwgZGVzdHJveSwgY3JlYXRlX2VhY2hfYmxvY2ssIG5leHQsIGdldF9jb250ZXh0KSB7XG4gICAgbGV0IG8gPSBvbGRfYmxvY2tzLmxlbmd0aDtcbiAgICBsZXQgbiA9IGxpc3QubGVuZ3RoO1xuICAgIGxldCBpID0gbztcbiAgICBjb25zdCBvbGRfaW5kZXhlcyA9IHt9O1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIG9sZF9pbmRleGVzW29sZF9ibG9ja3NbaV0ua2V5XSA9IGk7XG4gICAgY29uc3QgbmV3X2Jsb2NrcyA9IFtdO1xuICAgIGNvbnN0IG5ld19sb29rdXAgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgZGVsdGFzID0gbmV3IE1hcCgpO1xuICAgIGkgPSBuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgY2hpbGRfY3R4ID0gZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKTtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgYmxvY2sgPSBsb29rdXAuZ2V0KGtleSk7XG4gICAgICAgIGlmICghYmxvY2spIHtcbiAgICAgICAgICAgIGJsb2NrID0gY3JlYXRlX2VhY2hfYmxvY2soa2V5LCBjaGlsZF9jdHgpO1xuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR5bmFtaWMpIHtcbiAgICAgICAgICAgIGJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3X2xvb2t1cC5zZXQoa2V5LCBuZXdfYmxvY2tzW2ldID0gYmxvY2spO1xuICAgICAgICBpZiAoa2V5IGluIG9sZF9pbmRleGVzKVxuICAgICAgICAgICAgZGVsdGFzLnNldChrZXksIE1hdGguYWJzKGkgLSBvbGRfaW5kZXhlc1trZXldKSk7XG4gICAgfVxuICAgIGNvbnN0IHdpbGxfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBkaWRfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBmdW5jdGlvbiBpbnNlcnQoYmxvY2spIHtcbiAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgIGJsb2NrLm0obm9kZSwgbmV4dCk7XG4gICAgICAgIGxvb2t1cC5zZXQoYmxvY2sua2V5LCBibG9jayk7XG4gICAgICAgIG5leHQgPSBibG9jay5maXJzdDtcbiAgICAgICAgbi0tO1xuICAgIH1cbiAgICB3aGlsZSAobyAmJiBuKSB7XG4gICAgICAgIGNvbnN0IG5ld19ibG9jayA9IG5ld19ibG9ja3NbbiAtIDFdO1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW28gLSAxXTtcbiAgICAgICAgY29uc3QgbmV3X2tleSA9IG5ld19ibG9jay5rZXk7XG4gICAgICAgIGNvbnN0IG9sZF9rZXkgPSBvbGRfYmxvY2sua2V5O1xuICAgICAgICBpZiAobmV3X2Jsb2NrID09PSBvbGRfYmxvY2spIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgICAgIG5leHQgPSBuZXdfYmxvY2suZmlyc3Q7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgICAgICBuLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgb2xkIGJsb2NrXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbG9va3VwLmhhcyhuZXdfa2V5KSB8fCB3aWxsX21vdmUuaGFzKG5ld19rZXkpKSB7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkaWRfbW92ZS5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZWx0YXMuZ2V0KG5ld19rZXkpID4gZGVsdGFzLmdldChvbGRfa2V5KSkge1xuICAgICAgICAgICAgZGlkX21vdmUuYWRkKG5ld19rZXkpO1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aWxsX21vdmUuYWRkKG9sZF9rZXkpO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChvLS0pIHtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvXTtcbiAgICAgICAgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfYmxvY2sua2V5KSlcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgIH1cbiAgICB3aGlsZSAobilcbiAgICAgICAgaW5zZXJ0KG5ld19ibG9ja3NbbiAtIDFdKTtcbiAgICByZXR1cm4gbmV3X2Jsb2Nrcztcbn1cbmZ1bmN0aW9uIG1lYXN1cmUoYmxvY2tzKSB7XG4gICAgY29uc3QgcmVjdHMgPSB7fTtcbiAgICBsZXQgaSA9IGJsb2Nrcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgcmVjdHNbYmxvY2tzW2ldLmtleV0gPSBibG9ja3NbaV0ubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4gcmVjdHM7XG59XG5cbmZ1bmN0aW9uIGdldF9zcHJlYWRfdXBkYXRlKGxldmVscywgdXBkYXRlcykge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHt9O1xuICAgIGNvbnN0IHRvX251bGxfb3V0ID0ge307XG4gICAgY29uc3QgYWNjb3VudGVkX2ZvciA9IHsgJCRzY29wZTogMSB9O1xuICAgIGxldCBpID0gbGV2ZWxzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IG8gPSBsZXZlbHNbaV07XG4gICAgICAgIGNvbnN0IG4gPSB1cGRhdGVzW2ldO1xuICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiBuKSlcbiAgICAgICAgICAgICAgICAgICAgdG9fbnVsbF9vdXRba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBuKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhY2NvdW50ZWRfZm9yW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlW2tleV0gPSBuW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV2ZWxzW2ldID0gbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIHRvX251bGxfb3V0KSB7XG4gICAgICAgIGlmICghKGtleSBpbiB1cGRhdGUpKVxuICAgICAgICAgICAgdXBkYXRlW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1cGRhdGU7XG59XG5mdW5jdGlvbiBnZXRfc3ByZWFkX29iamVjdChzcHJlYWRfcHJvcHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHNwcmVhZF9wcm9wcyA9PT0gJ29iamVjdCcgJiYgc3ByZWFkX3Byb3BzICE9PSBudWxsID8gc3ByZWFkX3Byb3BzIDoge307XG59XG5cbi8vIHNvdXJjZTogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5kaWNlcy5odG1sXG5jb25zdCBib29sZWFuX2F0dHJpYnV0ZXMgPSBuZXcgU2V0KFtcbiAgICAnYWxsb3dmdWxsc2NyZWVuJyxcbiAgICAnYWxsb3dwYXltZW50cmVxdWVzdCcsXG4gICAgJ2FzeW5jJyxcbiAgICAnYXV0b2ZvY3VzJyxcbiAgICAnYXV0b3BsYXknLFxuICAgICdjaGVja2VkJyxcbiAgICAnY29udHJvbHMnLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVmZXInLFxuICAgICdkaXNhYmxlZCcsXG4gICAgJ2Zvcm1ub3ZhbGlkYXRlJyxcbiAgICAnaGlkZGVuJyxcbiAgICAnaXNtYXAnLFxuICAgICdsb29wJyxcbiAgICAnbXVsdGlwbGUnLFxuICAgICdtdXRlZCcsXG4gICAgJ25vbW9kdWxlJyxcbiAgICAnbm92YWxpZGF0ZScsXG4gICAgJ29wZW4nLFxuICAgICdwbGF5c2lubGluZScsXG4gICAgJ3JlYWRvbmx5JyxcbiAgICAncmVxdWlyZWQnLFxuICAgICdyZXZlcnNlZCcsXG4gICAgJ3NlbGVjdGVkJ1xuXSk7XG5cbmNvbnN0IGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyID0gL1tcXHMnXCI+Lz1cXHV7RkREMH0tXFx1e0ZERUZ9XFx1e0ZGRkV9XFx1e0ZGRkZ9XFx1ezFGRkZFfVxcdXsxRkZGRn1cXHV7MkZGRkV9XFx1ezJGRkZGfVxcdXszRkZGRX1cXHV7M0ZGRkZ9XFx1ezRGRkZFfVxcdXs0RkZGRn1cXHV7NUZGRkV9XFx1ezVGRkZGfVxcdXs2RkZGRX1cXHV7NkZGRkZ9XFx1ezdGRkZFfVxcdXs3RkZGRn1cXHV7OEZGRkV9XFx1ezhGRkZGfVxcdXs5RkZGRX1cXHV7OUZGRkZ9XFx1e0FGRkZFfVxcdXtBRkZGRn1cXHV7QkZGRkV9XFx1e0JGRkZGfVxcdXtDRkZGRX1cXHV7Q0ZGRkZ9XFx1e0RGRkZFfVxcdXtERkZGRn1cXHV7RUZGRkV9XFx1e0VGRkZGfVxcdXtGRkZGRX1cXHV7RkZGRkZ9XFx1ezEwRkZGRX1cXHV7MTBGRkZGfV0vdTtcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2F0dHJpYnV0ZXMtMlxuLy8gaHR0cHM6Ly9pbmZyYS5zcGVjLndoYXR3Zy5vcmcvI25vbmNoYXJhY3RlclxuZnVuY3Rpb24gc3ByZWFkKGFyZ3MsIGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzID0gY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzICs9ICcgJyArIGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gXCIgXCIgKyBuYW1lO1xuICAgICAgICBlbHNlIGlmIChib29sZWFuX2F0dHJpYnV0ZXMuaGFzKG5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICBzdHIgKz0gXCIgXCIgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBcIiBcIiArIG5hbWUgKyBcIj1cIiArIEpTT04uc3RyaW5naWZ5KFN0cmluZyh2YWx1ZSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgJyYjMzQ7JylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cykge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgICAgIC8vIHRoZXNlIHdpbGwgYmUgaW1tZWRpYXRlbHkgZGlzY2FyZGVkXG4gICAgICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpXG4gICAgICAgIH07XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudCh7ICQkIH0pO1xuICAgICAgICBjb25zdCBodG1sID0gZm4ocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiAocHJvcHMgPSB7fSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgICAgICBvbl9kZXN0cm95ID0gW107XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICByZXR1cm4gYCAke25hbWV9JHt2YWx1ZSA9PT0gdHJ1ZSA/ICcnIDogYD0ke3R5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeShlc2NhcGUodmFsdWUpKSA6IGBcIiR7dmFsdWV9XCJgfWB9YDtcbn1cbmZ1bmN0aW9uIGFkZF9jbGFzc2VzKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gY2xhc3NlcyA/IGAgY2xhc3M9XCIke2NsYXNzZXN9XCJgIDogYGA7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yKSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgb25fbW91bnQsIG9uX2Rlc3Ryb3ksIGFmdGVyX3VwZGF0ZSB9ID0gY29tcG9uZW50LiQkO1xuICAgIGZyYWdtZW50ICYmIGZyYWdtZW50Lm0odGFyZ2V0LCBhbmNob3IpO1xuICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV3X29uX2Rlc3Ryb3kgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICBpZiAob25fZGVzdHJveSkge1xuICAgICAgICAgICAgb25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgLy8gbW9zdCBsaWtlbHkgYXMgYSByZXN1bHQgb2YgYSBiaW5kaW5nIGluaXRpYWxpc2luZ1xuICAgICAgICAgICAgcnVuX2FsbChuZXdfb25fZGVzdHJveSk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcG9uZW50LiQkLm9uX21vdW50ID0gW107XG4gICAgfSk7XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgcHJvcF92YWx1ZXMgPSBvcHRpb25zLnByb3BzIHx8IHt9O1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkID0ge1xuICAgICAgICBmcmFnbWVudDogbnVsbCxcbiAgICAgICAgY3R4OiBudWxsLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICBjb250ZXh0OiBuZXcgTWFwKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSksXG4gICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICBkaXJ0eVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCB2YWx1ZSA9IHJldCkgPT4ge1xuICAgICAgICAgICAgaWYgKCQkLmN0eCAmJiBub3RfZXF1YWwoJCQuY3R4W2ldLCAkJC5jdHhbaV0gPSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCQuYm91bmRbaV0pXG4gICAgICAgICAgICAgICAgICAgICQkLmJvdW5kW2ldKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkpXG4gICAgICAgICAgICAgICAgICAgIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pXG4gICAgICAgIDogW107XG4gICAgJCQudXBkYXRlKCk7XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgLy8gYGZhbHNlYCBhcyBhIHNwZWNpYWwgY2FzZSBvZiBubyBET00gY29tcG9uZW50XG4gICAgJCQuZnJhZ21lbnQgPSBjcmVhdGVfZnJhZ21lbnQgPyBjcmVhdGVfZnJhZ21lbnQoJCQuY3R4KSA6IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnRhcmdldCkge1xuICAgICAgICBpZiAob3B0aW9ucy5oeWRyYXRlKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChjaGlsZHJlbihvcHRpb25zLnRhcmdldCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnRybylcbiAgICAgICAgICAgIHRyYW5zaXRpb25faW4oY29tcG9uZW50LiQkLmZyYWdtZW50KTtcbiAgICAgICAgbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgb3B0aW9ucy50YXJnZXQsIG9wdGlvbnMuYW5jaG9yKTtcbiAgICAgICAgZmx1c2goKTtcbiAgICB9XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xufVxubGV0IFN2ZWx0ZUVsZW1lbnQ7XG5pZiAodHlwZW9mIEhUTUxFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgU3ZlbHRlRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLiQkLnNsb3R0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy4kJC5zbG90dGVkW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyLCBfb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzW2F0dHJdID0gbmV3VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgJGRlc3Ryb3koKSB7XG4gICAgICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgICAgICB9XG4gICAgICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gVE9ETyBzaG91bGQgdGhpcyBkZWxlZ2F0ZSB0byBhZGRFdmVudExpc3RlbmVyP1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAkc2V0KCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGRlbiBieSBpbnN0YW5jZSwgaWYgaXQgaGFzIHByb3BzXG4gICAgICAgIH1cbiAgICB9O1xufVxuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgpIHtcbiAgICAgICAgLy8gb3ZlcnJpZGRlbiBieSBpbnN0YW5jZSwgaWYgaXQgaGFzIHByb3BzXG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaF9kZXYodHlwZSwgZGV0YWlsKSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTUluc2VydFwiLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmQodGFyZ2V0LCBub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydF9kZXYodGFyZ2V0LCBub2RlLCBhbmNob3IpIHtcbiAgICBkaXNwYXRjaF9kZXYoXCJTdmVsdGVET01JbnNlcnRcIiwgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlXCIsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFtcImNhcHR1cmVcIl0gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KFwiU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lclwiLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldEF0dHJpYnV0ZVwiLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldFByb3BlcnR5XCIsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFzZXRcIiwgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQuZGF0YSA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldihcIlN2ZWx0ZURPTVNldERhdGFcIiwgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5jbGFzcyBTdmVsdGVDb21wb25lbnREZXYgZXh0ZW5kcyBTdmVsdGVDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICghb3B0aW9ucy50YXJnZXQgJiYgIW9wdGlvbnMuJCRpbmxpbmUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCd0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uYCk7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluZmluaXRlIGxvb3AgZGV0ZWN0ZWRgKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX3NwYWNlLCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Z1bmN0aW9uLCBpc19wcm9taXNlLCBsaXN0ZW4sIGxpc3Rlbl9kZXYsIGxvb3AsIGxvb3BfZ3VhcmQsIG1lYXN1cmUsIG1pc3NpbmdfY29tcG9uZW50LCBtb3VudF9jb21wb25lbnQsIG5vb3AsIG5vdF9lcXVhbCwgbm93LCBudWxsX3RvX2VtcHR5LCBvYmplY3Rfd2l0aG91dF9wcm9wZXJ0aWVzLCBvbkRlc3Ryb3ksIG9uTW91bnQsIG9uY2UsIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBwcmV2ZW50X2RlZmF1bHQsIHByb3BfZGV2LCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2RhdGEsIHNldF9kYXRhX2Rldiwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwcmVhZCwgc3RvcF9wcm9wYWdhdGlvbiwgc3Vic2NyaWJlLCBzdmdfZWxlbWVudCwgdGV4dCwgdGljaywgdGltZV9yYW5nZXNfdG9fYXJyYXksIHRvX251bWJlciwgdG9nZ2xlX2NsYXNzLCB0cmFuc2l0aW9uX2luLCB0cmFuc2l0aW9uX291dCwgdXBkYXRlX2tleWVkX2VhY2gsIHZhbGlkYXRlX2NvbXBvbmVudCwgdmFsaWRhdGVfc3RvcmUsIHhsaW5rX2F0dHIgfTtcbiIsIjxzY3JpcHQ+XG4gIGV4cG9ydCBsZXQgdHlwZSA9ICcnXG4gIGV4cG9ydCBsZXQgcGFjayA9ICdmYXMnXG4gIGV4cG9ydCBsZXQgaWNvblxuICBleHBvcnQgbGV0IHNpemUgPSAnJ1xuICBleHBvcnQgbGV0IGN1c3RvbUNsYXNzID0gJydcbiAgZXhwb3J0IGxldCBjdXN0b21TaXplID0gJydcbiAgZXhwb3J0IGxldCBpc0NsaWNrYWJsZSA9IGZhbHNlXG4gIGV4cG9ydCBsZXQgaXNMZWZ0ID0gZmFsc2VcbiAgZXhwb3J0IGxldCBpc1JpZ2h0ID0gZmFsc2VcblxuICBsZXQgbmV3Q3VzdG9tU2l6ZSA9ICcnXG4gIGxldCBuZXdUeXBlID0gJydcblxuICAkOiBuZXdQYWNrID0gcGFjayB8fCAnZmFzJ1xuXG4gICQ6IHtcbiAgICBpZiAoY3VzdG9tU2l6ZSkgbmV3Q3VzdG9tU2l6ZSA9IGN1c3RvbVNpemVcbiAgICBlbHNlIHtcbiAgICAgIHN3aXRjaCAoc2l6ZSkge1xuICAgICAgICBjYXNlICdpcy1zbWFsbCc6XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaXMtbWVkaXVtJzpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJ2ZhLWxnJ1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2lzLWxhcmdlJzpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJ2ZhLTN4J1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbmV3Q3VzdG9tU2l6ZSA9ICcnXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgJDoge1xuICAgIGlmICghdHlwZSkgbmV3VHlwZSA9ICcnXG4gICAgbGV0IHNwbGl0VHlwZSA9IFtdXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgc3BsaXRUeXBlID0gdHlwZS5zcGxpdCgnLScpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGtleSBpbiB0eXBlKSB7XG4gICAgICAgIGlmICh0eXBlW2tleV0pIHtcbiAgICAgICAgICBzcGxpdFR5cGUgPSBrZXkuc3BsaXQoJy0nKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNwbGl0VHlwZS5sZW5ndGggPD0gMSkgbmV3VHlwZSA9ICcnXG4gICAgZWxzZSBuZXdUeXBlID0gYGhhcy10ZXh0LSR7c3BsaXRUeXBlWzFdfWBcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzcGFuIGNsYXNzPVwiaWNvbiB7c2l6ZX0ge25ld1R5cGV9IHsoaXNMZWZ0ICYmICdpcy1sZWZ0JykgfHwgJyd9IHsoaXNSaWdodCAmJiAnaXMtcmlnaHQnKSB8fCAnJ31cIiBjbGFzczppcy1jbGlja2FibGU9e2lzQ2xpY2thYmxlfSBvbjpjbGljaz5cbiAgPGkgY2xhc3M9XCJ7bmV3UGFja30gZmEte2ljb259IHtjdXN0b21DbGFzc30ge25ld0N1c3RvbVNpemV9XCIgLz5cbjwvc3Bhbj5cbiIsImltcG9ydCB7IHNhZmVfbm90X2VxdWFsLCBub29wLCBydW5fYWxsLCBpc19mdW5jdGlvbiB9IGZyb20gJy4uL2ludGVybmFsJztcbmV4cG9ydCB7IGdldF9zdG9yZV92YWx1ZSBhcyBnZXQgfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0gdmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcn1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmxlKHZhbHVlLCBzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogd3JpdGFibGUodmFsdWUsIHN0YXJ0KS5zdWJzY3JpYmUsXG4gICAgfTtcbn1cbi8qKlxuICogQ3JlYXRlIGEgYFdyaXRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyBib3RoIHVwZGF0aW5nIGFuZCByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB7Kj19dmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcj19c3RhcnQgc3RhcnQgYW5kIHN0b3Agbm90aWZpY2F0aW9ucyBmb3Igc3Vic2NyaXB0aW9uc1xuICovXG5mdW5jdGlvbiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQgPSBub29wKSB7XG4gICAgbGV0IHN0b3A7XG4gICAgY29uc3Qgc3Vic2NyaWJlcnMgPSBbXTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlKSB7XG4gICAgICAgIGlmIChzYWZlX25vdF9lcXVhbCh2YWx1ZSwgbmV3X3ZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBpZiAoc3RvcCkgeyAvLyBzdG9yZSBpcyByZWFkeVxuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bl9xdWV1ZSA9ICFzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgc1sxXSgpO1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLnB1c2gocywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVuX3F1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZVtpXVswXShzdWJzY3JpYmVyX3F1ZXVlW2kgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGUoZm4pIHtcbiAgICAgICAgc2V0KGZuKHZhbHVlKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmliZXIgPSBbcnVuLCBpbnZhbGlkYXRlXTtcbiAgICAgICAgc3Vic2NyaWJlcnMucHVzaChzdWJzY3JpYmVyKTtcbiAgICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc3RvcCA9IHN0YXJ0KHNldCkgfHwgbm9vcDtcbiAgICAgICAgfVxuICAgICAgICBydW4odmFsdWUpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBzdWJzY3JpYmVycy5pbmRleE9mKHN1YnNjcmliZXIpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHN1YnNjcmliZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICAgICAgICAgIHN0b3AgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzZXQsIHVwZGF0ZSwgc3Vic2NyaWJlIH07XG59XG5mdW5jdGlvbiBkZXJpdmVkKHN0b3JlcywgZm4sIGluaXRpYWxfdmFsdWUpIHtcbiAgICBjb25zdCBzaW5nbGUgPSAhQXJyYXkuaXNBcnJheShzdG9yZXMpO1xuICAgIGNvbnN0IHN0b3Jlc19hcnJheSA9IHNpbmdsZVxuICAgICAgICA/IFtzdG9yZXNdXG4gICAgICAgIDogc3RvcmVzO1xuICAgIGNvbnN0IGF1dG8gPSBmbi5sZW5ndGggPCAyO1xuICAgIHJldHVybiByZWFkYWJsZShpbml0aWFsX3ZhbHVlLCAoc2V0KSA9PiB7XG4gICAgICAgIGxldCBpbml0ZWQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICAgIGxldCBwZW5kaW5nID0gMDtcbiAgICAgICAgbGV0IGNsZWFudXAgPSBub29wO1xuICAgICAgICBjb25zdCBzeW5jID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbihzaW5nbGUgPyB2YWx1ZXNbMF0gOiB2YWx1ZXMsIHNldCk7XG4gICAgICAgICAgICBpZiAoYXV0bykge1xuICAgICAgICAgICAgICAgIHNldChyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xlYW51cCA9IGlzX2Z1bmN0aW9uKHJlc3VsdCkgPyByZXN1bHQgOiBub29wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB1bnN1YnNjcmliZXJzID0gc3RvcmVzX2FycmF5Lm1hcCgoc3RvcmUsIGkpID0+IHN0b3JlLnN1YnNjcmliZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICAgICAgcGVuZGluZyAmPSB+KDEgPDwgaSk7XG4gICAgICAgICAgICBpZiAoaW5pdGVkKSB7XG4gICAgICAgICAgICAgICAgc3luYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBwZW5kaW5nIHw9ICgxIDw8IGkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGluaXRlZCA9IHRydWU7XG4gICAgICAgIHN5bmMoKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBkZXJpdmVkLCByZWFkYWJsZSwgd3JpdGFibGUgfTtcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnLi4vc3RvcmUnO1xuaW1wb3J0IHsgbm93LCBsb29wLCBhc3NpZ24gfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5pbXBvcnQgeyBsaW5lYXIgfSBmcm9tICcuLi9lYXNpbmcnO1xuXG5mdW5jdGlvbiBpc19kYXRlKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiB0aWNrX3NwcmluZyhjdHgsIGxhc3RfdmFsdWUsIGN1cnJlbnRfdmFsdWUsIHRhcmdldF92YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgY3VycmVudF92YWx1ZSA9PT0gJ251bWJlcicgfHwgaXNfZGF0ZShjdXJyZW50X3ZhbHVlKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGRlbHRhID0gdGFyZ2V0X3ZhbHVlIC0gY3VycmVudF92YWx1ZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB2ZWxvY2l0eSA9IChjdXJyZW50X3ZhbHVlIC0gbGFzdF92YWx1ZSkgLyAoY3R4LmR0IHx8IDEgLyA2MCk7IC8vIGd1YXJkIGRpdiBieSAwXG4gICAgICAgIGNvbnN0IHNwcmluZyA9IGN0eC5vcHRzLnN0aWZmbmVzcyAqIGRlbHRhO1xuICAgICAgICBjb25zdCBkYW1wZXIgPSBjdHgub3B0cy5kYW1waW5nICogdmVsb2NpdHk7XG4gICAgICAgIGNvbnN0IGFjY2VsZXJhdGlvbiA9IChzcHJpbmcgLSBkYW1wZXIpICogY3R4Lmludl9tYXNzO1xuICAgICAgICBjb25zdCBkID0gKHZlbG9jaXR5ICsgYWNjZWxlcmF0aW9uKSAqIGN0eC5kdDtcbiAgICAgICAgaWYgKE1hdGguYWJzKGQpIDwgY3R4Lm9wdHMucHJlY2lzaW9uICYmIE1hdGguYWJzKGRlbHRhKSA8IGN0eC5vcHRzLnByZWNpc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldF92YWx1ZTsgLy8gc2V0dGxlZFxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY3R4LnNldHRsZWQgPSBmYWxzZTsgLy8gc2lnbmFsIGxvb3AgdG8ga2VlcCB0aWNraW5nXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByZXR1cm4gaXNfZGF0ZShjdXJyZW50X3ZhbHVlKSA/XG4gICAgICAgICAgICAgICAgbmV3IERhdGUoY3VycmVudF92YWx1ZS5nZXRUaW1lKCkgKyBkKSA6IGN1cnJlbnRfdmFsdWUgKyBkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudF92YWx1ZSkpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gY3VycmVudF92YWx1ZS5tYXAoKF8sIGkpID0+IHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZVtpXSwgY3VycmVudF92YWx1ZVtpXSwgdGFyZ2V0X3ZhbHVlW2ldKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBjdXJyZW50X3ZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCBuZXh0X3ZhbHVlID0ge307XG4gICAgICAgIGZvciAoY29uc3QgayBpbiBjdXJyZW50X3ZhbHVlKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgbmV4dF92YWx1ZVtrXSA9IHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZVtrXSwgY3VycmVudF92YWx1ZVtrXSwgdGFyZ2V0X3ZhbHVlW2tdKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gbmV4dF92YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHNwcmluZyAke3R5cGVvZiBjdXJyZW50X3ZhbHVlfSB2YWx1ZXNgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzcHJpbmcodmFsdWUsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHN0b3JlID0gd3JpdGFibGUodmFsdWUpO1xuICAgIGNvbnN0IHsgc3RpZmZuZXNzID0gMC4xNSwgZGFtcGluZyA9IDAuOCwgcHJlY2lzaW9uID0gMC4wMSB9ID0gb3B0cztcbiAgICBsZXQgbGFzdF90aW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCBjdXJyZW50X3Rva2VuO1xuICAgIGxldCBsYXN0X3ZhbHVlID0gdmFsdWU7XG4gICAgbGV0IHRhcmdldF92YWx1ZSA9IHZhbHVlO1xuICAgIGxldCBpbnZfbWFzcyA9IDE7XG4gICAgbGV0IGludl9tYXNzX3JlY292ZXJ5X3JhdGUgPSAwO1xuICAgIGxldCBjYW5jZWxfdGFzayA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUsIG9wdHMgPSB7fSkge1xuICAgICAgICB0YXJnZXRfdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgIGNvbnN0IHRva2VuID0gY3VycmVudF90b2tlbiA9IHt9O1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCBvcHRzLmhhcmQgfHwgKHNwcmluZy5zdGlmZm5lc3MgPj0gMSAmJiBzcHJpbmcuZGFtcGluZyA+PSAxKSkge1xuICAgICAgICAgICAgY2FuY2VsX3Rhc2sgPSB0cnVlOyAvLyBjYW5jZWwgYW55IHJ1bm5pbmcgYW5pbWF0aW9uXG4gICAgICAgICAgICBsYXN0X3RpbWUgPSBub3coKTtcbiAgICAgICAgICAgIGxhc3RfdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSB0YXJnZXRfdmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdHMuc29mdCkge1xuICAgICAgICAgICAgY29uc3QgcmF0ZSA9IG9wdHMuc29mdCA9PT0gdHJ1ZSA/IC41IDogK29wdHMuc29mdDtcbiAgICAgICAgICAgIGludl9tYXNzX3JlY292ZXJ5X3JhdGUgPSAxIC8gKHJhdGUgKiA2MCk7XG4gICAgICAgICAgICBpbnZfbWFzcyA9IDA7IC8vIGluZmluaXRlIG1hc3MsIHVuYWZmZWN0ZWQgYnkgc3ByaW5nIGZvcmNlc1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFzaykge1xuICAgICAgICAgICAgbGFzdF90aW1lID0gbm93KCk7XG4gICAgICAgICAgICBjYW5jZWxfdGFzayA9IGZhbHNlO1xuICAgICAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2FuY2VsX3Rhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsX3Rhc2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW52X21hc3MgPSBNYXRoLm1pbihpbnZfbWFzcyArIGludl9tYXNzX3JlY292ZXJ5X3JhdGUsIDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW52X21hc3MsXG4gICAgICAgICAgICAgICAgICAgIG9wdHM6IHNwcmluZyxcbiAgICAgICAgICAgICAgICAgICAgc2V0dGxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZHQ6IChub3cgLSBsYXN0X3RpbWUpICogNjAgLyAxMDAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0X3ZhbHVlID0gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlLCB2YWx1ZSwgdGFyZ2V0X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBsYXN0X3RpbWUgPSBub3c7XG4gICAgICAgICAgICAgICAgbGFzdF92YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IG5leHRfdmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChjdHguc2V0dGxlZClcbiAgICAgICAgICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFjdHguc2V0dGxlZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdWxmaWwgPT4ge1xuICAgICAgICAgICAgdGFzay5wcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbiA9PT0gY3VycmVudF90b2tlbilcbiAgICAgICAgICAgICAgICAgICAgZnVsZmlsKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHNwcmluZyA9IHtcbiAgICAgICAgc2V0LFxuICAgICAgICB1cGRhdGU6IChmbiwgb3B0cykgPT4gc2V0KGZuKHRhcmdldF92YWx1ZSwgdmFsdWUpLCBvcHRzKSxcbiAgICAgICAgc3Vic2NyaWJlOiBzdG9yZS5zdWJzY3JpYmUsXG4gICAgICAgIHN0aWZmbmVzcyxcbiAgICAgICAgZGFtcGluZyxcbiAgICAgICAgcHJlY2lzaW9uXG4gICAgfTtcbiAgICByZXR1cm4gc3ByaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRfaW50ZXJwb2xhdG9yKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gYiB8fCBhICE9PSBhKVxuICAgICAgICByZXR1cm4gKCkgPT4gYTtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIGE7XG4gICAgaWYgKHR5cGUgIT09IHR5cGVvZiBiIHx8IEFycmF5LmlzQXJyYXkoYSkgIT09IEFycmF5LmlzQXJyYXkoYikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW50ZXJwb2xhdGUgdmFsdWVzIG9mIGRpZmZlcmVudCB0eXBlJyk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgIGNvbnN0IGFyciA9IGIubWFwKChiaSwgaSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGdldF9pbnRlcnBvbGF0b3IoYVtpXSwgYmkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHQgPT4gYXJyLm1hcChmbiA9PiBmbih0KSk7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoIWEgfHwgIWIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBjYW5ub3QgYmUgbnVsbCcpO1xuICAgICAgICBpZiAoaXNfZGF0ZShhKSAmJiBpc19kYXRlKGIpKSB7XG4gICAgICAgICAgICBhID0gYS5nZXRUaW1lKCk7XG4gICAgICAgICAgICBiID0gYi5nZXRUaW1lKCk7XG4gICAgICAgICAgICBjb25zdCBkZWx0YSA9IGIgLSBhO1xuICAgICAgICAgICAgcmV0dXJuIHQgPT4gbmV3IERhdGUoYSArIHQgKiBkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGIpO1xuICAgICAgICBjb25zdCBpbnRlcnBvbGF0b3JzID0ge307XG4gICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgaW50ZXJwb2xhdG9yc1trZXldID0gZ2V0X2ludGVycG9sYXRvcihhW2tleV0sIGJba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gaW50ZXJwb2xhdG9yc1trZXldKHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBiIC0gYTtcbiAgICAgICAgcmV0dXJuIHQgPT4gYSArIHQgKiBkZWx0YTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgaW50ZXJwb2xhdGUgJHt0eXBlfSB2YWx1ZXNgKTtcbn1cbmZ1bmN0aW9uIHR3ZWVuZWQodmFsdWUsIGRlZmF1bHRzID0ge30pIHtcbiAgICBjb25zdCBzdG9yZSA9IHdyaXRhYmxlKHZhbHVlKTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdGFyZ2V0X3ZhbHVlID0gdmFsdWU7XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSwgb3B0cykge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXRfdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgIGxldCBwcmV2aW91c190YXNrID0gdGFzaztcbiAgICAgICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgbGV0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDQwMCwgZWFzaW5nID0gbGluZWFyLCBpbnRlcnBvbGF0ZSA9IGdldF9pbnRlcnBvbGF0b3IgfSA9IGFzc2lnbihhc3NpZ24oe30sIGRlZmF1bHRzKSwgb3B0cyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgbGV0IGZuO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKG5vdyA8IHN0YXJ0KVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYgKCFzdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgZm4gPSBpbnRlcnBvbGF0ZSh2YWx1ZSwgbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uKHZhbHVlLCBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByZXZpb3VzX3Rhc2spIHtcbiAgICAgICAgICAgICAgICBwcmV2aW91c190YXNrLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzayA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBlbGFwc2VkID0gbm93IC0gc3RhcnQ7XG4gICAgICAgICAgICBpZiAoZWxhcHNlZCA+IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBmbihlYXNpbmcoZWxhcHNlZCAvIGR1cmF0aW9uKSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFzay5wcm9taXNlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBzZXQsXG4gICAgICAgIHVwZGF0ZTogKGZuLCBvcHRzKSA9PiBzZXQoZm4odGFyZ2V0X3ZhbHVlLCB2YWx1ZSksIG9wdHMpLFxuICAgICAgICBzdWJzY3JpYmU6IHN0b3JlLnN1YnNjcmliZVxuICAgIH07XG59XG5cbmV4cG9ydCB7IHNwcmluZywgdHdlZW5lZCB9O1xuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgc2V0Q29udGV4dCwgZ2V0Q29udGV4dCwgb25Nb3VudCwgb25EZXN0cm95LCBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCB7IGdldCwgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG4gIGltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAvKiogSW5kZXggb2YgdGhlIGFjdGl2ZSB0YWIgKHplcm8tYmFzZWQpXG4gICAqIEBzdmVsdGUtcHJvcCB7TnVtYmVyfSBbdmFsdWU9MF1cbiAgICogKi9cbiAgZXhwb3J0IGxldCB2YWx1ZSA9IDBcblxuICAvKiogU2l6ZSBvZiB0YWJzXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbc2l6ZV1cbiAgICogQHZhbHVlcyAkJHNpemVzJCRcbiAgICogKi9cbiAgZXhwb3J0IGxldCBzaXplID0gJydcblxuICAvKiogUG9zaXRpb24gb2YgdGFicyBsaXN0LCBob3Jpem9udGFsbHkuIEJ5IGRlZmF1bHQgdGhleSdyZSBwb3NpdGlvbmVkIHRvIHRoZSBsZWZ0XG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbcG9zaXRpb25dXG4gICAqIEB2YWx1ZXMgaXMtY2VudGVyZWQsIGlzLXJpZ2h0XG4gICAqICovXG4gIGV4cG9ydCBsZXQgcG9zaXRpb24gPSAnJ1xuXG4gIC8qKiBTdHlsZSBvZiB0YWJzXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbc3R5bGVdXG4gICAqIEB2YWx1ZXMgaXMtYm94ZWQsIGlzLXRvZ2dsZSwgaXMtdG9nZ2xlLXJvdW5kZWQsIGlzLWZ1bGx3aWR0aFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHN0eWxlID0gJydcblxuICBleHBvcnQgbGV0IGV4cGFuZGVkID0gZmFsc2VcblxuICBsZXQgYWN0aXZlVGFiID0gMFxuICAkOiBjaGFuZ2VUYWIodmFsdWUpXG5cbiAgY29uc3QgdGFicyA9IHdyaXRhYmxlKFtdKVxuXG4gIGNvbnN0IHRhYkNvbmZpZyA9IHtcbiAgICBhY3RpdmVUYWIsXG4gICAgdGFicyxcbiAgfVxuXG4gIHNldENvbnRleHQoJ3RhYnMnLCB0YWJDb25maWcpXG5cbiAgLy8gVGhpcyBvbmx5IHJ1bnMgYXMgdGFicyBhcmUgYWRkZWQvcmVtb3ZlZFxuICBjb25zdCB1bnN1YnNjcmliZSA9IHRhYnMuc3Vic2NyaWJlKHRzID0+IHtcbiAgICBpZiAodHMubGVuZ3RoID4gMCAmJiB0cy5sZW5ndGggPiB2YWx1ZSAtIDEpIHtcbiAgICAgIHRzLmZvckVhY2godCA9PiB0LmRlYWN0aXZhdGUoKSlcbiAgICAgIGlmICh0c1t2YWx1ZV0pIHRzW3ZhbHVlXS5hY3RpdmF0ZSgpXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIGNoYW5nZVRhYih0YWJOdW1iZXIpIHtcbiAgICBjb25zdCB0cyA9IGdldCh0YWJzKVxuICAgIC8vIE5PVEU6IGNoYW5nZSB0aGlzIGJhY2sgdG8gdXNpbmcgY2hhbmdlVGFiIGluc3RlYWQgb2YgYWN0aXZhdGUvZGVhY3RpdmF0ZSBvbmNlIHRyYW5zaXRpb25zL2FuaW1hdGlvbnMgYXJlIHdvcmtpbmdcbiAgICBpZiAodHNbYWN0aXZlVGFiXSkgdHNbYWN0aXZlVGFiXS5kZWFjdGl2YXRlKClcbiAgICBpZiAodHNbdGFiTnVtYmVyXSkgdHNbdGFiTnVtYmVyXS5hY3RpdmF0ZSgpXG4gICAgLy8gdHMuZm9yRWFjaCh0ID0+IHQuY2hhbmdlVGFiKHsgZnJvbTogYWN0aXZlVGFiLCB0bzogdGFiTnVtYmVyIH0pKVxuICAgIGFjdGl2ZVRhYiA9IHRhYkNvbmZpZy5hY3RpdmVUYWIgPSB0YWJOdW1iZXJcbiAgICBkaXNwYXRjaCgnYWN0aXZlVGFiQ2hhbmdlZCcsIHRhYk51bWJlcilcbiAgfVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNoYW5nZVRhYihhY3RpdmVUYWIpXG4gIH0pXG5cbiAgb25EZXN0cm95KCgpID0+IHtcbiAgICB1bnN1YnNjcmliZSgpXG4gIH0pXG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC50YWJzLXdyYXBwZXIge1xuICAgICYuaXMtZnVsbHdpZHRoIHtcbiAgICAgIC8qIFRPRE8gKi9cbiAgICB9XG5cbiAgICAudGFiLWNvbnRlbnQge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJ0YWJzLXdyYXBwZXJcIiBjbGFzczppcy1mdWxsd2lkdGg9e2V4cGFuZGVkfT5cbiAgPG5hdiBjbGFzcz1cInRhYnMge3NpemV9IHtwb3NpdGlvbn0ge3N0eWxlfVwiPlxuICAgIDx1bD5cbiAgICAgIHsjZWFjaCAkdGFicyBhcyB0YWIsIGluZGV4fVxuICAgICAgICA8bGkgY2xhc3M6aXMtYWN0aXZlPXtpbmRleCA9PT0gYWN0aXZlVGFifT5cbiAgICAgICAgICA8YSBocmVmIG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXsoKSA9PiBjaGFuZ2VUYWIoaW5kZXgpfT5cbiAgICAgICAgICAgIHsjaWYgdGFiLmljb259XG4gICAgICAgICAgICAgIDxJY29uIHBhY2s9e3RhYi5pY29uUGFja30gaWNvbj17dGFiLmljb259IC8+XG4gICAgICAgICAgICB7L2lmfVxuXG4gICAgICAgICAgICA8c3Bhbj57dGFiLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgIDwvbGk+XG4gICAgICB7L2VhY2h9XG4gICAgPC91bD5cbiAgPC9uYXY+XG4gIDxzZWN0aW9uIGNsYXNzPVwidGFiLWNvbnRlbnRcIj5cbiAgICA8c2xvdCAvPlxuICA8L3NlY3Rpb24+XG48L2Rpdj5cbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGJlZm9yZVVwZGF0ZSwgc2V0Q29udGV4dCwgZ2V0Q29udGV4dCwgdGljaywgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnXG5cbiAgLyoqIExhYmVsIGZvciB0YWJcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IGxhYmVsXG4gICAqICovXG4gIGV4cG9ydCBsZXQgbGFiZWxcblxuICAvKiogU2hvdyB0aGlzIGljb24gb24gbGVmdC1zaWRlIG9mIHRoZSB0YWJcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtpY29uXVxuICAgKiAqL1xuICBleHBvcnQgbGV0IGljb24gPSAnJ1xuXG4gIC8qKiBGb250YXdlc29tZSBpY29uIHBhY2sgdG8gdXNlLiBCeSBkZWZhdWx0IHRoZSA8Y29kZT5JY29uPC9jb2RlPiBjb21wb25lbnQgdXNlcyA8Y29kZT5mYXM8L2NvZGU+XG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbaWNvblBhY2tdXG4gICAqIEB2YWx1ZXMgPGNvZGU+ZmFzPC9jb2RlPiwgPGNvZGU+ZmFiPC9jb2RlPiwgZXRjLi4uXG4gICAqICovXG4gIGV4cG9ydCBsZXQgaWNvblBhY2sgPSAnJ1xuXG4gIGxldCBhY3RpdmUgPSBmYWxzZVxuXG4gIGxldCBlbFxuICBsZXQgaW5kZXhcbiAgbGV0IHN0YXJ0aW5nID0gZmFsc2VcbiAgbGV0IGRpcmVjdGlvbiA9ICcnXG4gIGxldCBpc0luID0gZmFsc2VcblxuICBjb25zdCB0YWJDb25maWcgPSBnZXRDb250ZXh0KCd0YWJzJylcblxuICBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hhbmdlVGFiKHsgZnJvbSwgdG8gfSkge1xuICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuXG5cbiAgICAvLyBjb25zb2xlLmxvZyh7IGluZGV4LCBmcm9tLCB0byB9LCB0byA9PT0gaW5kZXgpXG4gICAgaWYgKGZyb20gPT09IGluZGV4KSB7XG4gICAgICAvLyBUcmFuc2l0aW9uIG91dFxuICAgICAgZGlyZWN0aW9uID0gaW5kZXggPCB0byA/ICdsZWZ0JyA6ICdyaWdodCdcbiAgICB9IGVsc2UgaWYgKHRvID09PSBpbmRleCkge1xuICAgICAgLy8gVHJhbnNpdGlvbiBpbjsgc3RhcnQgYXQgZGlyZWN0aW9uIHdoZW4gcmVuZGVyZWQsIHRoZW4gcmVtb3ZlIGl0XG4gICAgICAvLyBjb25zb2xlLmxvZygnVFJBTlNJVElPTicsIHsgaW5kZXgsIHRvLCBhY3RpdmUgfSlcbiAgICAgIGFjdGl2ZSA9IHRydWVcbiAgICAgIGRpcmVjdGlvbiA9IGluZGV4ID4gZnJvbSA/ICdyaWdodCcgOiAnbGVmdCdcbiAgICAgIC8vIGF3YWl0IHRpY2soKVxuICAgICAgLy8gZGlyZWN0aW9uID0gJydcbiAgICB9IGVsc2UgZGlyZWN0aW9uID0gJydcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUluZGV4KCkge1xuICAgIGlmICghZWwpIHJldHVyblxuICAgIGluZGV4ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChlbC5wYXJlbnROb2RlLmNoaWxkcmVuLCBlbClcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHRyYW5zaXRpb25lbmQoZXZlbnQpIHtcbiAgICAvLyBjb25zb2xlLmxvZyh7IGluZGV4LCBhY3RpdmUsIGFjdGl2ZVRhYjogdGFiQ29uZmlnLmFjdGl2ZVRhYiB9KVxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50LnRhcmdldClcbiAgICBhY3RpdmUgPSBpbmRleCA9PT0gdGFiQ29uZmlnLmFjdGl2ZVRhYlxuICAgIGF3YWl0IHRpY2soKVxuICAgIGRpcmVjdGlvbiA9ICcnXG4gIH1cblxuICB0YWJDb25maWcudGFicy5zdWJzY3JpYmUodGFicyA9PiB7XG4gICAgdXBkYXRlSW5kZXgoKVxuICB9KVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIHVwZGF0ZUluZGV4KClcblxuICAgIHRhYkNvbmZpZy50YWJzLnVwZGF0ZSh0YWJzID0+IFtcbiAgICAgIC4uLnRhYnMsXG4gICAgICB7XG4gICAgICAgIGluZGV4LFxuICAgICAgICBsYWJlbCxcbiAgICAgICAgaWNvbixcbiAgICAgICAgaWNvblBhY2ssXG4gICAgICAgIGFjdGl2YXRlOiAoKSA9PiAoYWN0aXZlID0gdHJ1ZSksXG4gICAgICAgIGRlYWN0aXZhdGU6ICgpID0+IChhY3RpdmUgPSBmYWxzZSksXG4gICAgICAgIGNoYW5nZVRhYixcbiAgICAgIH0sXG4gICAgXSlcbiAgfSlcblxuICBiZWZvcmVVcGRhdGUoYXN5bmMgKCkgPT4ge1xuICAgIGlmIChpbmRleCA9PT0gdGFiQ29uZmlnLmFjdGl2ZVRhYiAmJiBkaXJlY3Rpb24pIHtcbiAgICAgIGF3YWl0IHRpY2soKVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRpcmVjdGlvbiA9ICcnXG4gICAgICB9KVxuICAgIH1cbiAgfSlcbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbiAgLy8gTk9URTogYWRkIHRyYW5zaXRpb25zL2FuaW1hdGlvbnMgYmFjayBvbmNlIHRoZXkncmUgd29ya2luZ1xuICAudGFiIHtcbiAgICBkaXNwbGF5OiBub25lO1xuICAgIGZsZXg6IDEgMCAxMDAlO1xuICAgIC8vIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm07XG4gICAgLy8gdHJhbnNpdGlvbjogdHJhbnNmb3JtIDQwMG1zIGVhc2UtaW47XG5cbiAgICAmLmlzLWFjdGl2ZSB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAvLyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG4gICAgfVxuXG4gICAgLy8gJi5zdGFydGluZyB7XG4gICAgLy8gICB0cmFuc2l0aW9uOiBub25lO1xuICAgIC8vIH1cblxuICAgIC8vICYubGVmdCB7XG4gICAgLy8gICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTEwMCUpO1xuICAgIC8vIH1cblxuICAgIC8vICYucmlnaHQge1xuICAgIC8vICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMCUpO1xuICAgIC8vIH1cblxuICAgIC8vICYuc3RhcnRpbmcge1xuICAgIC8vICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICAvLyB9XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXZcbiAgY2xhc3M9XCJ0YWIge2RpcmVjdGlvbn1cIlxuICBjbGFzczppcy1hY3RpdmU9e2FjdGl2ZX1cbiAgYmluZDp0aGlzPXtlbH1cbiAgYXJpYS1oaWRkZW49eyFhY3RpdmV9XG4gIG9uOnRyYW5zaXRpb25lbmQ9e3RyYW5zaXRpb25lbmR9PlxuICA8c2xvdCB7bGFiZWx9IHtpY29uUGFja30ge2ljb259IC8+XG48L2Rpdj5cbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuXG5leHBvcnQgY29uc3QgdGFncyA9IHdyaXRhYmxlKHtcbiAgZmlsdGVyVXJsOiB0cnVlLFxuICBfX3RhZzE6IHt9LFxuICBfX3RhZzI6IHt9LFxuICBfX3RhZzM6IHt9XG59KVxuIiwiPHNjcmlwdD5cbmV4cG9ydCBsZXQgaGVpZ2h0O1xuXG5mdW5jdGlvbiByZXNpemUoKSB7XG4gIHJldHVybiBoZWlnaHQgPyBgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gJHtoZWlnaHR9cHgpO2AgOiAnJztcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidmJveCBsZWZ0XCI+XG4gIDxkaXYgY2xhc3M9XCJ0YWJsZS1jb250YWluZXJcIiBzdHlsZT1cIntyZXNpemUoKX1cIj5cbiAgICA8c2xvdD48L3Nsb3Q+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxzdHlsZT5cbi52Ym94IHtcbiAgZmxleDogYXV0bztcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuLnZib3gubGVmdCB7XG4gIHdpZHRoOiAxMDAlO1xufVxuLnRhYmxlLWNvbnRhaW5lciB7XG4gIG92ZXJmbG93OiBhdXRvO1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAyN3B4KTtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xubGV0IGF1dG9TYXZlID0gdHJ1ZTtcblxuZnVuY3Rpb24gYnRuUmVzZXQoZSkge1xuICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZV9ldmVudHMucm91dGVUYWJsZSgpO1xufVxuXG5mdW5jdGlvbiBidG5TYXZlKGUpIHtcbiAgY29uc3Qge19fdGFnMSwgX190YWcyLCBfX3RhZzN9ID0gd2luZG93Lm1pdG07XG4gIGNvbnN0IHRhZ3MgPSB7XG4gICAgX190YWcxLFxuICAgIF9fdGFnMixcbiAgICBfX3RhZzMsXG4gIH07XG4gIHdzX19zZW5kKCdzYXZlVGFncycsICR0YWdzKTtcbn1cblxub25Nb3VudCgoKSA9PiB7XG4gIGxldCBkZWJvdW5jZSA9IGZhbHNlO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2V0LXRhZ3MnKS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgIGNvbnN0IHt0eXBlfSA9IGUudGFyZ2V0LmF0dHJpYnV0ZXM7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGNvbnN0IHt2YWx1ZX0gPSB0eXBlO1xuICAgICAgaWYgKGF1dG9TYXZlICYmIHZhbHVlPT09J2NoZWNrYm94Jykge1xuICAgICAgICBpZiAoZGVib3VuY2UpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGRlYm91bmNlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgZGVib3VuY2UgPSBmYWxzZTtcbiAgICAgICAgICBidG5TYXZlKGUpO1xuICAgICAgICB9LDUwKVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJ2NsaWNrZWQnLCBlLnRhcmdldCk7XG4gICAgfVxuICB9O1xuXG4gIHdpbmRvdy5taXRtLmJyb3dzZXIuY2hnVXJsX2V2ZW50cy50YWdzRXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnVXBkYXRlIHRhZ3MhJyk7XG4gICAgdGFncy5zZXQoey4uLiR0YWdzfSk7XG4gIH1cbn0pO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcbiAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLmZpbHRlclVybH0vPlxuICAgIEFjdGl2ZXVybFxuICA8L2xhYmVsPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blJlc2V0fVwiIGRpc2FibGVkPXthdXRvU2F2ZX0+UmVzZXQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5TYXZlfVwiICBkaXNhYmxlZD17YXV0b1NhdmV9PlNhdmU8L2J1dHRvbj5cbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxuICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgIGJpbmQ6Y2hlY2tlZD17YXV0b1NhdmV9Lz5cbiAgICBBdXRvc2F2ZVxuICA8L2xhYmVsPlxuICAuXG48L2Rpdj5cblxuPHN0eWxlPlxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbi5jaGVja2VyIHtcbiAgY29sb3I6IGNob2NvbGF0ZTtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG4vKioqXG4qIGV4OlxuKiBfX3RhZzFbcmVtb3ZlLWFkc34xXSA9IHRydWVcbiogX190YWcxW3JlbW92ZS1hZHN+Ml0gPSBmYWxzZVxuKioqL1xuXG5mdW5jdGlvbiBjbGlja2VkKGUpIHtcbiAgY29uc3Qge19fdGFnMTogey4uLnRhZ3h9fSA9ICR0YWdzO1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qge19fdGFnMSxfX3RhZzIsX190YWczfSA9ICR0YWdzO1xuICAgIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7IC8vIGl0ZW0gPSByZW1vdmUtYWRzfjJcbiAgICBjb25zdCBmbGFnID0gX190YWcxW2l0ZW1dOyAgICAgICAvLyBmbGFnID0gdHJ1ZSB+PiBhbHJlYWR5IGNoYW5nZWRcbiAgICBjb25zb2xlLmxvZygnZScsICR0YWdzKTtcblxuICAgIGNvbnN0IFtncm91cDEsIGlkMV0gPSBpdGVtLnNwbGl0KCd+Jyk7XG4gICAgaWYgKGlkMSkge1xuICAgICAgZm9yIChsZXQgbnMgaW4gX190YWcxKSB7XG4gICAgICAgIGNvbnN0IFtncm91cDIsIGlkMl0gPSBucy5zcGxpdCgnficpO1xuICAgICAgICBpZiAoIXRhZ3hbaXRlbV0gJiYgZ3JvdXAxPT09Z3JvdXAyICYmIGlkMSE9PWlkMikge1xuICAgICAgICAgIF9fdGFnMVtuc10gPSAhZmxhZztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xuICAgICAgY29uc3QgbmFtZXNwYWNlID0gX190YWcyW25zXTtcbiAgICAgIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcbiAgICAgICAgY29uc3QgdHlwMiA9IGl0bS5zcGxpdCgnOicpWzFdIHx8IGl0bTtcbiAgICAgICAgaWYgKGl0ZW09PT10eXAyKSB7XG4gICAgICAgICAgbmFtZXNwYWNlW2l0bV0gPSBmbGFnO1xuICAgICAgICB9IFxuICAgICAgICBpZiAoZ3JvdXAxPT09dHlwMi5zcGxpdCgnficpWzBdKSB7XG4gICAgICAgICAgbmFtZXNwYWNlW2l0bV0gPSBfX3RhZzFbdHlwMl0gfHwgZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBucyBpbiBfX3RhZzMpIHtcbiAgICAgIGNvbnN0IHVybHMgPSBfX3RhZzNbbnNdO1xuICAgICAgZm9yIChsZXQgdXJsIGluIHVybHMpIHtcbiAgICAgICAgY29uc3QgdHlwcyA9IHVybHNbdXJsXTtcbiAgICAgICAgZm9yIChsZXQgdHlwIGluIHR5cHMpIHtcbiAgICAgICAgICBjb25zdCBuYW1lc3BhY2UgPSB0eXBzW3R5cF07XG4gICAgICAgICAgZm9yIChsZXQgaXRtIGluIG5hbWVzcGFjZSkge1xuICAgICAgICAgICAgaWYgKGl0ZW09PT1pdG0pIHtcbiAgICAgICAgICAgICAgbmFtZXNwYWNlW2l0bV0gPSBmbGFnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdyb3VwMT09PWl0bS5zcGxpdCgnficpWzBdKSB7XG4gICAgICAgICAgICAgIG5hbWVzcGFjZVtpdG1dID0gX190YWcxW2l0bV0gfHwgZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHtmaWx0ZXJVcmwsIHRncm91cH0gPSAkdGFncztcbiAgICB0YWdzLnNldCh7XG4gICAgICBmaWx0ZXJVcmwsXG4gICAgICBfX3RhZzEsXG4gICAgICBfX3RhZzIsXG4gICAgICBfX3RhZzMsXG4gICAgICB0Z3JvdXAsXG4gICAgfSlcbiAgfSwgMTApO1xufVxuXG5mdW5jdGlvbiByb3V0ZXRhZyhpdGVtKSB7XG4gIGNvbnN0IHNsYyA9ICR0YWdzLl9fdGFnMVtpdGVtXSA/ICdzbGMnIDogJyc7XG4gIGNvbnN0IGdycCA9ICR0YWdzLnRncm91cFtpdGVtXSA/ICdncnAnIDogJyc7XG4gIHJldHVybiBgcnRhZyAke2dycH0gJHtzbGN9YDtcbn1cblxuZnVuY3Rpb24gbGlzdFRhZ3ModGFncykge1xuICBjb25zdCB7dG9SZWdleH0gPSB3aW5kb3cubWl0bS5mbjtcbiAgY29uc3QgbGlzdCA9IHt9O1xuXG4gIGZ1bmN0aW9uIGFkZChucykge1xuICAgIGZvciAobGV0IGlkIGluIHRhZ3MuX190YWcyW25zXSkge1xuICAgICAgY29uc3QgW2ssdl0gPSBpZC5zcGxpdCgnOicpO1xuICAgICAgbGlzdFt2fHxrXSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgbGV0IHRncztcbiAgaWYgKHRhZ3MuZmlsdGVyVXJsKSB7XG4gICAgZm9yIChsZXQgbnMgaW4gdGFncy5fX3RhZzIpIHtcbiAgICAgIGNvbnN0IHJneCA9IHRvUmVnZXgobnMucmVwbGFjZSgvfi8sJ1teLl0qJykpO1xuICAgICAgaWYgKG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSkge1xuICAgICAgICBhZGQobnMpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkKCdfZ2xvYmFsXycpO1xuICAgIHRncyA9IE9iamVjdC5rZXlzKGxpc3QpLnNvcnQoKTtcbiAgfSBlbHNlIHtcbiAgICB0Z3MgPSBPYmplY3Qua2V5cyh0YWdzLl9fdGFnMSk7XG4gIH1cbiAgcmV0dXJuIHRncztcbn1cbjwvc2NyaXB0PlxuXG48dGQ+XG4gIDxkaXYgY2xhc3M9XCJib3JkZXJcIj5cbiAgICB7I2VhY2ggbGlzdFRhZ3MoJHRhZ3MpIGFzIGl0ZW19XG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMCB7cm91dGV0YWcoaXRlbSl9XCI+XG4gICAgICA8bGFiZWw+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XG4gICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfVxuICAgICAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLl9fdGFnMVtpdGVtXX0vPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImJpZ1wiPntpdGVtfTwvc3Bhbj5cbiAgICAgIDwvbGFiZWw+XG4gICAgPC9kaXY+XG4gICAgey9lYWNofVxuICA8L2Rpdj5cbjwvdGQ+XG5cbjxzdHlsZT5cbi5ib3JkZXIge1xuICBib3JkZXI6IDFweCBkb3R0ZWQ7XG59XG4uc3BhY2UwIHtcbiAgZm9udC1zaXplOiBtZWRpdW07XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG4gIGNvbG9yOiBkYXJrYmx1ZTtcbiAgLyogYmFja2dyb3VuZDogZGVlcHNreWJsdWU7ICovXG59XG4uc3BhY2UwIC5iaWcge1xuICBtYXJnaW4tbGVmdDogLTRweDtcbn1cbi5ydGFnIHtcbiAgY29sb3I6IGdyZXk7XG4gIGZvbnQtc3R5bGU6IGl0YWxpYztcbiAgLyogYmFja2dyb3VuZC1jb2xvcjogYmVpZ2U7ICovXG59XG4ucnRhZy5zbGMge1xuICBjb2xvcjogZ3JlZW47XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG4ucnRhZy5ncnAge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZXhwb3J0IGxldCBpdGVtcztcbmV4cG9ydCBsZXQgbnM7XG5cbmZ1bmN0aW9uIGNsaWNrZWQoZSkge1xuICBjb25zdCB7X190YWcxLF9fdGFnMixfX3RhZzN9ID0gJHRhZ3M7XG4gIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XG4gIGNvbnN0IHR5cDEgPSBpdGVtLnNwbGl0KCc6JylbMV0gfHwgaXRlbTtcbiAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IHR5cDEuc3BsaXQoJ34nKTtcbiAgY29uc3QgbmFtZXNwYWNlID0gX190YWcyW25zXTtcbiAgY29uc3QgdGFneCA9IHt9O1xuICBmb3IgKGxldCBpdG0gaW4gbmFtZXNwYWNlKSB7XG4gICAgdGFneFtpdG1dID0gbmFtZXNwYWNlW2l0bV1cbiAgfVxuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3QgZmxhZyA9bmFtZXNwYWNlW2l0ZW1dO1xuICAgIGNvbnNvbGUubG9nKCdlJywge19fdGFnMixfX3RhZzN9KTtcblxuICAgIGlmIChpZDEpIHtcbiAgICAgIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcbiAgICAgICAgY29uc3QgdHlwMiA9IGl0bS5zcGxpdCgnOicpWzFdIHx8IGl0bTtcbiAgICAgICAgY29uc3QgW2dyb3VwMiwgaWQyXSA9IHR5cDIuc3BsaXQoJ34nKTtcbiAgICAgICAgaWYgKCEodGFneCAmJiB0YWd4W2l0ZW1dKSkge1xuICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIgJiYgaWQxIT09aWQyKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2VbaXRtXSA9ICFmbGFnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHVybHMgPSBfX3RhZzNbbnNdO1xuICAgIGZvciAobGV0IHVybCBpbiB1cmxzKSB7XG4gICAgICBjb25zdCB0eXBzID0gdXJsc1t1cmxdO1xuICAgICAgZm9yIChsZXQgdHlwIGluIHR5cHMpIHtcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlMyA9IHR5cHNbdHlwXTtcbiAgICAgICAgZm9yIChsZXQgaXRtIGluIG5hbWVzcGFjZTMpIHtcbiAgICAgICAgICBpZiAoaXRlbT09PWl0bSkge1xuICAgICAgICAgICAgbmFtZXNwYWNlM1tpdG1dID0gZmxhZztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGdyb3VwMT09PWl0bS5zcGxpdCgnficpWzBdKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2UzW2l0bV0gPSBuYW1lc3BhY2VbaXRtXSB8fCBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qge2ZpbHRlclVybCwgdGdyb3VwfSA9ICR0YWdzO1xuICAgIHRhZ3Muc2V0KHtcbiAgICAgIGZpbHRlclVybCxcbiAgICAgIF9fdGFnMSxcbiAgICAgIF9fdGFnMixcbiAgICAgIF9fdGFnMyxcbiAgICAgIHRncm91cCxcbiAgICB9KVxuICB9LCAxMCk7XG59XG5cbmZ1bmN0aW9uIHJvdXRldGFnKGl0ZW0pIHtcbiAgaWYgKGl0ZW0ubWF0Y2goJzonKSkge1xuICAgIHJldHVybiBpdGVtc1tpdGVtXSA/ICdydGFnIHNsYycgOiAncnRhZyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGl0ZW1zW2l0ZW1dID8gJ3N0YWcgc2xjJyA6ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGl0ZW1saXN0KGl0ZW1zKSB7XG4gIGNvbnN0IGFyciA9IE9iamVjdC5rZXlzKGl0ZW1zKS5zb3J0KChhLGIpID0+IHtcbiAgICBjb25zdCBbazEsdjFdID0gYS5zcGxpdCgnOicpO1xuICAgIGNvbnN0IFtrMix2Ml0gPSBiLnNwbGl0KCc6Jyk7XG4gICAgYSA9IHYxIHx8IGsxO1xuICAgIGIgPSB2MiB8fCBrMjtcbiAgICBpZiAoYTxiKSByZXR1cm4gLTE7XG4gICAgaWYgKGE+YikgcmV0dXJuIDE7XG4gICAgcmV0dXJuIDA7XG4gIH0pO1xuICByZXR1cm4gYXJyO1xufVxuXG5mdW5jdGlvbiBzaG93KGl0ZW0pIHtcbiAgY29uc3QgW2ssdl0gPSBpdGVtLnNwbGl0KCc6Jyk7XG4gIGlmICh2PT09dW5kZWZpbmVkKSByZXR1cm4gaztcbiAgcmV0dXJuIGAke3Z9eyR7a319YDtcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwiYm9yZGVyXCI+XG4gIDxkaXYgY2xhc3M9XCJzcGFjZTBcIj5be25zPT09J19nbG9iYWxfJyA/ICcgKiAnIDogbnN9XTwvZGl2PlxuICB7I2VhY2ggaXRlbWxpc3QoaXRlbXMpIGFzIGl0ZW19XG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMSB7cm91dGV0YWcoaXRlbSl9XCI+XG4gICAgICA8bGFiZWw+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XG4gICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfSBcbiAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtc1tpdGVtXX0vPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIntpdGVtLm1hdGNoKCc6JykgPyAnYmlnJyA6ICcnfVwiPntzaG93KGl0ZW0pfTwvc3Bhbj5cbiAgICAgIDwvbGFiZWw+XG4gICAgPC9kaXY+XG4gIHsvZWFjaH1cbjwvZGl2PlxuXG48c3R5bGU+XG4uYm9yZGVyIHtcbiAgYm9yZGVyOiAxcHggZ3JleSBzb2xpZDtcbn1cbi5zcGFjZTAge1xuICBsaW5lLWhlaWdodDogMS41O1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgY29sb3I6IGRhcmtibHVlO1xuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XG59XG4uc3BhY2UxIHtcbiAgY29sb3I6IGdyZXk7XG4gIHBhZGRpbmctbGVmdDogMTBweDtcbn1cbi5zcGFjZTEgLmJpZyB7XG4gIG1hcmdpbi1sZWZ0OiAtNHB4O1xufVxuLnJ0YWcge1xuICBjb2xvcjogY2FkZXRibHVlO1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC1zdHlsZTogaXRhbGljO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTtcbn1cbi5ydGFnLnNsYyB7XG4gIGNvbG9yOiByZWQ7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG4uc3RhZy5zbGMge1xuICBjb2xvcjogZ3JlZW47XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgVGFnczIxIGZyb20gJy4vVGFnczJfMS5zdmVsdGUnO1xuXG5mdW5jdGlvbiBvbmVTaXRlKG5zKSB7XG4gIGNvbnN0IHt0b1JlZ2V4fSA9IHdpbmRvdy5taXRtLmZuO1xuICBpZiAoJHRhZ3MuZmlsdGVyVXJsKSB7XG4gICAgY29uc3Qgcmd4ID0gdG9SZWdleChucy5yZXBsYWNlKC9+LywnW14uXSonKSk7XG4gICAgcmV0dXJuIG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSB8fCBucz09PSdfZ2xvYmFsXyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48dGQ+XG57I2VhY2ggT2JqZWN0LmtleXMoJHRhZ3MuX190YWcyKSBhcyBuc31cbiAgeyNpZiBvbmVTaXRlKG5zKX1cbiAgICA8VGFnczIxIGl0ZW1zPXskdGFncy5fX3RhZzJbbnNdfSBucz17bnN9Lz5cbiAgey9pZn1cbnsvZWFjaH1cbjwvdGQ+XG5cbjxzdHlsZT5cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZXhwb3J0IGxldCBpdGVtcztcbmV4cG9ydCBsZXQgaXRlbTtcbmV4cG9ydCBsZXQgcGF0aDtcbmV4cG9ydCBsZXQgbnM7XG5cbmZ1bmN0aW9uIGNsaWNrZWQoZSkge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qge19fdGFnM30gPSAkdGFncztcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzNbbnNdO1xuICAgIGNvbnN0IHtpdGVtOiBpfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XG4gICAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IGkuc3BsaXQoJ34nKTtcbiAgICBjb25zb2xlLmxvZygnZScsIHtfX3RhZzN9KTtcblxuICAgIGZvciAobGV0IHB0aCBpbiBuYW1lc3BhY2UpIHtcbiAgICAgIGNvbnN0IHR5cHMgPSBuYW1lc3BhY2VbcHRoXTtcbiAgICAgIGZvciAobGV0IHRzayBpbiB0eXBzKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zMiA9IHR5cHNbdHNrXTtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtczIhPT0nc3RyaW5nJykge1xuICAgICAgICAgIGZvciAobGV0IGl0bSBpbiBpdGVtczIpIHtcbiAgICAgICAgICAgIGNvbnN0IFtncm91cDIsIGlkMl0gPSBpdG0uc3BsaXQoJ34nKTtcbiAgICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIgJiYgaWQxIT09aWQyKSB7XG4gICAgICAgICAgICAgIGl0ZW1zMltpdG1dID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRhZ3Muc2V0KHtcbiAgICAgICAgICAgICAgICAuLi4kdGFncyxcbiAgICAgICAgICAgICAgICBfX3RhZzMsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCA1MCk7XG59XG5cbmZ1bmN0aW9uIHJvdXRldGFnKGl0ZW0pIHtcbiAgcmV0dXJuIGl0ZW1zW2l0ZW1dID8gJ3J0YWcgc2xjJyA6ICdydGFnJztcbn1cblxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcbiAgY29uc3Qge19fdGFnM30gPSB0YWdzO1xuICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzNbbnNdO1xuICBjb25zdCB0eXBzID0gbmFtZXNwYWNlW3BhdGhdO1xuICBjb25zdCBpdG1zID0gdHlwc1tpdGVtXTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGl0bXMpLnNvcnQoKTtcbn1cbjwvc2NyaXB0PlxuXG57I2VhY2ggeGl0ZW1zKCR0YWdzKSBhcyBpdGVtfVxuICA8ZGl2IGNsYXNzPVwic3BhY2UzIHtyb3V0ZXRhZyhpdGVtKX1cIj5cbiAgICA8bGFiZWw+XG4gICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgIGRhdGEtaXRlbT17aXRlbX1cbiAgICAgIG9uOmNsaWNrPXtjbGlja2VkfSBcbiAgICAgIGJpbmQ6Y2hlY2tlZD17aXRlbXNbaXRlbV19Lz5cbiAgICAgIDxzcGFuPntpdGVtfTwvc3Bhbj5cbiAgICA8L2xhYmVsPlxuICA8L2Rpdj5cbnsvZWFjaH1cblxuPHN0eWxlPlxuLnNwYWNlMyB7XG4gIHBhZGRpbmctbGVmdDogMjBweDtcbn1cblxuLnJ0YWcge1xuICBjb2xvcjogY2FkZXRibHVlO1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC1zdHlsZTogaXRhbGljO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTtcbn1cbi5ydGFnLnNsYyB7XG4gIGNvbG9yOiByZWQ7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgVGFnczMzIGZyb20gJy4vVGFnczNfMy5zdmVsdGUnO1xuXG5leHBvcnQgbGV0IGl0ZW1zO1xuZXhwb3J0IGxldCBwYXRoO1xuZXhwb3J0IGxldCBucztcblxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcbiAgY29uc3Qge19fdGFnM30gPSB0YWdzO1xuICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzNbbnNdO1xuICBjb25zdCB0eXBzID0gbmFtZXNwYWNlW3BhdGhdO1xuICByZXR1cm4gT2JqZWN0LmtleXModHlwcyk7XG59XG48L3NjcmlwdD5cblxueyNlYWNoIHhpdGVtcygkdGFncykuZmlsdGVyKHg9PnhbMF0hPT0nOicpIGFzIGl0ZW19XG4gIDxkaXYgY2xhc3M9XCJzcGFjZTJcIj57aXRlbX06e2l0ZW1zW2A6JHtpdGVtfWBdfTwvZGl2PlxuICA8VGFnczMzIGl0ZW1zPXtpdGVtc1tpdGVtXX0ge2l0ZW19IHtwYXRofSB7bnN9Lz5cbnsvZWFjaH1cblxuPHN0eWxlPlxuLnNwYWNlMiB7XG4gIHBhZGRpbmctbGVmdDogMjBweDtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgY29sb3I6IGdyZWVuO1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IFRhZ3MzMiBmcm9tICcuL1RhZ3MzXzIuc3ZlbHRlJztcblxuZXhwb3J0IGxldCBpdGVtcztcbmV4cG9ydCBsZXQgbnM7XG5cbmZ1bmN0aW9uIHhpdGVtcyh0YWdzKSB7XG4gIGNvbnN0IHtfX3RhZzN9ID0gdGFncztcbiAgY29uc3QgbmFtZXNwYWNlID0gX190YWczW25zXTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG5hbWVzcGFjZSk7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImJvcmRlclwiPlxuICA8ZGl2IGNsYXNzPVwic3BhY2UwXCI+W3tucz09PSdfZ2xvYmFsXycgPyAnICogJyA6IG5zfV08L2Rpdj5cbiAgeyNlYWNoIHhpdGVtcygkdGFncykgYXMgcGF0aH1cbiAgICA8ZGl2IGNsYXNzPVwic3BhY2UxXCI+e3BhdGh9PC9kaXY+XG4gICAgPFRhZ3MzMiBpdGVtcz17aXRlbXNbcGF0aF19IHtwYXRofSB7bnN9Lz5cbiAgey9lYWNofVxuPC9kaXY+XG5cbjxzdHlsZT5cbi5ib3JkZXIge1xuICBib3JkZXI6IDFweCBzb2xpZDtcbn1cbi5zcGFjZTAge1xuICBsaW5lLWhlaWdodDogMS41O1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgY29sb3I6IGRhcmtibHVlO1xuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XG59XG4uc3BhY2UxIHtcbiAgcGFkZGluZy1sZWZ0OiAxMHB4O1xuICBmb250LXdlaWdodDogYm9sZGVyO1xuICBjb2xvcjogYmx1ZXZpb2xldFxufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IFRhZ3MzMSBmcm9tICcuL1RhZ3MzXzEuc3ZlbHRlJztcblxuZnVuY3Rpb24gaXN0YWcobnMpIHtcbiAgY29uc3Qge3RvUmVnZXh9ID0gd2luZG93Lm1pdG0uZm47XG4gIGNvbnN0IGFyciA9IE9iamVjdC5rZXlzKCR0YWdzLl9fdGFnMltuc10pO1xuICBjb25zdCBvayA9IGFyci5maWx0ZXIoeD0+IXgubWF0Y2goJzonKSkubGVuZ3RoO1xuICBpZiAoJHRhZ3MuZmlsdGVyVXJsKSB7XG4gICAgY29uc3Qgcmd4ID0gdG9SZWdleChucy5yZXBsYWNlKC9+LywnW14uXSonKSk7XG4gICAgcmV0dXJuIG9rICYmIG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSB8fCBucz09PSdfZ2xvYmFsXyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9rO1xuICB9XG59XG48L3NjcmlwdD5cblxuPHRkPlxueyNlYWNoIE9iamVjdC5rZXlzKCR0YWdzLl9fdGFnMykgYXMgbnN9XG4gIHsjaWYgaXN0YWcobnMpfVxuICAgIDxUYWdzMzEgaXRlbXM9eyR0YWdzLl9fdGFnM1tuc119IHtuc30vPlxuICB7L2lmfVxuey9lYWNofVxuPC90ZD5cblxuPHN0eWxlPlxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IFRhZ3MxIGZyb20gJy4vVGFnczFfLnN2ZWx0ZSc7IFxuaW1wb3J0IFRhZ3MyIGZyb20gJy4vVGFnczJfLnN2ZWx0ZSc7IFxuaW1wb3J0IFRhZ3MzIGZyb20gJy4vVGFnczNfLnN2ZWx0ZSc7IFxuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcblxufSk7XG5cbndpbmRvdy5taXRtLmZpbGVzLmdldFJvdXRlX2V2ZW50cy50YWdzVGFibGUgPSAoKSA9PiB7XG4gIC8vIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcbiAgY29uc29sZS5sb2coJ3RhZ3NUYWJsZSBnZXR0aW5nIGNhbGxlZCEhIScpO1xuICBjb25zdCB7X190YWcxLCBfX3RhZzIsIF9fdGFnM30gPSB3aW5kb3cubWl0bTtcbiAgY29uc3Qge2ZpbHRlclVybH0gPSAkdGFncztcbiAgY29uc3QgdGdyb3VwID0ge307XG4gIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xuICAgIGNvbnN0IHRza3MgPSBfX3RhZzJbbnNdXG4gICAgZm9yIChsZXQgdGFzayBpbiB0c2tzKSB7XG4gICAgICBjb25zdCBbLHZdID0gdGFzay5zcGxpdCgnOicpO1xuICAgICAgdiAmJiAodGdyb3VwW3ZdID0gdHJ1ZSlcbiAgICB9XG4gIH0gIFxuICB0YWdzLnNldCh7XG4gICAgZmlsdGVyVXJsLFxuICAgIF9fdGFnMSxcbiAgICBfX3RhZzIsXG4gICAgX190YWczLFxuICAgIHRncm91cCxcbiAgfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljIGhlaWdodD1cIjBcIj5cbiAgICA8QkhlYWRlcj4tVGFncy08L0JIZWFkZXI+XG4gICAgPEJUYWJsZT5cbiAgICAgIDx0ciBjbGFzcz1cInNldC10YWdzXCI+XG4gICAgICAgIDxUYWdzMS8+XG4gICAgICAgIDxUYWdzMi8+XG4gICAgICAgIDxUYWdzMy8+XG4gICAgICA8L3RyPlxuICAgIDwvQlRhYmxlPlxuICA8L0JTdGF0aWM+XG48L2Rpdj5cblxuPHN0eWxlPlxuLnZib3gge1xuICBmbGV4OiBhdXRvO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG48L3N0eWxlPlxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG5cbmV4cG9ydCBjb25zdCBsb2dzdG9yZSA9IHdyaXRhYmxlKHtcbiAgcmVzcEhlYWRlcjoge30sXG4gIHJlc3BvbnNlOiAnJyxcbiAgaGVhZGVyczogJycsXG4gIGxvZ2lkOiAnJyxcbiAgdGl0bGU6ICcnLFxuICBwYXRoOiAnJyxcbiAgdXJsOiAnJyxcbiAgZXh0OiAnJ1xufSlcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuXG5leHBvcnQgY29uc3QgY2xpZW50ID0gd3JpdGFibGUoe1xuICAuLi53aW5kb3cubWl0bS5jbGllbnRcbn0pXG4iLCI8c2NyaXB0PlxuZXhwb3J0IGxldCBoZWlnaHQ7XG5cbmltcG9ydCB7c3ByaW5nfSBmcm9tICdzdmVsdGUvbW90aW9uJ1xuaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcblxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcbiAgXG5sZXQgZHJvcFRhcmdldDtcbmZ1bmN0aW9uIGRyYWdnYWJsZShub2RlLCBwYXJhbXMpIHtcbiAgXG4gIGxldCBsYXN0WDtcbiAgbGV0IHBhcmVudFg7XG4gIGxldCBvZmZzZXRYID0gMFxuICBjb25zdCBvZmZzZXQgPSBzcHJpbmcoe3g6IG9mZnNldFgsIHk6IDB9LCB7XG5cdFx0c3RpZmZuZXNzOiAwLjIsXG5cdFx0ZGFtcGluZzogMC40XG5cdH0pO1xuXG4gIG9mZnNldC5zdWJzY3JpYmUob2Zmc2V0ID0+IHtcbiAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgY29uc3QgbGVmdCA9IHBhcmVudFggKyBvZmZzZXQueFxuICAgICAgcGFyZW50LnN0eWxlLmxlZnQgPSBgJHtsZWZ0fXB4YDtcbiAgICAgIHBhcmVudC5zdHlsZS53aWR0aCA9IGBjYWxjKDEwMHZ3IC0gJHtsZWZ0fXB4YDtcbiAgICB9XG4gIH0pXG5cbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24pO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlZG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRsYXN0WCA9IGV2ZW50LmNsaWVudFg7XG4gICAgcGFyZW50WCA9IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0O1xuICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnZHJhZ2dlZCcpXG5cbiAgICBkaXNwYXRjaCgnZHJhZ3N0YXJ0Jywge3RhcmdldDpub2RlLCBsYXN0WH0pO1xuXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVNb3VzZXVwKTtcblx0fVxuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlbW92ZShlKSB7XG4gICAgb2Zmc2V0WCArPSBlLmNsaWVudFggLSBsYXN0WDtcbiAgICBvZmZzZXQuc2V0KHt4OiBvZmZzZXRYLCB5OiAwfSk7XG4gICAgXG5cdFx0bGFzdFggPSBlLmNsaWVudFg7XG4gICAgZGlzcGF0Y2goJ2RyYWcnLCB7dGFyZ2V0Om5vZGUsIGxlZnQ6IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0fSk7XG5cdH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZXVwKGV2ZW50KSB7XG4gICAgb2Zmc2V0WCA9IDA7XG4gICAgZHJvcFRhcmdldCA9IG51bGw7XG4gICAgbGFzdFggPSB1bmRlZmluZWQ7XG4gICAgcGFyZW50WCA9IHVuZGVmaW5lZDtcblxuICAgIG5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnZHJhZ2dlZCcpO1xuICAgIG9mZnNldC5zZXQoe3g6IG5vZGUub2Zmc2V0TGVmdCwgeTogMH0pO1xuICAgIGRpc3BhdGNoKCdkcmFnZW5kJywge3RhcmdldDogbm9kZSwgbGVmdDogbm9kZS5wYXJlbnROb2RlLm9mZnNldExlZnR9KTtcbiAgICBcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlKTtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNldXApO1xuXHR9XG4gIFxuICByZXR1cm4ge1xuXHRcdGRlc3Ryb3koKSB7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93bik7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgcmV0dXJuIGhlaWdodCA/IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke2hlaWdodH1weCk7YCA6ICcnO1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJyZXNpemVcIiB1c2U6ZHJhZ2dhYmxlIHN0eWxlPVwie3Jlc2l6ZSgpfVwiPiA8L2Rpdj5cblxuPHN0eWxlPlxuLnJlc2l6ZSB7XG4gIHdpZHRoOiAycHg7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmM2M0OWQ7XG4gIGN1cnNvcjogY29sLXJlc2l6ZTtcbiAgei1pbmRleDogNTtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmV4cG9ydCBsZXQgbGVmdDtcbmV4cG9ydCBsZXQgaGVpZ2h0O1xuXG5pbXBvcnQge2NyZWF0ZUV2ZW50RGlzcGF0Y2hlcn0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCBTcGxpdHRlciBmcm9tICcuL1NwbGl0dGVyLnN2ZWx0ZSc7XG5cbmNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG5cbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgbGV0IGNzcyA9IGBsZWZ0OiAke2xlZnR9cHg7d2lkdGg6IGNhbGMoMTAwdncgLSAke2xlZnR9cHgpO2BcbiAgaWYgKGhlaWdodCkge1xuICAgIGNzcyArPSBgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gJHtoZWlnaHR9cHgpO2A7XG4gIH1cbiAgcmV0dXJuIGNzcztcbn1cblxuZnVuY3Rpb24gZHJhZ2dlZChlKSB7XG4gIGRpc3BhdGNoKCdkcmFnJywgIGUuZGV0YWlsKTtcbn1cblxuZnVuY3Rpb24gZHJhZ2VuZChlKSB7XG4gIGRpc3BhdGNoKCdkcmFnZW5kJywgIGUuZGV0YWlsKTtcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidmJveCByaWdodFwiIHN0eWxlPVwie3Jlc2l6ZSgpfVwiPlxuICA8U3BsaXR0ZXIgb246ZHJhZz17ZHJhZ2dlZH0gb246ZHJhZ2VuZD17ZHJhZ2VuZH0gaGVpZ2h0PVwie2hlaWdodH1cIi8+XG4gIDxzbG90Pjwvc2xvdD5cbjwvZGl2PlxuXG48c3R5bGU+XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbi52Ym94LnJpZ2h0IHtcbiAgcmlnaHQ6IDA7XG4gIGxlZnQ6IDE2M3B4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJhY2tncm91bmQ6ICNmMWY3ZjdlMztcbiAgd2lkdGg6IGNhbGMoMTAwdncgLSAxNjNweCk7XG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xuICBvdmVyZmxvdzogaGlkZGVuO1xufVxuXG5cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSAnLi4vb3RoZXIvc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gYnRuQ2xlYXIoZSkge1xuICB3c19fc2VuZCgnY2xlYXJMb2dzJywge2Jyb3dzZXJOYW1lOiAnY2hyb21pdW0nfSwgZGF0YSA9PiB7XG4gICAgLy8gbG9ncyB2aWV3IHdpbGwgYmUgY2xvc2Ugd2hlbiAubG9nX2V2ZW50cy5Mb2dzVGFibGVcbiAgICAvLyBsb2dzdG9yZS5zZXQoKSB0byBlbXB0eSBvbiBUYWJsZS5zdmVsdGUgXG4gICAgd2luZG93Lm1pdG0uY2xpZW50LmNsZWFyID0gdHJ1ZTtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBDbGVhciEnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvb2dsZShwcm9wKSB7XG4gIGNsaWVudC51cGRhdGUobiA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLiRjbGllbnQsXG4gICAgICAuLi5wcm9wLFxuICAgIH1cbiAgfSk7XG4gIGNvbnNvbGUubG9nKCRjbGllbnQpO1xuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywgey4uLnByb3B9LCBkYXRhID0+IHtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBjaGFuZ2Ugc3RhdGUnLCBkYXRhKTtcbiAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gYnRuSG9zdHN3Y2goZSkge1xuICB0b29nbGUoe25vaG9zdGxvZ3M6ICFlLnRhcmdldC5jaGVja2VkfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bkFyZ3N3Y2goZSkge1xuICB0b29nbGUoe25vYXJnbG9nczogIWUudGFyZ2V0LmNoZWNrZWR9KTtcbn1cblxuZnVuY3Rpb24gaG9zdGZsYWcoKSB7XG4gIHJldHVybiAhd2luZG93Lm1pdG0uY2xpZW50Lm5vaG9zdGxvZ3M7XG59XG5mdW5jdGlvbiBhcmdzZmxhZygpIHtcbiAgcmV0dXJuICF3aW5kb3cubWl0bS5jbGllbnQubm9hcmdsb2dzO1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIDxidXR0b24gb246Y2xpY2s9XCJ7YnRuQ2xlYXJ9XCI+XG4gICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIHZpZXdCb3g9XCIwIDAgNTEyIDUxMlwiPlxuICAgICAgPHBhdGggc3R5bGU9XCJmaWxsOnJlZFwiIGQ9XCJNMjU2IDhDMTE5LjAzNCA4IDggMTE5LjAzMyA4IDI1NnMxMTEuMDM0IDI0OCAyNDggMjQ4IDI0OC0xMTEuMDM0IDI0OC0yNDhTMzkyLjk2NyA4IDI1NiA4em0xMzAuMTA4IDExNy44OTJjNjUuNDQ4IDY1LjQ0OCA3MCAxNjUuNDgxIDIwLjY3NyAyMzUuNjM3TDE1MC40NyAxMDUuMjE2YzcwLjIwNC00OS4zNTYgMTcwLjIyNi00NC43MzUgMjM1LjYzOCAyMC42NzZ6TTEyNS44OTIgMzg2LjEwOGMtNjUuNDQ4LTY1LjQ0OC03MC0xNjUuNDgxLTIwLjY3Ny0yMzUuNjM3TDM2MS41MyA0MDYuNzg0Yy03MC4yMDMgNDkuMzU2LTE3MC4yMjYgNDQuNzM2LTIzNS42MzgtMjAuNjc2elwiLz5cbiAgICA8L3N2Zz5cbiAgPC9idXR0b24+ICBcbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0bkhvc3Rzd2NofSBjaGVja2VkPXtob3N0ZmxhZygpfT5ob3N0XG4gIDwvbGFiZWw+XG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XG4gICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG9uOmNsaWNrPXtidG5Bcmdzd2NofSBjaGVja2VkPXthcmdzZmxhZygpfT5hcmdzXG4gIDwvbGFiZWw+XG48L2Rpdj5cblxuPHN0eWxlPlxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIGxlZnQ6IDQ4cHg7XG4gIHRvcDogLTNweDtcbn1cbmJ1dHRvbiB7XG4gIGJvcmRlcjogMDtcbiAgd2lkdGg6IDI0cHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmV4cG9ydCBsZXQgaXRlbTtcblxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tICcuLi9vdGhlci9zdG9yZXMuanMnO1xuXG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgbG9nc3RvcmUuc2V0KHtcbiAgICByZXNwSGVhZGVyOiB7fSxcbiAgICByZXNwb25zZTogJycsXG4gICAgaGVhZGVyczogJycsXG4gICAgbG9naWQ6ICcnLFxuICAgIHRpdGxlOiAnJyxcbiAgICBwYXRoOiAnJyxcbiAgICB1cmw6ICcnLFxuICAgIGV4dDogJycsXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XG4gIGxldCB7bG9naWR9ID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQ7XG4gIGlmIChsb2dpZD09PSRsb2dzdG9yZS5sb2dpZCkge1xuICAgIGVtcHR5KCk7XG4gIH0gZWxzZSB7XG4gICAgZW1wdHkoKTtcbiAgICBjb25zdCBvID0gd2luZG93Lm1pdG0uZmlsZXMubG9nW2xvZ2lkXTtcbiAgICBjb25zdCBzcmMgPSB7XG4gICAgICByZXNwSGVhZGVyOiBvLnJlc3BIZWFkZXIsXG4gICAgICByZXNwb25zZTogJzxlbXB0eT4nLFxuICAgICAgaGVhZGVyczogJzxlbXB0eT4nLFxuICAgICAgbG9naWQ6IGxvZ2lkLFxuICAgICAgdGl0bGU6IG8udGl0bGUsXG4gICAgICBwYXRoOiBvLnBhdGgsXG4gICAgICB1cmw6IGxvZ2lkLnJlcGxhY2UoL14uK1xcLm1pdG0tcGxheS8sJ2h0dHBzOi8vbG9jYWxob3N0OjMwMDEnKSxcbiAgICAgIGV4dDogby5leHQsXG4gICAgfVxuICAgIGlmIChvLnRpdGxlLm1hdGNoKCcucG5nJykpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBsb2dzdG9yZS51cGRhdGUobiA9PiBzcmMpXG4gICAgICB9LCAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd3NfX3NlbmQoJ2dldENvbnRlbnQnLCB7ZnBhdGg6IGxvZ2lkfSwgKHtoZWFkZXJzLCByZXNwb25zZSwgZXh0fSkgPT4ge1xuICAgICAgICBsb2dzdG9yZS51cGRhdGUobiA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnNyYyxcbiAgICAgICAgICAgIHJlc3BvbnNlLFxuICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgIGV4dCxcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzdGF0dXMoe2dlbmVyYWw6Z30pIHtcbiAgcmV0dXJuIGBfJHtNYXRoLnRydW5jKGcuc3RhdHVzLzEwMCl9YDtcbn1cblxuZnVuY3Rpb24gbWV0aG9kKHtnZW5lcmFsOmd9KSB7XG4gIHJldHVybiBgJHtnLm1ldGhvZC50b0xvd2VyQ2FzZSgpfWA7XG59XG5mdW5jdGlvbiBtZXRob2QyKHtnZW5lcmFsOmd9KSB7XG4gIHJldHVybiBnLm1ldGhvZC50b0xvd2VyQ2FzZSgpICsgKGcuZXh0ID8gYDwke2cuZXh0fT4gYCA6ICcnKTtcbn1cbmZ1bmN0aW9uIHVybCh7Z2VuZXJhbDpnfSkge1xuICBpZiAoZy51cmwubWF0Y2goJy9sb2cvJykpIHtcbiAgICByZXR1cm4gZy51cmwuc3BsaXQoJ0AnKVsxXTtcbiAgfSBlbHNlIGlmICgkY2xpZW50Lm5vaG9zdGxvZ3MpIHtcbiAgICByZXR1cm4gZy5wYXRoO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgJHtnLnVybC5zcGxpdCgnPycpWzBdfWA7XG4gIH1cbn1cbmZ1bmN0aW9uIHB0aCh7Z2VuZXJhbDpnfSkge1xuICBpZiAoJGNsaWVudC5ub2FyZ2xvZ3MgfHwgZy51cmwubWF0Y2goJy9sb2cvJykpIHtcbiAgICByZXR1cm4gJyc7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGFybXMgPSBnLnVybC5zcGxpdCgnPycpWzFdO1xuICAgIHJldHVybiBwYXJtcyA/IGA/JHtwYXJtc31gIDogJyc7XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48dHIgY2xhc3M9XCJ0clwiPlxuICA8dGQgY2xhc3M9XCJ7aXRlbS5sb2dpZCA/ICdzZWxlY3RlZCcgOiAnJ31cIj5cbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JGxvZ3N0b3JlLmxvZ2lkPT09aXRlbS5sb2dpZH1cIlxuICAgIGRhdGEtbG9naWQ9e2l0ZW0ubG9naWR9XG4gICAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXG4gICAgPlxuICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0dXMge3N0YXR1cyhpdGVtKX1cIj57aXRlbS5nZW5lcmFsLnN0YXR1c308L3NwYW4+IFxuICAgICAgPHNwYW4gY2xhc3M9XCJtZXRob2Qge21ldGhvZChpdGVtKX1cIj57bWV0aG9kMihpdGVtKX08L3NwYW4+IFxuICAgICAgPHNwYW4gY2xhc3M9XCJ1cmxcIj57dXJsKGl0ZW0pfTwvc3Bhbj4gXG4gICAgICA8c3BhbiBjbGFzcz1cInBybVwiPntwdGgoaXRlbSl9PC9zcGFuPiBcbiAgICA8L2Rpdj5cbiAgPC90ZD5cbjwvdHI+XG5cbjxzdHlsZT5cbi50ZC1pdGVtOmhvdmVyIHtcbiAgY29sb3I6IGJsdWU7XG4gIGJhY2tncm91bmQ6IHllbGxvd1xuICAvKiBmb250LXdlaWdodDogYm9sZGVyOyAqL1xufVxudGQge1xuICBib3JkZXItYm90dG9tOiAzcHggc29saWQgI2MwZDhjY2ExO1xuICBmb250LWZhbWlseTogJ0dpbGwgU2FucycsICdHaWxsIFNhbnMgTVQnLCBDYWxpYnJpLCAnVHJlYnVjaGV0IE1TJywgc2Fucy1zZXJpZjtcbn1cbi50ZC1pdGVtLFxuLnRkLXNob3cge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDAuMXJlbTtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIHBhZGRpbmctbGVmdDogNXB4O1xufVxuLnRkLWl0ZW0udHJ1ZSB7XG4gIGNvbG9yOiBibHVlO1xuICBmb250LXdlaWdodDogYm9sZGVyO1xuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcbn1cbi5zdGF0dXMge1xuICBjb2xvcjogZ3JlZW47XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xufVxuLnN0YXR1cy5fNCxcbi5zdGF0dXMuXzUge1xuICBjb2xvcjogcmVkO1xufVxuLm1ldGhvZCB7XG4gIGNvbG9yOiBncmVlbjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG4ubWV0aG9kLnB1dCB7XG4gIGNvbG9yOiAjN2UyNmE3O1xufVxuLm1ldGhvZC5wb3N0IHtcbiAgY29sb3I6ICNhNzI2N2Y7XG59XG4ubWV0aG9kLmRlbGV0ZSB7XG4gIGNvbG9yOiByZWQ7XG59XG4ucHJtIHtcbiAgY29sb3I6ICNjY2I3Yjc7XG59XG48L3N0eWxlPiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuXG5leHBvcnQgY29uc3QgdGFic3RvcmUgPSB3cml0YWJsZSh7XG4gIGVkaXRvcjoge30sXG4gIHRhYjogMFxufSlcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcblxuZnVuY3Rpb24gYnRuTWluKCkge1xuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xuICBjb25zdCBpZCA9IGBlZGl0b3Ike3RhYisxfWA7XG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IuZm9sZEFsbCcpO1xufVxuXG5mdW5jdGlvbiBidG5QbHVzKCkge1xuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xuICBjb25zdCBpZCA9IGBlZGl0b3Ike3RhYisxfWA7XG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tbWluXCIgIG9uOmNsaWNrPVwie2J0bk1pbn1cIiA+Wy0tXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXBsdXNcIiBvbjpjbGljaz1cIntidG5QbHVzfVwiPlsrK108L2J1dHRvbj4uXG48L2Rpdj5cblxuPHN0eWxlPlxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCB7IFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5cbmNvbnN0IG1pbmltYXAgPSB7ZW5hYmxlZDogZmFsc2V9O1xuY29uc3Qgb3B0aW9uID0ge1xuICBjb250ZXh0bWVudTogZmFsc2UsXG4gIHJlYWRPbmx5OiB0cnVlLFxuICAvLyBtb2RlbDogbnVsbCxcbiAgbWluaW1hcCxcbn1cblxubGV0IG5vZGUxO1xubGV0IG5vZGUyO1xubGV0IG5vZGUzO1xuXG5sZXQgZWRpdDE7XG5sZXQgZWRpdDI7XG5sZXQgZWRpdDM7XG5cbmZ1bmN0aW9uIHJlc2l6ZShlZGl0b3IpIHtcbiAgcmV0dXJuIGVudHJpZXMgPT4ge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGVudHJpZXNbMF0uY29udGVudFJlY3RcbiAgICBlZGl0b3IubGF5b3V0KHt3aWR0aCwgaGVpZ2h0fSlcbiAgfVxufVxuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc29sZS53YXJuKCdvbk1vdW50IGxvZ3MgLSBCYXNlVGFiLnN2ZWx0ZScpO1xuICBjb25zb2xlLmxvZygkbG9nc3RvcmUpXG4gIGNvbnN0IGhkcnMgPSBKU09OLnBhcnNlKCRsb2dzdG9yZS5oZWFkZXJzKTtcbiAgY29uc3QgY3NwMyA9IGhkcnMuQ1NQIHx8IHt9O1xuICBjb25zdCB2YWwxID0ge1xuICAgIHZhbHVlOiAkbG9nc3RvcmUuaGVhZGVycyxcbiAgICBsYW5ndWFnZTogJ2pzb24nLFxuICAgIC4uLm9wdGlvbixcbiAgfTtcbiAgY29uc3QgdmFsMiA9IHtcbiAgICB2YWx1ZTogJGxvZ3N0b3JlLnJlc3BvbnNlLFxuICAgIGxhbmd1YWdlOiAkbG9nc3RvcmUuZXh0LFxuICAgIC4uLm9wdGlvbixcbiAgfTtcbiAgY29uc3QgdmFsMyA9IHtcbiAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkoY3NwMywgbnVsbCwgMiksXG4gICAgbGFuZ3VhZ2U6ICdqc29uJyxcbiAgICAuLi5vcHRpb24sXG4gIH07XG4gIGNvbnN0IGN0eXBlID0gJGxvZ3N0b3JlLnJlc3BIZWFkZXJbXCJjb250ZW50LXR5cGVcIl0gfHwgJ3RleHQvcGxhaW4nO1xuICBpZiAoY3R5cGUubWF0Y2goJ2h0bWwnKSkge1xuICAgIHZhbDIudmFsdWUgPSB2YWwyLnZhbHVlLlxuICAgIHJlcGxhY2UoL1xcXFxuXFxcXG4vZywgJycpLlxuICAgIHJlcGxhY2UoL1xcXFxuL2csICdcXG4nKS5cbiAgICByZXBsYWNlKC9cXFxcdC9nLCAnXFx0JykuXG4gICAgcmVwbGFjZSgvXFxcXFwiL2csICdcIicpLlxuICAgIHJlcGxhY2UoL15cIi8sICcnKS5cbiAgICByZXBsYWNlKC9cIiQvLCAnJyk7XG4gICAgdmFsMi5sYW5ndWFnZSA9ICdodG1sJztcbiAgfVxuXG4gIG5vZGUxID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28xJyk7XG4gIG5vZGUyID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28yJyk7XG4gIG5vZGUzID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28zJyk7XG5cbiAgZWRpdDEgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKG5vZGUxLCB2YWwxKTtcbiAgZWRpdDIgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKG5vZGUyLCB2YWwyKTtcbiAgZWRpdDMgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKG5vZGUzLCB2YWwzKTtcblxuICBjb25zb2xlLmxvZygnbG9hZCBtb25hY286IGxvZ3MgMSwyLDMnKVxuICBjb25zdCBybzEgPSBuZXcgUmVzaXplT2JzZXJ2ZXIocmVzaXplKGVkaXQxKSk7XG4gIGNvbnN0IHJvMiA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoZWRpdDIpKTtcbiAgY29uc3Qgcm8zID0gbmV3IFJlc2l6ZU9ic2VydmVyKHJlc2l6ZShlZGl0MykpO1xuXG4gIHJvMS5vYnNlcnZlKG5vZGUxKTtcbiAgcm8yLm9ic2VydmUobm9kZTIpO1xuICBybzMub2JzZXJ2ZShub2RlMyk7XG5cbiAgdGFic3RvcmUuc2V0KHtcbiAgICAuLi4kdGFic3RvcmUsXG4gICAgICBlZGl0b3I6IHtcbiAgICAgICAgZWRpdDEsXG4gICAgICAgIGVkaXQyLFxuICAgICAgICBlZGl0MyxcbiAgICAgIH0sXG4gIH0pXG59KTtcbmZ1bmN0aW9uIGlzQ1NQKCkge1xuICBjb25zdCBoID0gJGxvZ3N0b3JlLnJlc3BIZWFkZXI7XG4gIGNvbnN0IGNzcCA9IGhbJ2NvbnRlbnQtc2VjdXJpdHktcG9saWN5J10gfHwgaFsnY29udGVudC1zZWN1cml0eS1wb2xpY3ktcmVwb3J0LW9ubHknXTtcbiAgcmV0dXJuIGNzcDtcbn1cbjwvc2NyaXB0PlxuXG48VGFiIGxhYmVsPVwiSGVhZGVyc1wiPlxuICA8ZGl2IGNsYXNzPVwidmlldy1jb250YWluZXJcIj5cbiAgICA8ZGl2IGlkPVwibW9uYWNvMVwiPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvVGFiPlxuPFRhYiBsYWJlbD1cIlJlc3BvbnNlXCI+XG4gIDxkaXYgY2xhc3M9XCJ2aWV3LWNvbnRhaW5lclwiPlxuICAgIDxkaXYgaWQ9XCJtb25hY28yXCI+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9UYWI+XG48VGFiIGxhYmVsPVwiQ1NQXCI+XG4gIDxkaXYgY2xhc3M9XCJ2aWV3LWNvbnRhaW5lclwiPlxuICAgIDxkaXYgaWQ9XCJtb25hY28zXCI+XG4gIDwvZGl2PlxuPC9UYWI+XG5cbjxzdHlsZT5cbi52aWV3LWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XG59XG4jbW9uYWNvMSxcbiNtb25hY28yLFxuI21vbmFjbzMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogMDtcbiAgbGVmdDogMDtcbiAgYm90dG9tOiAwO1xuICByaWdodDogMDtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1qc29uIGEnKTtcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXG4gICAgICAgICAgdGFiOiBpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDUwMCk7XG59KTtcbjwvc2NyaXB0PlxuXG48QnV0dG9uMi8+XG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItanNvblwiIHNpemU9XCJpcy1zbWFsbFwiPlxuICA8QmFzZVRhYi8+XG48L1RhYnM+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1odG1sIGEnKTtcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXG4gICAgICAgICAgdGFiOiBpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDUwMCk7XG59KTtcbjwvc2NyaXB0PlxuXG48QnV0dG9uMi8+XG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItaHRtbFwiIHNpemU9XCJpcy1zbWFsbFwiPlxuICA8QmFzZVRhYi8+XG48L1RhYnM+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi10ZXh0IGEnKTtcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXG4gICAgICAgICAgdGFiOiBpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDUwMCk7XG59KTtcbjwvc2NyaXB0PlxuXG48QnV0dG9uMi8+XG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItdGV4dFwiIHNpemU9XCJpcy1zbWFsbFwiPlxuICA8QmFzZVRhYi8+XG48L1RhYnM+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1jc3MgYScpO1xuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0YWJzdG9yZS5zZXQoe1xuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcbiAgICAgICAgICB0YWI6IGksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgNTAwKTtcbn0pO1xuPC9zY3JpcHQ+XG5cbjxCdXR0b24yLz5cbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi1jc3NcIiBzaXplPVwiaXMtc21hbGxcIj5cbiAgPEJhc2VUYWIvPlxuPC9UYWJzPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcblxub25Nb3VudCgoKSA9PiB7XG4gIHNldFRpbWVvdXQoKCk9PntcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItanMgYScpO1xuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0YWJzdG9yZS5zZXQoe1xuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcbiAgICAgICAgICB0YWI6IGksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgNTAwKTtcbn0pO1xuPC9zY3JpcHQ+XG5cbjxCdXR0b24yLz5cbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi1qc1wiIHNpemU9XCJpcy1zbWFsbFwiPlxuICA8QmFzZVRhYi8+XG48L1RhYnM+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgSnNvbiBmcm9tICcuL0pzb24uc3ZlbHRlJztcbmltcG9ydCBIdG1sIGZyb20gJy4vSHRtbC5zdmVsdGUnO1xuaW1wb3J0IFRleHQgZnJvbSAnLi9UZXh0LnN2ZWx0ZSc7XG5pbXBvcnQgQ3NzIGZyb20gJy4vQ3NzLnN2ZWx0ZSc7XG5pbXBvcnQgSnMgZnJvbSAnLi9Kcy5zdmVsdGUnO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJpdGVtLXNob3dcIj5cbiAgeyNpZiAkbG9nc3RvcmUudGl0bGUubWF0Y2goJy5wbmcnKX1cbiAgICA8aW1nIHNyYz1cInskbG9nc3RvcmUudXJsfVwiIGFsdD1cImltYWdlXCIvPlxuICB7OmVsc2UgaWYgJGxvZ3N0b3JlLnRpdGxlLm1hdGNoKCcuanNvbicpfVxuICAgIDxKc29uLz5cbiAgezplbHNlIGlmICRsb2dzdG9yZS50aXRsZS5tYXRjaCgnLmh0bWwnKX1cbiAgICA8SHRtbC8+XG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUudGl0bGUubWF0Y2goJy50eHQnKX1cbiAgICA8VGV4dC8+XG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUudGl0bGUubWF0Y2goJy5jc3MnKX1cbiAgICA8Q3NzLz5cbiAgezplbHNlIGlmICRsb2dzdG9yZS50aXRsZS5tYXRjaCgnLmpzJyl9XG4gICAgPEpzLz5cbiAgezplbHNlfVxuICAgIDxwcmU+eyRsb2dzdG9yZS5yZXNwb25zZX08L3ByZT5cbiAgey9pZn1cbjwvZGl2PlxuXG48c3R5bGU+XG4uaXRlbS1zaG93IHtcbiAgbWFyZ2luLWxlZnQ6IDJweDtcbn1cbi5pdGVtLXNob3cgcHJle1xuICBwYWRkaW5nOiAwIDAgMCA1cHg7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tICcuLi9vdGhlci9zdG9yZXMuanMnO1xuXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xuaW1wb3J0IEJSZXNpemUgZnJvbSAnLi4vYm94L0JSZXNpemUuc3ZlbHRlJztcbmltcG9ydCBCSGVhZGVyIGZyb20gJy4uL2JveC9CSGVhZGVyLnN2ZWx0ZSc7XG5pbXBvcnQgQlRhYmxlIGZyb20gJy4uL2JveC9CVGFibGUuc3ZlbHRlJztcbmltcG9ydCBCdXR0b24gZnJvbSAnLi9CdXR0b24uc3ZlbHRlJztcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xuaW1wb3J0IFNob3cgZnJvbSAnLi9TaG93LnN2ZWx0ZSc7XG5cbmxldCBqc29uID0gMTYzO1xubGV0IGRhdGEgPSAgW107XG5cbiQ6IF9qc29uID0ganNvbjtcbiQ6IF9kYXRhID0gZGF0YTtcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnNvbGUud2Fybignb25Nb3VudCBsb2dzJyk7XG4gIF93c19jb25uZWN0LmxvZ09uTW91bnQgPSAoKSA9PiB3c19fc2VuZCgnZ2V0TG9nJywgJycsIGxvZ0hhbmRsZXIpO1xuXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnanNvbicsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBkYXRhLmpzb24gJiYgKGpzb24gPSBkYXRhLmpzb24pO1xuICB9KTtcbn0pO1xuXG5jb25zdCBsb2dIYW5kbGVyID0gb2JqID0+IHtcbiAgY29uc29sZS53YXJuKCd3c19fc2VuZChnZXRMb2cpJywgb2JqKTtcbiAgaWYgKCB3aW5kb3cubWl0bS5jbGllbnQuY2xlYXIpIHtcbiAgICBkZWxldGUgd2luZG93Lm1pdG0uY2xpZW50LmNsZWFyO1xuICAgIGxvZ3N0b3JlLnNldCh7XG4gICAgICByZXNwSGVhZGVyOiB7fSxcbiAgICAgIHJlc3BvbnNlOiAnJyxcbiAgICAgIGhlYWRlcnM6ICcnLFxuICAgICAgbG9naWQ6ICcnLFxuICAgICAgdGl0bGU6ICcnLFxuICAgICAgcGF0aDogJycsXG4gICAgICB1cmw6ICcnLFxuICAgICAgZXh0OiAnJyxcbiAgICB9KVxuICB9XG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5sb2c9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5sb2cgPSBvYmo7XG4gICAgZGF0YSA9IG9iajtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB7bG9nfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld0xvZyA9IHt9O1xuICAgIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgICBuZXdMb2dba10gPSBsb2dba10gPyBsb2dba10gOiBvYmpba107IFxuICAgIH1cbiAgICB3aW5kb3cubWl0bS5maWxlcy5sb2cgPSBuZXdMb2dcbiAgICBkYXRhID0gbmV3TG9nO1xuICB9XG59XG5cbndpbmRvdy5taXRtLmZpbGVzLmxvZ19ldmVudHMuTG9nc1RhYmxlID0gKCkgPT4ge1xuICB3c19fc2VuZCgnZ2V0TG9nJywgJycsIGxvZ0hhbmRsZXIpXG59XG5cbmZ1bmN0aW9uIGRyYWdlbmQoe2RldGFpbH0pIHtcbiAganNvbiA9IGRldGFpbC5sZWZ0O1xuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe2pzb259KVxufVxuXG5mdW5jdGlvbiBub2hvc3Rsb2dzKGZsYWcpIHtcbiAgY29uc29sZS5sb2coJ25vaG9zdGxvZ3MnLCBmbGFnKTtcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidmJveFwiPlxuICA8QlN0YXRpYyBoZWlnaHQ9XCIwXCI+XG4gICAgPEJIZWFkZXI+LUxvZ3MtPC9CSGVhZGVyPlxuICAgIDxCdXR0b24vPlxuICAgIDxCVGFibGUgdXBkYXRlPXtub2hvc3Rsb2dzKCRjbGllbnQubm9ob3N0bG9ncyl9PlxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBsb2dpZH1cbiAgICAgIDxJdGVtIGl0ZW09e3tcbiAgICAgICAgbG9naWQsXG4gICAgICAgIC4uLl9kYXRhW2xvZ2lkXSxcbiAgICAgICAgbm9ob3N0bG9nczogJGNsaWVudC5ub2hvc3Rsb2dzLFxuICAgICAgICB9fS8+XG4gICAgICB7L2VhY2h9XG4gICAgPC9CVGFibGU+XG4gIDwvQlN0YXRpYz5cbiAgeyNpZiAkbG9nc3RvcmUubG9naWR9XG4gICAgPEJSZXNpemUgbGVmdD17X2pzb259IG9uOmRyYWdlbmQ9e2RyYWdlbmR9PlxuICAgICAgPFNob3cvPlxuICAgIDwvQlJlc2l6ZT5cbiAgey9pZn1cbjwvZGl2PlxuXG48c3R5bGU+XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbjwvc3R5bGU+XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcblxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcbiAgb3BlbkRpc2FibGVkOiBmYWxzZSxcbiAgc2F2ZURpc2FibGVkOiB0cnVlLFxuICBnb0Rpc2FibGVkOiB0cnVlLFxuICBjb250ZW50OiAnJyxcbiAgcGF0aDogJydcbn0pXG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5mdW5jdGlvbiBidG5NaW4oKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9yb3V0ZSB9fSA9IHdpbmRvdy5taXRtO1xuICBfcm91dGUgJiYgX3JvdXRlLnRyaWdnZXIoJ2ZvbGQnLCAnZWRpdG9yLmZvbGRBbGwnKTtcbn1cblxuZnVuY3Rpb24gYnRuUGx1cygpIHtcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH19ID0gd2luZG93Lm1pdG07XG4gIF9yb3V0ZSAmJiBfcm91dGUudHJpZ2dlcigndW5mb2xkJywgJ2VkaXRvci51bmZvbGRBbGwnKTtcbn1cblxuZnVuY3Rpb24gYnRuU2F2ZShlKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9yb3V0ZSB9fSA9IHdpbmRvdy5taXRtO1xuICBpZiAoX3JvdXRlKSB7XG4gICAgY29uc3QgY29udGVudCA9IF9yb3V0ZS5nZXRWYWx1ZSgpXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLm4sXG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIHNhdmVEaXNhYmxlZDogdHJ1ZSxcbiAgICAgICAgZWRpdGJ1ZmZlcjogY29udGVudFxuICAgICAgfVxuICAgIH0pXG4gICAgY29uc29sZS5sb2coJHNvdXJjZSk7XG5cbiAgICB3c19fc2VuZCgnc2F2ZVJvdXRlJywgJHNvdXJjZSwgZGF0YSA9PiB7XG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7Li4ubiwgc2F2ZURpc2FibGVkOiB0cnVlfX0pO1xuICAgICAgY29uc29sZS5sb2coJ0RvbmUgU2F2ZSEnKTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidG5PcGVuKCkge1xuICB3c19fc2VuZCgnb3BlblJvdXRlJywgJHNvdXJjZSwgZGF0YSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0RvbmUgT3BlbiEnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bnMoaWQpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1tpZF07XG4gIGlmIChyb3V0ZSAmJiByb3V0ZS51cmxzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJvdXRlLnVybHMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidG5VcmwoaWQpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xuICAgIHJldHVybiByb3V0ZS51cmxzW2lkXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnRuVGFnKGUpIHtcbiAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IGUudGFyZ2V0LmRhdGFzZXQudXJsfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bkdvKGUpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJsKSB7XG4gICAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IHJvdXRlLnVybH0pO1xuICB9XG59XG48L3NjcmlwdD5cblxueyNpZiAkc291cmNlLnBhdGh9XG5cdDxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIHsjZWFjaCBidG5zKCRzb3VyY2UuaXRlbSkgYXMgaXRlbX1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5UYWd9XCJcbiAgZGF0YS11cmw9XCJ7YnRuVXJsKGl0ZW0pfVwiPntpdGVtfTwvYnV0dG9uPiAtIFxuICB7L2VhY2h9XG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLWdvXCIgZGlzYWJsZWQ9eyRzb3VyY2UuZ29EaXNhYmxlZH0gb246Y2xpY2s9XCJ7YnRuR299XCI+R288L2J1dHRvbj4uXG4gIDwvZGl2Plxuey9pZn1cbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cblBhdGg6eyRzb3VyY2UucGF0aH1cbnsjaWYgJHNvdXJjZS5wYXRofVxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tcGx1c1wiIG9uOmNsaWNrPVwie2J0blBsdXN9XCI+WysrXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXNhdmVcIiBkaXNhYmxlZD17JHNvdXJjZS5zYXZlRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0blNhdmV9XCI+U2F2ZTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLW9wZW5cIiBkaXNhYmxlZD17JHNvdXJjZS5vcGVuRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bk9wZW59XCI+T3BlbjwvYnV0dG9uPlxuICA8L2Rpdj5cbnsvaWZ9XG48L2Rpdj5cblxuPHN0eWxlPlxuLmZpbGUtcGF0aCB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgZm9udC1mYW1pbHk6IGF1dG87XG4gIGZvbnQtc2l6ZTogMC45ZW07XG4gIGNvbG9yOiBibHVlO1xufVxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuXG5leHBvcnQgbGV0IGl0ZW07XG5leHBvcnQgbGV0IG9uQ2hhbmdlO1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH19ID0gd2luZG93Lm1pdG07XG4gIGNvbnN0IGVsZW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbycpO1xuICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcbiAgICBjb25zdCB7d2lkdGg6IHcsIGhlaWdodDogaH0gPSBlbnRyaWVzWzBdLmNvbnRlbnRSZWN0O1xuICAgIF9yb3V0ZSAmJiBfcm91dGUubGF5b3V0KHt3aWR0aDogdywgaGVpZ2h0OiBofSlcbiAgfSk7XG4gIHJvLm9ic2VydmUoZWxlbWVudCk7XG5cbiAgd2luZG93Lm1pdG0uZWRpdG9yLl9yb3V0ZUVsID0gZWxlbWVudDtcbn0pO1xuXG5mdW5jdGlvbiBpbml0Q29kZUVkaXRvcihzcmMpIHtcbiAgY29uc29sZS5sb2coJ2xvYWQgbW9uYWNvOiByb3V0ZScpXG4gIGNvbnN0IGVsZW1lbnQgPSB3aW5kb3cubWl0bS5lZGl0b3IuX3JvdXRlRWw7XG4gIGNvbnN0IF9yb3V0ZSA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUoZWxlbWVudCwge1xuICAgIGxhbmd1YWdlOiAnamF2YXNjcmlwdCcsXG4gICAgLy8gdGhlbWU6IFwidnMtZGFya1wiLFxuICAgIG1pbmltYXA6IHtcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIH0sXG4gICAgdmFsdWU6ICcnLFxuICB9KTtcbiAgd2luZG93Lm1pdG0uZWRpdG9yLl9yb3V0ZSA9IF9yb3V0ZTtcblxuICBfcm91dGUub25EaWRDaGFuZ2VNb2RlbENvbnRlbnQob25DaGFuZ2UpO1xuICBfcm91dGUuc2V0VmFsdWUoc3JjKTtcbn1cblxuZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcbiAgbGV0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XG4gIGNvbnN0IHVybCA9IG1pdG0ucm91dGVzW2l0ZW1dLnVybDtcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH0sIGZpbGVzIH0gPSB3aW5kb3cubWl0bTtcbiAgY29uc3Qgb2JqID0gZmlsZXMucm91dGVbaXRlbV07XG4gIGNvbnNvbGUubG9nKGl0ZW0sIG9iaik7XG5cbiAgaWYgKF9yb3V0ZT09PXVuZGVmaW5lZCkge1xuICAgIGluaXRDb2RlRWRpdG9yKG9iai5jb250ZW50KTtcbiAgfSBlbHNlIHtcbiAgICBfcm91dGUuc2V0VmFsdWUob2JqLmNvbnRlbnQgfHwgJycpO1xuICAgIF9yb3V0ZS5yZXZlYWxMaW5lKDEpO1xuICB9XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIG9uQ2hhbmdlKGZhbHNlKTtcblxuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBnb0Rpc2FibGVkOiAodXJsPT09dW5kZWZpbmVkKSxcbiAgICAgICAgY29udGVudDogb2JqLmNvbnRlbnQsXG4gICAgICAgIHBhdGg6IG9iai5wYXRoLFxuICAgICAgICBpdGVtLFxuICAgICAgfVxuICAgIH0sIDEpO1xuICB9KVxufVxuPC9zY3JpcHQ+XG5cbjx0ciBjbGFzcz1cInRyXCI+XG4gIDx0ZD5cbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5wYXRoPT09aXRlbS5wYXRofVwiXG4gICAgICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cbiAgICAgIG9uOmNsaWNrPVwie2NsaWNrSGFuZGxlcn1cIlxuICAgID57aXRlbS50aXRsZX08L2Rpdj5cbiAgPC90ZD5cbjwvdHI+XG5cbjxzdHlsZT5cbi50ZC1pdGVtOmhvdmVyIHtcbiAgY29sb3I6IGJsdWU7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG50ZCB7XG4gIGJvcmRlci1ib3R0b206IDNweCBzb2xpZCAjYzBkOGNjYTE7XG59XG4udGQtaXRlbSxcbi50ZC1zaG93IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAwLjFyZW07XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBwYWRkaW5nLWxlZnQ6IDVweDsgIFxufVxuLnRkLWl0ZW0udHJ1ZSB7XG4gIGNvbG9yOiBibHVlO1xuICBmb250LXdlaWdodDogYm9sZGVyO1xuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5cbmltcG9ydCBCU3RhdGljIGZyb20gJy4uL2JveC9CU3RhdGljLnN2ZWx0ZSc7XG5pbXBvcnQgQlJlc2l6ZSBmcm9tICcuLi9ib3gvQlJlc2l6ZS5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IEl0ZW0gZnJvbSAnLi9JdGVtLnN2ZWx0ZSc7XG5cbmxldCByZXJlbmRlciA9IDA7XG5sZXQgcm91dGUgPSAxNjM7XG5sZXQgZGF0YSA9IFtdO1xuXG4kOiBfcm91dGUgPSByb3V0ZTtcbiQ6IF9kYXRhID0gZGF0YTtcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnNvbGUud2Fybignb25Nb3VudCByb3V0ZScpO1xuICBfd3NfY29ubmVjdC5yb3V0ZU9uTW91bnQgPSAoKSA9PiB3c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcblxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ3JvdXRlJywgZnVuY3Rpb24oZGF0YSkge1xuICAgIGRhdGEucm91dGUgJiYgKHJvdXRlID0gZGF0YS5yb3V0ZSk7XG4gIH0pO1xufSk7XG5cbmNvbnN0IHJvdXRlSGFuZGxlciA9IG9iaiA9PiB7XG4gIGNvbnNvbGUud2Fybignd3NfX3NlbmQoZ2V0Um91dGUpJywgb2JqKTtcbiAgaWYgKG9iai5fdGFnc18pIHtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzEgPSBvYmouX3RhZ3NfLl9fdGFnMTtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzIgPSBvYmouX3RhZ3NfLl9fdGFnMjtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzMgPSBvYmouX3RhZ3NfLl9fdGFnMztcbiAgICB3aW5kb3cubWl0bS5fX3RhZzQgPSBvYmouX3RhZ3NfLl9fdGFnNDtcbiAgfVxuICBpZiAod2luZG93Lm1pdG0uZmlsZXMucm91dGU9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG9iai5yb3V0ZXM7XG4gICAgZGF0YSA9IG9iai5yb3V0ZXM7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qge3JvdXRlfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld1JvdXRlID0ge307XG4gICAgY29uc3Qge3JvdXRlc30gPSBvYmo7XG4gICAgZm9yIChsZXQgayBpbiByb3V0ZXMpIHtcbiAgICAgIG5ld1JvdXRlW2tdID0gcm91dGVba10gPyByb3V0ZVtrXSA6IHJvdXRlc1trXTtcbiAgICAgIG5ld1JvdXRlW2tdLmNvbnRlbnQgPSByb3V0ZXNba10uY29udGVudDtcbiAgICB9XG4gICAgZGF0YSA9IG5ld1JvdXRlO1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlID0gbmV3Um91dGVcbiAgfVxuICAvKipcbiAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRSb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XG4gICAqL1xuICBjb25zdCB7Z2V0Um91dGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICBmb3IgKGxldCBrZXkgaW4gZ2V0Um91dGVfZXZlbnRzKSB7XG4gICAgZ2V0Um91dGVfZXZlbnRzW2tleV0oZGF0YSk7XG4gIH1cbiAgcmVyZW5kZXIgPSByZXJlbmRlciArIDE7XG59XG5cbndpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cy5yb3V0ZVRhYmxlID0gKCkgPT4ge1xuICBjb25zb2xlLmxvZygncm91dGVUYWJsZSBnZXR0aW5nIGNhbGxlZCEhIScpO1xuICB3aW5kb3cud3NfX3NlbmQoJ2dldFJvdXRlJywgJycsIHJvdXRlSGFuZGxlcik7XG59XG5cbmxldCBfdGltZW91dCA9IG51bGw7XG5mdW5jdGlvbiBlZGl0b3JDaGFuZ2VkKGUpIHtcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH19ID0gd2luZG93Lm1pdG07XG4gIGxldCBzYXZlRGlzYWJsZWQ7XG4gIGlmIChlPT09ZmFsc2UpIHtcbiAgICBzYXZlRGlzYWJsZWQgPSB0cnVlO1xuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHtcbiAgICAgIC4uLm4sXG4gICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXG4gICAgICBlZGl0YnVmZmVyOiBfcm91dGUuZ2V0VmFsdWUoKVxuICAgIH19KVxuICB9XG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XG4gIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKF9yb3V0ZSl7XG4gICAgICBzYXZlRGlzYWJsZWQgPSAoX3JvdXRlLmdldFZhbHVlKCk9PT0kc291cmNlLmVkaXRidWZmZXIpXG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7XG4gICAgICAgIC4uLm4sXG4gICAgICAgIHNhdmVEaXNhYmxlZFxuICAgICAgfX0pO1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgfVxuICB9LCA1MDApICBcbn1cblxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xuICByb3V0ZSA9IGRldGFpbC5sZWZ0O1xuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe3JvdXRlfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljIGhlaWdodD1cIjQ3XCI+XG4gICAgPEJIZWFkZXI+LVJvdXRlKHMpLTwvQkhlYWRlcj5cbiAgICA8QlRhYmxlPlxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICAgICAgPEl0ZW0gaXRlbT17e2VsZW1lbnQ6IGl0ZW0sIC4uLl9kYXRhW2l0ZW1dfX0gb25DaGFuZ2U9e2VkaXRvckNoYW5nZWR9Lz5cbiAgICAgIHsvZWFjaH1cbiAgICA8L0JUYWJsZT5cbiAgPC9CU3RhdGljPlxuICA8QlJlc2l6ZSBsZWZ0PXtfcm91dGV9IG9uOmRyYWdlbmQ9e2RyYWdlbmR9IGhlaWdodD1cIjQ3XCI+XG4gICAgPGRpdiBjbGFzcz1cImVkaXQtY29udGFpbmVyXCI+XG4gICAgICA8ZGl2IGlkPVwibW9uYWNvXCI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9CUmVzaXplPlxuPC9kaXY+XG5cblxuPHN0eWxlPlxuLnZib3gge1xuICBmbGV4OiBhdXRvO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5lZGl0LWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XG59XG4jbW9uYWNvIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIGJvdHRvbTogMDtcbiAgcmlnaHQ6IDA7XG59XG48L3N0eWxlPlxuIiwiLy8gZmVhdDogcHJvZmlsZVxuaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG5cbmV4cG9ydCBjb25zdCBzb3VyY2UgPSB3cml0YWJsZSh7XG4gIG9wZW5EaXNhYmxlZDogZmFsc2UsXG4gIHNhdmVEaXNhYmxlZDogdHJ1ZSxcbiAgZ29EaXNhYmxlZDogdHJ1ZSxcbiAgY29udGVudDogJycsXG4gIGZwYXRoOiAnJyxcbiAgcGF0aDogJydcbn0pXG4iLCI8c2NyaXB0Pi8vIGZlYXQ6IHByb2ZpbGVcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gYnRuTWluKCkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xuICBfcHJvZmlsZSAmJiBfcHJvZmlsZS50cmlnZ2VyKCdmb2xkJywgJ2VkaXRvci5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blBsdXMoKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlIH19ID0gd2luZG93Lm1pdG07XG4gIF9wcm9maWxlICYmIF9wcm9maWxlLnRyaWdnZXIoJ3VuZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xuICBpZiAoX3Byb2ZpbGUpIHtcbiAgICBjb25zdCBjb250ZW50ID0gX3Byb2ZpbGUuZ2V0VmFsdWUoKVxuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBjb250ZW50LFxuICAgICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXG4gICAgICAgIGVkaXRidWZmZXI6IGNvbnRlbnRcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xuXG4gICAgd3NfX3NlbmQoJ3NhdmVQcm9maWxlJywgJHNvdXJjZSwgZGF0YSA9PiB7XG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7Li4ubiwgc2F2ZURpc2FibGVkOiB0cnVlfX0pO1xuICAgICAgY29uc29sZS5sb2coJ0RvbmUgU2F2ZSEnKTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidG5PcGVuKCkge1xuICB3c19fc2VuZCgnb3BlblJvdXRlJywgJHNvdXJjZSwgZGF0YSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0RvbmUgT3BlbiEnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bnMoaWQpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1tpZF07XG4gIGlmIChyb3V0ZSAmJiByb3V0ZS51cmxzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJvdXRlLnVybHMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidG5VcmwoaWQpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xuICAgIHJldHVybiByb3V0ZS51cmxzW2lkXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnRuVGFnKGUpIHtcbiAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IGUudGFyZ2V0LmRhdGFzZXQudXJsfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bkdvKGUpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJsKSB7XG4gICAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IHJvdXRlLnVybH0pO1xuICB9XG59XG48L3NjcmlwdD5cblxueyNpZiAkc291cmNlLnBhdGh9XG5cdDxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIHsjZWFjaCBidG5zKCRzb3VyY2UuaXRlbSkgYXMgaXRlbX1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5UYWd9XCJcbiAgZGF0YS11cmw9XCJ7YnRuVXJsKGl0ZW0pfVwiPntpdGVtfTwvYnV0dG9uPiAtIFxuICB7L2VhY2h9XG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLWdvXCIgZGlzYWJsZWQ9eyRzb3VyY2UuZ29EaXNhYmxlZH0gb246Y2xpY2s9XCJ7YnRuR299XCI+R288L2J1dHRvbj4uXG4gIDwvZGl2Plxuey9pZn1cbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cblBhdGg6eyRzb3VyY2UucGF0aH1cbnsjaWYgJHNvdXJjZS5wYXRofVxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tcGx1c1wiIG9uOmNsaWNrPVwie2J0blBsdXN9XCI+WysrXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXNhdmVcIiBkaXNhYmxlZD17JHNvdXJjZS5zYXZlRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0blNhdmV9XCI+U2F2ZTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLW9wZW5cIiBkaXNhYmxlZD17JHNvdXJjZS5vcGVuRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bk9wZW59XCI+T3BlbjwvYnV0dG9uPlxuICA8L2Rpdj5cbnsvaWZ9XG48L2Rpdj5cblxuPHN0eWxlPlxuLmZpbGUtcGF0aCB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgZm9udC1mYW1pbHk6IGF1dG87XG4gIGZvbnQtc2l6ZTogMC45ZW07XG4gIGNvbG9yOiBibHVlO1xufVxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD4gLy8gZmVhdDogcHJvZmlsZVxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5cbmV4cG9ydCBsZXQgaXRlbTtcbmV4cG9ydCBsZXQgb25DaGFuZ2U7XG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xuICBjb25zdCBlbGVtZW50ID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9maWxlJyk7XG4gIHZhciBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcbiAgICBjb25zdCB7d2lkdGg6IHcsIGhlaWdodDogaH0gPSBlbnRyaWVzWzBdLmNvbnRlbnRSZWN0O1xuICAgIF9wcm9maWxlICYmIF9wcm9maWxlLmxheW91dCh7d2lkdGg6IHcsIGhlaWdodDogaH0pXG4gIH0pO1xuICByby5vYnNlcnZlKGVsZW1lbnQpO1xuXG4gIHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVsID0gZWxlbWVudDtcbn0pO1xuXG5mdW5jdGlvbiBpbml0Q29kZUVkaXRvcihzcmMpIHtcbiAgY29uc29sZS5sb2coJ2xvYWQgbW9uYWNvOiBwcm9maWxlJylcbiAgY29uc3QgZWxlbWVudCA9IHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVsO1xuICBjb25zdCBfcHJvZmlsZSA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUoZWxlbWVudCwge1xuICAgIGxhbmd1YWdlOiAnamF2YXNjcmlwdCcsXG4gICAgLy8gdGhlbWU6IFwidnMtZGFya1wiLFxuICAgIG1pbmltYXA6IHtcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIH0sXG4gICAgdmFsdWU6ICcnLFxuICB9KTtcbiAgd2luZG93Lm1pdG0uZWRpdG9yLl9wcm9maWxlID0gX3Byb2ZpbGU7XG5cbiAgX3Byb2ZpbGUub25EaWRDaGFuZ2VNb2RlbENvbnRlbnQob25DaGFuZ2UpO1xuICBfcHJvZmlsZS5zZXRWYWx1ZShzcmMpO1xufVxuXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xuICBsZXQge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcbiAgY29uc3QgdXJsID0gaXRlbTtcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3Byb2ZpbGUgfSwgZmlsZXMgfSA9IHdpbmRvdy5taXRtO1xuICBjb25zdCBvYmogPSBmaWxlcy5wcm9maWxlW2l0ZW1dO1xuICBjb25zb2xlLmxvZyhpdGVtLCBvYmopO1xuXG4gIGlmIChfcHJvZmlsZT09PXVuZGVmaW5lZCkge1xuICAgIGluaXRDb2RlRWRpdG9yKG9iai5jb250ZW50KTtcbiAgfSBlbHNlIHtcbiAgICBfcHJvZmlsZS5zZXRWYWx1ZShvYmouY29udGVudCB8fCAnJyk7XG4gICAgX3Byb2ZpbGUucmV2ZWFsTGluZSgxKTtcbiAgfVxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBvbkNoYW5nZShmYWxzZSk7XG5cbiAgICBzb3VyY2UudXBkYXRlKG4gPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ubixcbiAgICAgICAgZ29EaXNhYmxlZDogKHVybD09PXVuZGVmaW5lZCksXG4gICAgICAgIGNvbnRlbnQ6IG9iai5jb250ZW50LFxuICAgICAgICBmcGF0aDogb2JqLmZwYXRoLFxuICAgICAgICBwYXRoOiBvYmoucGF0aCxcbiAgICAgICAgaXRlbSxcbiAgICAgIH1cbiAgICB9KTtcbiAgfSwgMSk7XG59XG48L3NjcmlwdD5cblxuPHRyIGNsYXNzPVwidHJcIj5cbiAgPHRkPlxuICAgIDxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskc291cmNlLmZwYXRoPT09aXRlbS5mcGF0aH1cIlxuICAgICAgZGF0YS1pdGVtPXtpdGVtLmVsZW1lbnR9XG4gICAgICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcbiAgICA+e2l0ZW0udGl0bGV9PC9kaXY+XG4gIDwvdGQ+XG48L3RyPlxuXG48c3R5bGU+XG4udGQtaXRlbTpob3ZlciB7XG4gIGNvbG9yOiBibHVlO1xuICBmb250LXdlaWdodDogYm9sZGVyO1xufVxudGQge1xuICBib3JkZXItYm90dG9tOiAzcHggc29saWQgI2MwZDhjY2ExO1xufVxuLnRkLWl0ZW0sXG4udGQtc2hvdyB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcGFkZGluZzogMC4xcmVtO1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgcGFkZGluZy1sZWZ0OiA1cHg7ICBcbn1cbi50ZC1pdGVtLnRydWUge1xuICBjb2xvcjogYmx1ZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD4gLy8gZmVhdDogcHJvZmlsZVxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5cbmltcG9ydCBCU3RhdGljIGZyb20gJy4uL2JveC9CU3RhdGljLnN2ZWx0ZSc7XG5pbXBvcnQgQlJlc2l6ZSBmcm9tICcuLi9ib3gvQlJlc2l6ZS5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IEl0ZW0gZnJvbSAnLi9JdGVtLnN2ZWx0ZSc7XG5cbmxldCByZXJlbmRlciA9IDA7XG5sZXQgcHJvZmlsZSA9IDE2MztcbmxldCBkYXRhID0gW107XG5cbiQ6IF9wcm9maWxlID0gcHJvZmlsZTtcbiQ6IF9kYXRhID0gZGF0YTtcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnNvbGUud2Fybignb25Nb3VudCBwcm9maWxlJyk7XG4gIF93c19jb25uZWN0LnByb2ZpbGVPbk1vdW50ID0gKCkgPT4gd3NfX3NlbmQoJ2dldFByb2ZpbGUnLCAnJywgcHJvZmlsZUhhbmRsZXIpO1xuXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncHJvZmlsZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBkYXRhLnByb2ZpbGUgJiYgKHByb2ZpbGUgPSBkYXRhLnByb2ZpbGUpO1xuICB9KTtcbn0pO1xuXG5jb25zdCBwcm9maWxlSGFuZGxlciA9IG9iaiA9PiB7XG4gIGNvbnNvbGUud2Fybignd3NfX3NlbmQoZ2V0UHJvZmlsZSknLCBvYmopO1xuICBpZiAod2luZG93Lm1pdG0uZmlsZXMucHJvZmlsZT09PXVuZGVmaW5lZCkge1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLnByb2ZpbGUgPSBvYmo7XG4gICAgZGF0YSA9IG9iajtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB7cHJvZmlsZX0gPSB3aW5kb3cubWl0bS5maWxlcztcbiAgICBjb25zdCBuZXdwcm9maWxlID0ge307XG4gICAgZm9yIChsZXQgayBpbiBvYmopIHtcbiAgICAgIG5ld3Byb2ZpbGVba10gPSBwcm9maWxlW2tdID8gcHJvZmlsZVtrXSA6IG9ialtrXTtcbiAgICAgIG5ld3Byb2ZpbGVba10uY29udGVudCA9IG9ialtrXS5jb250ZW50O1xuICAgIH1cbiAgICBkYXRhID0gbmV3cHJvZmlsZTtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlID0gbmV3cHJvZmlsZVxuICB9XG4gIC8qKlxuICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcbiAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLmdldFByb2ZpbGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxuICAgKi9cbiAgY29uc3Qge2dldFByb2ZpbGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICBmb3IgKGxldCBrZXkgaW4gZ2V0UHJvZmlsZV9ldmVudHMpIHtcbiAgICBnZXRQcm9maWxlX2V2ZW50c1trZXldKGRhdGEpO1xuICB9XG4gIHJlcmVuZGVyID0gcmVyZW5kZXIgKyAxO1xufVxuXG53aW5kb3cubWl0bS5maWxlcy5wcm9maWxlX2V2ZW50cy5wcm9maWxlVGFibGUgPSAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdwcm9maWxlVGFibGUgZ2V0dGluZyBjYWxsZWQhISEnKTtcbiAgd2luZG93LndzX19zZW5kKCdnZXRQcm9maWxlJywgJycsIHByb2ZpbGVIYW5kbGVyKTtcbn1cblxubGV0IF90aW1lb3V0ID0gbnVsbDtcbmZ1bmN0aW9uIGVkaXRvckNoYW5nZWQoZSkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xuICBsZXQgc2F2ZURpc2FibGVkO1xuICBpZiAoZT09PWZhbHNlKSB7XG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xuICAgICAgLi4ubixcbiAgICAgIHNhdmVEaXNhYmxlZDogdHJ1ZSxcbiAgICAgIGVkaXRidWZmZXI6IF9wcm9maWxlLmdldFZhbHVlKClcbiAgICB9fSlcbiAgICBcbiAgfVxuICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xuICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmIChfcHJvZmlsZSl7XG4gICAgICBzYXZlRGlzYWJsZWQgPSAoX3Byb2ZpbGUuZ2V0VmFsdWUoKT09PSRzb3VyY2UuZWRpdGJ1ZmZlcilcbiAgICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHtcbiAgICAgICAgLi4ubixcbiAgICAgICAgc2F2ZURpc2FibGVkXG4gICAgICB9fSk7XG4gICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICB9XG4gIH0sIDUwMCkgIFxufVxuXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XG4gIHByb2ZpbGUgPSBkZXRhaWwubGVmdDtcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHtwcm9maWxlfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljIGhlaWdodD1cIjQ3XCI+XG4gICAgPEJIZWFkZXI+LXByb2ZpbGUocyktPC9CSGVhZGVyPlxuICAgIDxCVGFibGU+XG4gICAgICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGEpIGFzIGl0ZW19XG4gICAgICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSBvbkNoYW5nZT17ZWRpdG9yQ2hhbmdlZH0vPlxuICAgICAgey9lYWNofVxuICAgIDwvQlRhYmxlPlxuICA8L0JTdGF0aWM+XG4gIDxCUmVzaXplIGxlZnQ9e19wcm9maWxlfSBvbjpkcmFnZW5kPXtkcmFnZW5kfSBoZWlnaHQ9XCI0N1wiPlxuICAgIDxkaXYgY2xhc3M9XCJlZGl0LWNvbnRhaW5lclwiPlxuICAgICAgPGRpdiBpZD1cInByb2ZpbGVcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L0JSZXNpemU+XG48L2Rpdj5cblxuXG48c3R5bGU+XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmVkaXQtY29udGFpbmVyIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA1MHB4KTtcbn1cbiNwcm9maWxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIGJvdHRvbTogMDtcbiAgcmlnaHQ6IDA7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XG4gIHdzX19zZW5kKCdvcGVuSG9tZScsICcnLCBkYXRhID0+IHtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBvcGVuIGhvbWUgZm9sZGVyIScpO1xuICB9KTtcbn1cbjwvc2NyaXB0PlxuXG48YnV0dG9uIG9uOmNsaWNrPXtidG5PcGVufT5PcGVuIEhvbWU8L2J1dHRvbj5cbiIsIjxzY3JpcHQ+XG5mdW5jdGlvbiBidG5Db2RlKCkge1xuICB3c19fc2VuZCgnY29kZUhvbWUnLCAnJywgZGF0YSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0RvbmUgY29kZSBob21lIGZvbGRlciEnKTtcbiAgfSk7XG59XG48L3NjcmlwdD5cblxuPGJ1dHRvbiBvbjpjbGljaz17YnRuQ29kZX0+Q29kZSBIb21lPC9idXR0b24+XG4iLCI8c2NyaXB0PlxuZnVuY3Rpb24gYnRuUG9zdG1lc3NhZ2UoZSkge1xuICBjb25zdCBwb3N0bWVzc2FnZSA9IGUudGFyZ2V0LmNoZWNrZWQ7XG4gIHdzX19zZW5kKCdzZXRDbGllbnQnLCB7cG9zdG1lc3NhZ2V9LCBkYXRhID0+IHtcbiAgICB3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UgPSBkYXRhLnBvc3RtZXNzYWdlO1xuICAgIGNvbnNvbGUubG9nKCdEb25lIGNoYW5nZSBzdGF0ZSBwb3N0bWVzc2FnZScsIGRhdGEpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmxhZygpIHtcbiAgcmV0dXJuIHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZTtcbn1cbjwvc2NyaXB0PlxuXG48bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiPlxuICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0blBvc3RtZXNzYWdlfSBjaGVja2VkPXtmbGFnKCl9PlxuICBQb3N0IE1lc3NhZ2VzXG48L2xhYmVsPlxuIiwiPHNjcmlwdD5cbmZ1bmN0aW9uIGJ0bkNzcChlKSB7XG4gIGNvbnN0IGNzcCA9IGUudGFyZ2V0LmNoZWNrZWQ7XG4gIHdzX19zZW5kKCdzZXRDbGllbnQnLCB7Y3NwfSwgZGF0YSA9PiB7XG4gICAgd2luZG93Lm1pdG0uY2xpZW50LmNzcCA9IGRhdGEuY3NwO1xuICAgIGNvbnNvbGUubG9nKCdEb25lIGNoYW5nZSBzdGF0ZSBjc3AnLCBkYXRhKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZsYWcoKSB7XG4gIHJldHVybiB3aW5kb3cubWl0bS5jbGllbnQuY3NwO1xufVxuPC9zY3JpcHQ+XG5cbjxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XG4gIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuQ3NwfSBjaGVja2VkPXtmbGFnKCl9PlxuICBDb250ZW50IFNlYy4gUG9saWN5XG48L2xhYmVsPlxuIiwiPHNjcmlwdD5cbi8vaHR0cHM6Ly9jMGJyYS5naXRodWIuaW8vc3ZlbG1hL2luc3RhbGxcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IFRhZ3NUYWJsZSBmcm9tICcuL2NvbXBvbmVudHMvdGFncy9UYWJsZS5zdmVsdGUnO1xuaW1wb3J0IExvZ3NUYWJsZSBmcm9tICcuL2NvbXBvbmVudHMvbG9ncy9UYWJsZS5zdmVsdGUnO1xuaW1wb3J0IFJvdXRlVGFibGUgZnJvbSAnLi9jb21wb25lbnRzL3JvdXRlL1RhYmxlLnN2ZWx0ZSc7XG5pbXBvcnQgUHJvZmlsZVRhYmxlIGZyb20gJy4vY29tcG9uZW50cy9wcm9maWxlL1RhYmxlLnN2ZWx0ZSc7IC8vIGZlYXQ6IHByb2ZpbGVcbmltcG9ydCBPdGhlclRhYiBmcm9tICcuL2NvbXBvbmVudHMvb3RoZXIvVGFiLnN2ZWx0ZSc7XG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ25hdi50YWJzPnVsJyk7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdMSScpO1xuICAgIGxpLmlubmVySFRNTCA9ICd2Jyt3aW5kb3cubWl0bS52ZXJzaW9uO1xuICAgIGxpLmNsYXNzTGlzdC5hZGQoJ3ZlcnNpb24nKTtcbiAgICBub2RlLmFwcGVuZENoaWxkKGxpKTtcbiAgfSwgMTApO1xufSlcbjwvc2NyaXB0PlxuXG48bWFpbiBjbGFzcz1cIm1haW5cIj5cbjxUYWJzIHN0eWxlPVwiaXMtYm94ZWRcIiBzaXplPVwiaXMtc21hbGxcIj5cbiAgPFRhYiBsYWJlbD1cIlJvdXRlXCI+PFJvdXRlVGFibGUvPjwvVGFiPlxuICA8VGFiIGxhYmVsPVwiUHJvZmlsZVwiPjxQcm9maWxlVGFibGUvPjwvVGFiPlxuICA8VGFiIGxhYmVsPVwiTG9nc1wiPjxMb2dzVGFibGUvPjwvVGFiPlxuICA8VGFiIGxhYmVsPVwiVGFnc1wiPjxUYWdzVGFibGUvPjwvVGFiPlxuICA8VGFiIGxhYmVsPVwiT3RoZXJcIj48T3RoZXJUYWIvPjwvVGFiPlxuICA8IS0tIDxUYWIgbGFiZWw9XCJNb25hY29cIj48RWRpdG9yLz48L1RhYj4gLS0+XG48L1RhYnM+XG48L21haW4+XG5cbjxzdHlsZT5cblx0Omdsb2JhbChsaS52ZXJzaW9uKSB7XG4gICAgZm9udC1zaXplOiAxMHB4O1xuICAgIHBhZGRpbmctdG9wOiAzcHg7XG4gICAgcGFkZGluZy1sZWZ0OiA1cHg7XG4gICAgY29sb3I6IGNob2NvbGF0ZTtcbiAgICBmb250LWZhbWlseTogQmxpbmtNYWNTeXN0ZW1Gb250LCAtYXBwbGUtc3lzdGVtLCBcIlNlZ29lIFVJXCIsIFwiUm9ib3RvXCIsIFwiT3h5Z2VuXCIsIFwiVWJ1bnR1XCIsIFwiQ2FudGFyZWxsXCIsIFwiRmlyYSBTYW5zXCIsIFwiRHJvaWQgU2Fuc1wiLCBcIkhlbHZldGljYSBOZXVlXCIsIFwiSGVsdmV0aWNhXCIsIFwiQXJpYWxcIiwgc2Fucy1zZXJpZjtcblx0fVxuPC9zdHlsZT4iLCIvKiBnbG9iYWwgY2hyb21lICovXG5pbXBvcnQgQXBwIGZyb20gJy4vQXBwLnN2ZWx0ZSdcblxuY29uc29sZS5sb2coJ0xvYWQgTUlUTSBwbHVnaW4nKVxuXG5mdW5jdGlvbiB0b1JlZ2V4IChzdHIsIGZsYWdzID0gJycpIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoc3RyXG4gICAgLnJlcGxhY2UoL1xcLy9nLCAnXFxcXC8nKVxuICAgIC5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJylcbiAgICAucmVwbGFjZSgvXFw/L2csICdcXFxcPycpLCBmbGFncylcbn1cblxud2luZG93Lm1pdG0uZm4udG9SZWdleCA9IHRvUmVnZXhcbndpbmRvdy5taXRtLmVkaXRvciA9IHt9O1xud2luZG93Lm1pdG0uYnJvd3NlciA9IHtcbiAgY2hnVXJsX2V2ZW50czoge30sXG4gIGFjdGl2ZVVybDogJycsXG4gIHBhZ2U6IHt9XG59XG5cbmZ1bmN0aW9uIGNoZ1VybCAodXJsKSB7XG4gIGlmICghdXJsKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc29sZS5sb2coJ0NoZyB1cmw6JywgdXJsKVxuICBjb25zdCB7IGJyb3dzZXIgfSA9IHdpbmRvdy5taXRtXG4gIGJyb3dzZXIuYWN0aXZlVXJsID0gdXJsXG4gIGZvciAoY29uc3QgZSBpbiBicm93c2VyLmNoZ1VybF9ldmVudHMpIHtcbiAgICBicm93c2VyLmNoZ1VybF9ldmVudHNbZV0oKVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFVybCAoKSB7XG4gIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCB3aW5kb3dJZDogY2hyb21lLndpbmRvd3MuV0lORE9XX0lEX0NVUlJFTlQgfSxcbiAgICBmdW5jdGlvbiAodGFicykge1xuICAgICAgY29uc3QgdXJsID0gdGFic1swXS51cmxcbiAgICAgIGNoZ1VybCh1cmwpXG4gICAgfVxuICApXG59O1xuXG5sZXQgZGVib3VuY2VcbmxldCBmaXJzdFJ1blRhYnNPblVwZGF0ZWQgPSAxXG5jaHJvbWUudGFicy5vblVwZGF0ZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKHRhYklkLCBjaGFuZ2VJbmZvLCB0YWIpIHtcbiAgaWYgKGZpcnN0UnVuVGFic09uVXBkYXRlZCkge1xuICAgIGNvbnNvbGUubG9nKCdmaXJzdCBydW4gY2hyb21lLnRhYnMub25VcGRhdGVkJylcbiAgICBmaXJzdFJ1blRhYnNPblVwZGF0ZWQgPSAwXG4gIH1cbiAgaWYgKCF0YWIuYWN0aXZlKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCB7IGJyb3dzZXIgfSA9IHdpbmRvdy5taXRtXG4gIGJyb3dzZXIucGFnZSA9IHtcbiAgICAuLi5icm93c2VyLnBhZ2UsXG4gICAgLi4uY2hhbmdlSW5mbyxcbiAgICAuLi50YWJcbiAgfVxuXG4gIGlmIChjaGFuZ2VJbmZvLnN0YXR1cyA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgYnJvd3Nlci5wYWdlLnRpdGxlID0gJydcbiAgfSBlbHNlIGlmIChicm93c2VyLnBhZ2Uuc3RhdHVzID09PSAnY29tcGxldGUnICYmIGJyb3dzZXIucGFnZS50aXRsZSkge1xuICAgIGlmIChkZWJvdW5jZSkge1xuICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlKVxuICAgICAgZGVib3VuY2UgPSB1bmRlZmluZWRcbiAgICB9XG4gICAgZGVib3VuY2UgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdUYWIgVXBkYXRlISEhJywgdGFiLnVybCk7XG4gICAgICBkZWJvdW5jZSA9IHVuZGVmaW5lZFxuICAgICAgY2hnVXJsKHRhYi51cmwpXG4gICAgfSwgMTAwMClcbiAgfVxufSlcblxubGV0IGZpcnN0UnVuVGFic09uQWN0aXZhdGVkID0gMVxuY2hyb21lLnRhYnMub25BY3RpdmF0ZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKGFjdGl2ZUluZm8pIHtcbiAgaWYgKGZpcnN0UnVuVGFic09uQWN0aXZhdGVkKSB7XG4gICAgY29uc29sZS5sb2coJ2ZpcnN0IHJ1biBjaHJvbWUudGFicy5vbkFjdGl2YXRlZCcpXG4gICAgZmlyc3RSdW5UYWJzT25BY3RpdmF0ZWQgPSAwXG4gIH1cbiAgLy8gY29uc29sZS5sb2coJ1RhYiBDaGFuZ2UhISEnLCBhY3RpdmVJbmZvKTtcbiAgZ2V0VXJsKClcbn0pXG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoeyB0YXJnZXQ6IGRvY3VtZW50LmJvZHkgfSlcbmNvbnNvbGUubG9nKCdTdGFydCBwbHVnaW4nKVxuZ2V0VXJsKClcblxuZXhwb3J0IGRlZmF1bHQgYXBwXG5cbi8vIGxldCBpbnByb2Nlc3MgPSBmYWxzZTtcbi8vIGNvbnN0IHJlcGxheSA9ICgpPT57XG4vLyAgIHNldFRpbWVvdXQoKCkgPT4ge1xuLy8gICAgIGlucHJvY2VzcyA9IGZhbHNlO1xuLy8gICB9LDUwMCk7XG4vLyB9XG4vLyBmdW5jdGlvbiByZXBvcnRXaW5kb3dTaXplKCkge1xuLy8gICBpZiAoIWlucHJvY2Vzcykge1xuLy8gICAgIGlucHJvY2VzcyA9IHRydWU7XG4vLyAgICAgY29uc3Qge2lubmVyV2lkdGgsIGlubmVySGVpZ2h0OiBoZWlnaHQsIHdzX19zZW5kfSA9IHdpbmRvdztcbi8vICAgICBjaHJvbWUud2luZG93cy5nZXQoLTIsIHt9LCBkYXRhID0+IHtcbi8vICAgICAgIGNvbnN0IHt3aWR0aDpfd30gPSBkYXRhO1xuLy8gICAgICAgY29uc3Qgd2lkdGggPSBfdyAtIGlubmVyV2lkdGg7XG4vLyAgICAgICBjb25zb2xlLmxvZyh7d2lkdGgsIGhlaWdodCwgX3d9KTtcbi8vICAgICAgIHdzX19zZW5kKCdzZXRWaWV3cG9ydCcsIHt3aWR0aCwgaGVpZ2h0LCBfd30sIHJlcGxheSk7XG4vLyAgICAgfSlcbi8vICAgfVxuLy8gfVxuLy8gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVwb3J0V2luZG93U2l6ZSk7XG4vLyB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGV2ZW50ID0+IHtcbi8vICAgY29uc29sZS5sb2coe2V2ZW50fSk7XG4vLyB9KTtcbiJdLCJuYW1lcyI6WyJnZXQiLCJlbXB0eSIsInNvdXJjZSIsImJ0bnMiLCJidG5UYWciLCJidG5NaW4iLCJidG5QbHVzIiwiZmxhZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7SUFBQSxTQUFTLElBQUksR0FBRyxHQUFHO0lBRW5CLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDMUI7SUFDQSxJQUFJLEtB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
