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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
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
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
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
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
            throw new Error('Function called outside component initialization');
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* node_modules/svelma/src/components/Icon.svelte generated by Svelte v3.29.7 */

    const file = "node_modules/svelma/src/components/Icon.svelte";

    function create_fragment(ctx) {
    	let span;
    	let i;
    	let i_class_value;
    	let span_class_value;
    	let mounted;
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
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[12], false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
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

    	$$self.$$set = $$props => {
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

    	$$self.$capture_state = () => ({
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
    	});

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

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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
    		const props = options.props || {};

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
            for (const k in current_value) {
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            }
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
                    if (ctx.settled) {
                        task = null;
                    }
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

    /* node_modules/svelma/src/components/Tabs/Tabs.svelte generated by Svelte v3.29.7 */
    const file$1 = "node_modules/svelma/src/components/Tabs/Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (87:12) {#if tab.icon}
    function create_if_block(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
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
    	let mounted;
    	let dispose;
    	let if_block = /*tab*/ ctx[15].icon && create_if_block(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*index*/ ctx[17]);
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

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*tab*/ ctx[15].icon) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$tabs*/ 32) {
    						transition_in(if_block, 1);
    					}
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
    			mounted = false;
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
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

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
    				validate_each_argument(each_value);
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

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", slots, ['default']);
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

    	// This only runs as tabs are added/removed
    	const unsubscribe = tabs.subscribe(ts => {
    		if (ts.length > 0 && ts.length > value - 1) {
    			ts.forEach(t => t.deactivate());
    			if (ts[value]) ts[value].activate();
    		}
    	});

    	function changeTab(tabNumber) {
    		const ts = get_store_value(tabs);

    		// NOTE: change this back to using changeTab instead of activate/deactivate once transitions/animations are working
    		if (ts[activeTab]) ts[activeTab].deactivate();

    		if (ts[tabNumber]) ts[tabNumber].activate();

    		// ts.forEach(t => t.changeTab({ from: activeTab, to: tabNumber }))
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

    	const click_handler = index => changeTab(index);

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		getContext,
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		get: get_store_value,
    		writable,
    		Icon,
    		dispatch,
    		value,
    		size,
    		position,
    		style,
    		expanded,
    		activeTab,
    		tabs,
    		tabConfig,
    		unsubscribe,
    		changeTab,
    		$tabs
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    		if ("activeTab" in $$props) $$invalidate(4, activeTab = $$props.activeTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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
    		$$scope,
    		slots,
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

    /* node_modules/svelma/src/components/Tabs/Tab.svelte generated by Svelte v3.29.7 */
    const file$2 = "node_modules/svelma/src/components/Tabs/Tab.svelte";

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
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "tab " + /*direction*/ ctx[5] + " svelte-h9o7ze");
    			attr_dev(div, "aria-hidden", div_aria_hidden_value = !/*active*/ ctx[3]);
    			toggle_class(div, "is-active", /*active*/ ctx[3]);
    			add_location(div, file$2, 97, 0, 2229);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[10](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "transitionend", /*transitionend*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, label, iconPack, icon*/ 263) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_default_slot_changes, get_default_slot_context);
    				}
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
    			/*div_binding*/ ctx[10](null);
    			mounted = false;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tab", slots, ['default']);
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

    		// console.log({ index, from, to }, to === index)
    		if (from === index) {
    			// Transition out
    			$$invalidate(5, direction = index < to ? "left" : "right");
    		} else if (to === index) {
    			// Transition in; start at direction when rendered, then remove it
    			// console.log('TRANSITION', { index, to, active })
    			$$invalidate(3, active = true);

    			$$invalidate(5, direction = index > from ? "right" : "left");
    		} else // direction = ''
    		$$invalidate(5, direction = ""); // await tick()
    	}

    	function updateIndex() {
    		if (!el) return;
    		index = Array.prototype.indexOf.call(el.parentNode.children, el);
    	}

    	async function transitionend(event) {
    		// console.log({ index, active, activeTab: tabConfig.activeTab })
    		// console.log(event.target)
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

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(4, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(2, iconPack = $$props.iconPack);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		setContext,
    		getContext,
    		tick,
    		onMount,
    		Icon,
    		label,
    		icon,
    		iconPack,
    		active,
    		el,
    		index,
    		starting,
    		direction,
    		isIn,
    		tabConfig,
    		changeTab,
    		updateIndex,
    		transitionend
    	});

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

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		label,
    		icon,
    		iconPack,
    		active,
    		el,
    		direction,
    		transitionend,
    		changeTab,
    		$$scope,
    		slots,
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
    		const props = options.props || {};

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
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: '',
      fpath: '',
      path: ''
    });

    /* src/components/box/VBox.svelte generated by Svelte v3.29.7 */

    const file$3 = "src/components/box/VBox.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "vbox svelte-isss4r");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VBox", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class VBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VBox",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/box/BStatic.svelte generated by Svelte v3.29.7 */

    const file$4 = "src/components/box/BStatic.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "table-container svelte-1x2hxw3");
    			attr_dev(div0, "style", div0_style_value = /*resize*/ ctx[0]());
    			add_location(div0, file$4, 9, 2, 140);
    			attr_dev(div1, "class", "vbox left svelte-1x2hxw3");
    			add_location(div1, file$4, 8, 0, 114);
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
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BStatic", slots, ['default']);
    	let { top } = $$props;

    	function resize() {
    		return top ? `height: calc(100vh - ${top}px);` : "";
    	}

    	const writable_props = ["top"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BStatic> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ top, resize });

    	$$self.$inject_state = $$props => {
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [resize, top, $$scope, slots];
    }

    class BStatic extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { top: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BStatic",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*top*/ ctx[1] === undefined && !("top" in props)) {
    			console.warn("<BStatic> was created without expected prop 'top'");
    		}
    	}

    	get top() {
    		throw new Error("<BStatic>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<BStatic>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/box/Splitter.svelte generated by Svelte v3.29.7 */
    const file$5 = "src/components/box/Splitter.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let div_style_value;
    	let draggable_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "resize svelte-l4qu26");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$5, 76, 0, 1746);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(draggable_action = /*draggable*/ ctx[0].call(null, div));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Splitter", slots, []);
    	let { top } = $$props;
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
    		return top ? `height: calc(100vh - ${top}px);` : "";
    	}

    	const writable_props = ["top"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Splitter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("top" in $$props) $$invalidate(2, top = $$props.top);
    	};

    	$$self.$capture_state = () => ({
    		top,
    		spring,
    		createEventDispatcher,
    		dispatch,
    		dropTarget,
    		draggable,
    		resize
    	});

    	$$self.$inject_state = $$props => {
    		if ("top" in $$props) $$invalidate(2, top = $$props.top);
    		if ("dropTarget" in $$props) dropTarget = $$props.dropTarget;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [draggable, resize, top];
    }

    class Splitter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { top: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Splitter",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*top*/ ctx[2] === undefined && !("top" in props)) {
    			console.warn("<Splitter> was created without expected prop 'top'");
    		}
    	}

    	get top() {
    		throw new Error("<Splitter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Splitter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/box/BResize.svelte generated by Svelte v3.29.7 */
    const file$6 = "src/components/box/BResize.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let splitter;
    	let t;
    	let div_style_value;
    	let current;

    	splitter = new Splitter({
    			props: { top: /*top*/ ctx[0] },
    			$$inline: true
    		});

    	splitter.$on("drag", /*dragged*/ ctx[3]);
    	splitter.$on("dragend", /*dragend*/ ctx[4]);
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(splitter.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "vbox right svelte-g1qpjx");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[2](/*left*/ ctx[1]));
    			add_location(div, file$6, 26, 0, 462);
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
    			if (dirty & /*top*/ 1) splitter_changes.top = /*top*/ ctx[0];
    			splitter.$set(splitter_changes);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*left*/ 2 && div_style_value !== (div_style_value = /*resize*/ ctx[2](/*left*/ ctx[1]))) {
    				attr_dev(div, "style", div_style_value);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BResize", slots, ['default']);
    	let { top } = $$props;
    	let { left } = $$props;
    	const dispatch = createEventDispatcher();

    	function resize() {
    		let css = `left: ${left}px;width: calc(100vw - ${left}px);`;

    		if (top) {
    			css += `height: calc(100vh - ${top}px);`;
    		}

    		return css;
    	}

    	function dragged(e) {
    		dispatch("drag", e.detail);
    	}

    	function dragend(e) {
    		dispatch("dragend", e.detail);
    	}

    	const writable_props = ["top", "left"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BResize> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("top" in $$props) $$invalidate(0, top = $$props.top);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		top,
    		left,
    		createEventDispatcher,
    		Splitter,
    		dispatch,
    		resize,
    		dragged,
    		dragend
    	});

    	$$self.$inject_state = $$props => {
    		if ("top" in $$props) $$invalidate(0, top = $$props.top);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [top, left, resize, dragged, dragend, $$scope, slots];
    }

    class BResize extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { top: 0, left: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BResize",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*top*/ ctx[0] === undefined && !("top" in props)) {
    			console.warn("<BResize> was created without expected prop 'top'");
    		}

    		if (/*left*/ ctx[1] === undefined && !("left" in props)) {
    			console.warn("<BResize> was created without expected prop 'left'");
    		}
    	}

    	get top() {
    		throw new Error("<BResize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<BResize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<BResize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<BResize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/box/BHeader.svelte generated by Svelte v3.29.7 */

    const file$7 = "src/components/box/BHeader.svelte";

    function create_fragment$7(ctx) {
    	let table;
    	let tr;
    	let td;
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "td-header svelte-6s8rfe");
    			add_location(div, file$7, 3, 6, 51);
    			attr_dev(td, "class", "svelte-6s8rfe");
    			add_location(td, file$7, 2, 4, 40);
    			add_location(tr, file$7, 1, 2, 31);
    			attr_dev(table, "class", "table-header svelte-6s8rfe");
    			add_location(table, file$7, 0, 0, 0);
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
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BHeader", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class BHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BHeader",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/box/BTable.svelte generated by Svelte v3.29.7 */

    const file$8 = "src/components/box/BTable.svelte";

    function create_fragment$8(ctx) {
    	let table;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			if (default_slot) default_slot.c();
    			attr_dev(table, "class", "table-content svelte-z01nhz");
    			add_location(table, file$8, 0, 0, 0);
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
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BTable", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class BTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BTable",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/box/VBox2.svelte generated by Svelte v3.29.7 */
    const file$9 = "src/components/box/VBox2.svelte";

    // (23:6) {:else}
    function create_else_block_1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*title*/ ctx[2];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*title*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(23:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:6) {#if typeof title === 'string'}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*title*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(21:6) {#if typeof title === 'string'}",
    		ctx
    	});

    	return block;
    }

    // (20:4) <BHeader>
    function create_default_slot_4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (typeof /*title*/ ctx[2] === "string") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(20:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (29:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[5]];
    	var switch_value = /*List*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "details-list svelte-24mcew");
    			add_location(div, file$9, 29, 6, 672);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 32)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[5])])
    			: {};

    			if (switch_value !== (switch_value = /*List*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(29:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#if box}
    function create_if_block_1(ctx) {
    	let btable;
    	let current;

    	btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(btable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(btable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const btable_changes = {};

    			if (dirty & /*$$scope, List, props*/ 545) {
    				btable_changes.$$scope = { dirty, ctx };
    			}

    			btable.$set(btable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(btable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(btable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(btable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(27:4) {#if box}",
    		ctx
    	});

    	return block;
    }

    // (28:6) <BTable>
    function create_default_slot_3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[5]];
    	var switch_value = /*List*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 32)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[5])])
    			: {};

    			if (switch_value !== (switch_value = /*List*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(28:6) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (19:2) <BStatic {top}>
    function create_default_slot_2(ctx) {
    	let bheader;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*box*/ ctx[6]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(bheader.$$.fragment);
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(bheader, target, anchor);
    			insert_dev(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bheader_changes = {};

    			if (dirty & /*$$scope, title*/ 516) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bheader.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bheader.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bheader, detaching);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(19:2) <BStatic {top}>",
    		ctx
    	});

    	return block;
    }

    // (33:2) {#if show}
    function create_if_block$1(ctx) {
    	let bresize;
    	let current;

    	bresize = new BResize({
    			props: {
    				left: /*left*/ ctx[1],
    				top: /*top*/ ctx[7],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	bresize.$on("dragend", function () {
    		if (is_function(/*dragend*/ ctx[3])) /*dragend*/ ctx[3].apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			create_component(bresize.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bresize, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const bresize_changes = {};
    			if (dirty & /*left*/ 2) bresize_changes.left = /*left*/ ctx[1];
    			if (dirty & /*top*/ 128) bresize_changes.top = /*top*/ ctx[7];

    			if (dirty & /*$$scope*/ 512) {
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(33:2) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (34:2) <BResize {left} on:dragend={dragend} {top}>
    function create_default_slot_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
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
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(34:2) <BResize {left} on:dragend={dragend} {top}>",
    		ctx
    	});

    	return block;
    }

    // (18:0) <VBox>
    function create_default_slot(ctx) {
    	let bstatic;
    	let t;
    	let if_block_anchor;
    	let current;

    	bstatic = new BStatic({
    			props: {
    				top: /*top*/ ctx[7],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*show*/ ctx[4] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			create_component(bstatic.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(bstatic, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bstatic_changes = {};
    			if (dirty & /*top*/ 128) bstatic_changes.top = /*top*/ ctx[7];

    			if (dirty & /*$$scope, List, props, box, title*/ 613) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);

    			if (/*show*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*show*/ 16) {
    						transition_in(if_block, 1);
    					}
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
    			destroy_component(bstatic, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(18:0) <VBox>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let vbox;
    	let current;

    	vbox = new VBox({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(vbox.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(vbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const vbox_changes = {};

    			if (dirty & /*$$scope, left, top, dragend, show, List, props, box, title*/ 767) {
    				vbox_changes.$$scope = { dirty, ctx };
    			}

    			vbox.$set(vbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(vbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(vbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(vbox, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VBox2", slots, ['default']);
    	let { List } = $$props;
    	let { left } = $$props;
    	let { title } = $$props;
    	let { dragend } = $$props;
    	let { show = 1 } = $$props;
    	let { props = {} } = $$props;
    	let { box = true } = $$props;
    	let { top = "0" } = $$props;
    	const writable_props = ["List", "left", "title", "dragend", "show", "props", "box", "top"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VBox2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("List" in $$props) $$invalidate(0, List = $$props.List);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("dragend" in $$props) $$invalidate(3, dragend = $$props.dragend);
    		if ("show" in $$props) $$invalidate(4, show = $$props.show);
    		if ("props" in $$props) $$invalidate(5, props = $$props.props);
    		if ("box" in $$props) $$invalidate(6, box = $$props.box);
    		if ("top" in $$props) $$invalidate(7, top = $$props.top);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		List,
    		left,
    		title,
    		dragend,
    		show,
    		props,
    		box,
    		top,
    		VBox,
    		BStatic,
    		BResize,
    		BHeader,
    		BTable
    	});

    	$$self.$inject_state = $$props => {
    		if ("List" in $$props) $$invalidate(0, List = $$props.List);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("dragend" in $$props) $$invalidate(3, dragend = $$props.dragend);
    		if ("show" in $$props) $$invalidate(4, show = $$props.show);
    		if ("props" in $$props) $$invalidate(5, props = $$props.props);
    		if ("box" in $$props) $$invalidate(6, box = $$props.box);
    		if ("top" in $$props) $$invalidate(7, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [List, left, title, dragend, show, props, box, top, slots, $$scope];
    }

    class VBox2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			List: 0,
    			left: 1,
    			title: 2,
    			dragend: 3,
    			show: 4,
    			props: 5,
    			box: 6,
    			top: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VBox2",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*List*/ ctx[0] === undefined && !("List" in props)) {
    			console.warn("<VBox2> was created without expected prop 'List'");
    		}

    		if (/*left*/ ctx[1] === undefined && !("left" in props)) {
    			console.warn("<VBox2> was created without expected prop 'left'");
    		}

    		if (/*title*/ ctx[2] === undefined && !("title" in props)) {
    			console.warn("<VBox2> was created without expected prop 'title'");
    		}

    		if (/*dragend*/ ctx[3] === undefined && !("dragend" in props)) {
    			console.warn("<VBox2> was created without expected prop 'dragend'");
    		}
    	}

    	get List() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set List(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dragend() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dragend(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get props() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set props(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get box() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set box(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/route/Button.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$a = "src/components/route/Button.svelte";

    function get_each_context$1(ctx, list, i) {
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
    	let mounted;
    	let dispose;
    	let each_value = btns(/*$source*/ ctx[0].item);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			add_location(button, file$a, 76, 2, 1594);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$a, 71, 1, 1421);
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

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*btnGo*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*btnUrl, btns, $source, btnTag*/ 9) {
    				each_value = btns(/*$source*/ ctx[0].item);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    			mounted = false;
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
    function create_each_block$1(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[5] + "";
    	let t0;
    	let button_data_url_value;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" -");
    			attr_dev(button, "class", "tlb btn-go svelte-11e4kdx");
    			attr_dev(button, "data-url", button_data_url_value = /*btnUrl*/ ctx[3](/*item*/ ctx[5]));
    			add_location(button, file$a, 73, 2, 1488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			insert_dev(target, t1, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", btnTag, false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(73:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (82:0) {#if $source.path}
    function create_if_block$2(ctx) {
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
    	let mounted;
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
    			add_location(button0, file$a, 83, 2, 1792);
    			attr_dev(button1, "class", "tlb btn-plus svelte-11e4kdx");
    			add_location(button1, file$a, 84, 2, 1860);
    			attr_dev(button2, "class", "tlb btn-save svelte-11e4kdx");
    			button2.disabled = button2_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button2, file$a, 85, 2, 1928);
    			attr_dev(button3, "class", "tlb btn-open svelte-11e4kdx");
    			button3.disabled = button3_disabled_value = /*$source*/ ctx[0].openDisabled;
    			add_location(button3, file$a, 86, 2, 2028);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$a, 82, 1, 1762);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", btnMin, false, false, false),
    					listen_dev(button1, "click", btnPlus, false, false, false),
    					listen_dev(button2, "click", /*btnSave*/ ctx[1], false, false, false),
    					listen_dev(button3, "click", /*btnOpen*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(82:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$1(ctx);
    	let if_block1 = /*$source*/ ctx[0].path && create_if_block$2(ctx);

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
    			add_location(div, file$a, 79, 0, 1698);
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
    					if_block1 = create_if_block$2(ctx);
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
    		id: create_fragment$a.name,
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

    function instance$a($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(0, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);

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
    		console.log($source);

    		ws__send("openFolder", $source, data => {
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

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		source,
    		btnMin,
    		btnPlus,
    		btnSave,
    		btnOpen,
    		btns,
    		btnUrl,
    		btnTag,
    		btnGo,
    		$source
    	});

    	return [$source, btnSave, btnOpen, btnUrl, btnGo];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const cfg =  {
      language: 'javascript',
      // theme: "vs-dark",
      minimap: {
        enabled: false,
      },
      value: '',
      fontFamily: ['Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
      fontLigatures: true,
      fontSize: 11
    };

    const resize = editor => {
      return entries => {
        const {width, height} = entries[0].contentRect;
        editor.layout({width, height});
      }  
    };

    /* src/components/route/Editor.svelte generated by Svelte v3.29.7 */

    const { console: console_1$1 } = globals;
    const file$b = "src/components/route/Editor.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco");
    			add_location(div0, file$b, 25, 2, 696);
    			attr_dev(div1, "class", "edit-container");
    			add_location(div1, file$b, 24, 0, 665);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	let { onChange } = $$props;

    	onMount(async () => {
    		function initCodeEditor(src) {
    			console.log("load monaco: route");
    			const element = window.document.getElementById("monaco");
    			const _route = window.monaco.editor.create(element, cfg);
    			const ro = new ResizeObserver(resize(_route));
    			ro.observe(element);
    			window.mitm.editor._route = _route;
    			window.mitm.editor._routeEl = element;
    			_route.onDidChangeModelContent(onChange);
    			_route.setValue(src);
    		}

    		window.mitm.editor._routeEdit = initCodeEditor;
    	});

    	const writable_props = ["onChange"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({ onMount, cfg, resize, onChange });

    	$$self.$inject_state = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onChange];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$1.warn("<Editor> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/route/Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$2 } = globals;
    const file$c = "src/components/route/Item.svelte";

    function create_fragment$c(ctx) {
    	let tr;
    	let td;
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].path === /*item*/ ctx[0].path) + " svelte-1arv0rl");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$c, 38, 4, 733);
    			attr_dev(td, "class", "svelte-1arv0rl");
    			add_location(td, file$c, 37, 2, 724);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$c, 36, 0, 706);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, div);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
    			dispose();
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
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;
    	let { onChange } = $$props;

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const { editor: { _route, _routeEdit }, files } = mitm;
    		const url = mitm.routes[item].url;
    		const obj = files.route[item];
    		console.log(item, obj);

    		if (_route === undefined) {
    			_routeEdit(obj.content);
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
    						fpath: obj.fpath,
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

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		source,
    		item,
    		onChange,
    		clickHandler,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $source, clickHandler, onChange];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { item: 0, onChange: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

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

    /* src/components/route/List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$1, console: console_1$3 } = globals;

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (56:0) {#each Object.keys(_data) as item}
    function create_each_block$2(ctx) {
    	let item;
    	let current;

    	item = new Item({
    			props: {
    				item: {
    					element: /*item*/ ctx[5],
    					.../*_data*/ ctx[1][/*item*/ ctx[5]]
    				},
    				onChange: /*onChange*/ ctx[0]
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
    				element: /*item*/ ctx[5],
    				.../*_data*/ ctx[1][/*item*/ ctx[5]]
    			};

    			if (dirty & /*onChange*/ 1) item_changes.onChange = /*onChange*/ ctx[0];
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
    		source: "(56:0) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	validate_each_argument(each_value);
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
    			if (dirty & /*Object, _data, onChange*/ 3) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
    				validate_each_argument(each_value);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { onChange } = $$props;
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount route");
    		_ws_connect.routeOnMount = () => ws__send("getRoute", "", routeHandler);
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
    			$$invalidate(3, data = obj.routes);
    		} else {
    			const { route } = window.mitm.files;
    			const newRoute = {};
    			const { routes } = obj;

    			for (let k in routes) {
    				newRoute[k] = route[k] ? route[k] : routes[k];
    				newRoute[k].content = routes[k].content;
    			}

    			$$invalidate(3, data = newRoute);
    			window.mitm.files.route = newRoute;
    		}

    		/**
     * event handler after receiving ws packet
     * ie: window.mitm.files.getRoute_events = {eventObject...}
     */
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

    	const writable_props = ["onChange"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		onChange,
    		onMount,
    		Item,
    		rerender,
    		data,
    		routeHandler,
    		_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    	};

    	let _data;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 8) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [onChange, _data];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$3.warn("<List> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/route/Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$4 } = globals;

    // (55:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
    function create_default_slot$1(ctx) {
    	let editor;
    	let current;

    	editor = new Editor({
    			props: { onChange: /*onChange*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(55:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let button;
    	let t;
    	let vbox2;
    	let current;
    	button = new Button({ $$inline: true });

    	vbox2 = new VBox2({
    			props: {
    				title,
    				top,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[1],
    				List,
    				props: { onChange: /*onChange*/ ctx[2] },
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t = space();
    			create_component(vbox2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(vbox2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const vbox2_changes = {};
    			if (dirty & /*left*/ 1) vbox2_changes.left = /*left*/ ctx[0];

    			if (dirty & /*$$scope*/ 32) {
    				vbox2_changes.$$scope = { dirty, ctx };
    			}

    			vbox2.$set(vbox2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(vbox2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(vbox2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(vbox2, detaching);
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

    const top = "47";
    const title = "-Route(s)-";
    const id = "routeLeft";

    function instance$e($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(4, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 165;

    	onMount(async () => {
    		chrome.storage.local.get(id, function (opt) {
    			opt[id] && $$invalidate(0, left = opt[id]);
    		});
    	});

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    		const data = {};
    		data[id] = left;
    		chrome.storage.local.set(data);
    	}

    	let _timeout = null;

    	function onChange(e) {
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		source,
    		VBox2,
    		Button,
    		Editor,
    		List,
    		left,
    		top,
    		title,
    		id,
    		dragend,
    		_timeout,
    		onChange,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, dragend, onChange];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$e.name
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

    /* src/components/profile/Button.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$2, console: console_1$5 } = globals;
    const file$d = "src/components/profile/Button.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (71:0) {#if $source.path}
    function create_if_block_1$2(ctx) {
    	let div;
    	let each_value = btns$1(/*$source*/ ctx[0].item);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$d, 71, 1, 1457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*btnUrl, btns, $source, btnTag*/ 9) {
    				each_value = btns$1(/*$source*/ ctx[0].item);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    function create_each_block$3(ctx) {
    	let button;
    	let t_value = /*item*/ ctx[5] + "";
    	let t;
    	let button_data_url_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "tlb btn-go svelte-11e4kdx");
    			attr_dev(button, "data-url", button_data_url_value = /*btnUrl*/ ctx[3](/*item*/ ctx[5]));
    			add_location(button, file$d, 73, 2, 1524);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", btnTag$1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$source*/ 1 && t_value !== (t_value = /*item*/ ctx[5] + "")) set_data_dev(t, t_value);

    			if (dirty & /*$source*/ 1 && button_data_url_value !== (button_data_url_value = /*btnUrl*/ ctx[3](/*item*/ ctx[5]))) {
    				attr_dev(button, "data-url", button_data_url_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(73:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (82:0) {#if $source.path}
    function create_if_block$3(ctx) {
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
    	let mounted;
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
    			add_location(button0, file$d, 83, 2, 1834);
    			attr_dev(button1, "class", "tlb btn-plus svelte-11e4kdx");
    			add_location(button1, file$d, 84, 2, 1902);
    			attr_dev(button2, "class", "tlb btn-save svelte-11e4kdx");
    			button2.disabled = button2_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button2, file$d, 85, 2, 1970);
    			attr_dev(button3, "class", "tlb btn-open svelte-11e4kdx");
    			button3.disabled = button3_disabled_value = /*$source*/ ctx[0].openDisabled;
    			add_location(button3, file$d, 86, 2, 2070);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$d, 82, 1, 1804);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", btnMin$1, false, false, false),
    					listen_dev(button1, "click", btnPlus$1, false, false, false),
    					listen_dev(button2, "click", /*btnSave*/ ctx[1], false, false, false),
    					listen_dev(button3, "click", /*btnOpen*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(82:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$2(ctx);
    	let if_block1 = /*$source*/ ctx[0].path && create_if_block$3(ctx);

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
    			add_location(div, file$d, 79, 0, 1740);
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
    					if_block1 = create_if_block$3(ctx);
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
    		id: create_fragment$f.name,
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

    function instance$f($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(0, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);

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
    		console.log($source);

    		ws__send("openFolder", $source, data => {
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

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		source: source$1,
    		btnMin: btnMin$1,
    		btnPlus: btnPlus$1,
    		btnSave,
    		btnOpen,
    		btns: btns$1,
    		btnUrl,
    		btnTag: btnTag$1,
    		btnGo,
    		$source
    	});

    	return [$source, btnSave, btnOpen, btnUrl];
    }

    class Button$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src/components/profile/Editor.svelte generated by Svelte v3.29.7 */

    const { console: console_1$6 } = globals;
    const file$e = "src/components/profile/Editor.svelte";

    function create_fragment$g(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "profile");
    			add_location(div0, file$e, 25, 2, 715);
    			attr_dev(div1, "class", "edit-container");
    			add_location(div1, file$e, 24, 0, 684);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	let { onChange } = $$props;

    	onMount(async () => {
    		function initCodeEditor(src) {
    			console.log("load monaco: profile");
    			const element = window.document.getElementById("profile");
    			const _profile = window.monaco.editor.create(element, cfg);
    			const ro = new ResizeObserver(resize(_profile));
    			ro.observe(element);
    			window.mitm.editor._profile = _profile;
    			window.mitm.editor._profileEl = element;
    			_profile.onDidChangeModelContent(onChange);
    			_profile.setValue(src);
    		}

    		window.mitm.editor._profileEdit = initCodeEditor;
    	});

    	const writable_props = ["onChange"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({ onMount, cfg, resize, onChange });

    	$$self.$inject_state = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onChange];
    }

    class Editor$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$6.warn("<Editor> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/profile/Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$7 } = globals;
    const file$f = "src/components/profile/Item.svelte";

    function create_fragment$h(ctx) {
    	let tr;
    	let td;
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-1arv0rl");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$f, 38, 4, 749);
    			attr_dev(td, "class", "svelte-1arv0rl");
    			add_location(td, file$f, 37, 2, 740);
    			attr_dev(tr, "class", "tr");
    			add_location(tr, file$f, 36, 0, 722);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, div);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
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

    function instance$h($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(1, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;
    	let { onChange } = $$props;

    	function clickHandler(e) {
    		let { item } = e.target.dataset;
    		const { editor: { _profile, _profileEdit }, files } = mitm;
    		const obj = files.profile[item];
    		const url = item;
    		console.log(item, obj);

    		if (_profile === undefined) {
    			_profileEdit(obj.content);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		source: source$1,
    		item,
    		onChange,
    		clickHandler,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $source, clickHandler, onChange];
    }

    class Item$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { item: 0, onChange: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$7.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChange*/ ctx[3] === undefined && !("onChange" in props)) {
    			console_1$7.warn("<Item> was created without expected prop 'onChange'");
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

    /* src/components/profile/List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$3, console: console_1$8 } = globals;

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (49:0) {#each Object.keys(_data) as item}
    function create_each_block$4(ctx) {
    	let item;
    	let current;

    	item = new Item$1({
    			props: {
    				item: {
    					element: /*item*/ ctx[5],
    					.../*_data*/ ctx[1][/*item*/ ctx[5]]
    				},
    				onChange: /*onChange*/ ctx[0]
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
    				element: /*item*/ ctx[5],
    				.../*_data*/ ctx[1][/*item*/ ctx[5]]
    			};

    			if (dirty & /*onChange*/ 1) item_changes.onChange = /*onChange*/ ctx[0];
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(49:0) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
    			if (dirty & /*Object, _data, onChange*/ 3) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { onChange } = $$props;
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount profile");
    		_ws_connect.profileOnMount = () => ws__send("getProfile", "", profileHandler);
    	});

    	const profileHandler = obj => {
    		console.warn("ws__send(getProfile)", obj);

    		if (window.mitm.files.profile === undefined) {
    			window.mitm.files.profile = obj;
    			$$invalidate(3, data = obj);
    		} else {
    			const { profile } = window.mitm.files;
    			const newprofile = {};

    			for (let k in obj) {
    				newprofile[k] = profile[k] ? profile[k] : obj[k];
    				newprofile[k].content = obj[k].content;
    			}

    			$$invalidate(3, data = newprofile);
    			window.mitm.files.profile = newprofile;
    		}

    		/**
     * event handler after receiving ws packet
     * ie: window.mitm.files.getProfile_events = {eventObject...}
     */
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

    	const writable_props = ["onChange"];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$8.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		onChange,
    		onMount,
    		Item: Item$1,
    		rerender,
    		data,
    		profileHandler,
    		_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    	};

    	let _data;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 8) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [onChange, _data];
    }

    class List$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$8.warn("<List> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/profile/Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$9 } = globals;

    // (55:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
    function create_default_slot$2(ctx) {
    	let editor;
    	let current;

    	editor = new Editor$1({
    			props: { onChange: /*onChange*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(55:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let button;
    	let t;
    	let vbox2;
    	let current;
    	button = new Button$1({ $$inline: true });

    	vbox2 = new VBox2({
    			props: {
    				title: title$1,
    				top: top$1,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[1],
    				List: List$1,
    				props: { onChange: /*onChange*/ ctx[2] },
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t = space();
    			create_component(vbox2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(vbox2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const vbox2_changes = {};
    			if (dirty & /*left*/ 1) vbox2_changes.left = /*left*/ ctx[0];

    			if (dirty & /*$$scope*/ 32) {
    				vbox2_changes.$$scope = { dirty, ctx };
    			}

    			vbox2.$set(vbox2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(vbox2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(vbox2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(vbox2, detaching);
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

    const top$1 = "47";
    const title$1 = "-Profile(s)-";
    const id$1 = "profileLeft";

    function instance$j($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(4, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 165;

    	onMount(async () => {
    		chrome.storage.local.get(id$1, function (opt) {
    			opt[id$1] && $$invalidate(0, left = opt[id$1]);
    		});
    	});

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    		const data = {};
    		data[id$1] = left;
    		chrome.storage.local.set(data);
    	}

    	let _timeout = null;

    	function onChange(e) {
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$9.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		source: source$1,
    		VBox2,
    		Button: Button$1,
    		Editor: Editor$1,
    		List: List$1,
    		left,
    		top: top$1,
    		title: title$1,
    		id: id$1,
    		dragend,
    		_timeout,
    		onChange,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("_timeout" in $$props) _timeout = $$props._timeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, dragend, onChange];
    }

    class Index$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$j.name
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

    /* src/components/logs/Button.svelte generated by Svelte v3.29.7 */

    const { console: console_1$a } = globals;
    const file$g = "src/components/logs/Button.svelte";

    function create_fragment$k(ctx) {
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
    	let mounted;
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
    			add_location(path, file$g, 45, 6, 1042);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$g, 44, 4, 946);
    			attr_dev(button, "class", "svelte-16f7euc");
    			add_location(button, file$g, 43, 2, 911);
    			attr_dev(input0, "type", "checkbox");
    			input0.checked = input0_checked_value = hostflag();
    			add_location(input0, file$g, 49, 4, 1451);
    			attr_dev(label0, "class", "checkbox");
    			add_location(label0, file$g, 48, 2, 1422);
    			attr_dev(input1, "type", "checkbox");
    			input1.checked = input1_checked_value = argsflag();
    			add_location(input1, file$g, 52, 4, 1565);
    			attr_dev(label1, "class", "checkbox");
    			add_location(label1, file$g, 51, 2, 1536);
    			attr_dev(div, "class", "btn-container svelte-16f7euc");
    			set_style(div, "top", "1px");
    			add_location(div, file$g, 42, 0, 863);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", btnClear, false, false, false),
    					listen_dev(input0, "click", /*btnHostswch*/ ctx[0], false, false, false),
    					listen_dev(input1, "click", /*btnArgswch*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
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

    function btnClear(e) {
    	ws__send("clearLogs", { browserName: "chromium" }, data => {
    		// logs view will be close when .log_events.LogsTable
    		// logstore.set() to empty on Table.svelte 
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

    function instance$k($$self, $$props, $$invalidate) {
    	let $client;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(2, $client = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$a.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		client,
    		btnClear,
    		toogle,
    		btnHostswch,
    		btnArgswch,
    		hostflag,
    		argsflag,
    		$client
    	});

    	return [btnHostswch, btnArgswch];
    }

    class Button$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src/components/logs/Title.svelte generated by Svelte v3.29.7 */

    function create_fragment$l(ctx) {
    	let t;
    	let button;
    	let current;
    	button = new Button$2({ $$inline: true });

    	const block = {
    		c: function create() {
    			t = text("-Logs-\n");
    			create_component(button.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(button, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Button: Button$2 });
    	return [];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src/components/logs/Item.svelte generated by Svelte v3.29.7 */
    const file$h = "src/components/logs/Item.svelte";

    function create_fragment$m(ctx) {
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
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
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
    			attr_dev(span0, "class", span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-lw7dsl");
    			add_location(span0, file$h, 94, 2, 1972);
    			attr_dev(span1, "class", span1_class_value = "method " + method(/*item*/ ctx[0]) + " svelte-lw7dsl");
    			add_location(span1, file$h, 95, 2, 2040);
    			attr_dev(span2, "class", "url");
    			add_location(span2, file$h, 96, 2, 2102);
    			attr_dev(span3, "class", "prm svelte-lw7dsl");
    			add_location(span3, file$h, 97, 2, 2142);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-lw7dsl");
    			attr_dev(div, "data-logid", div_data_logid_value = /*item*/ ctx[0].logid);
    			add_location(div, file$h, 90, 0, 1866);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
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

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].general.status + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-lw7dsl")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = method2(/*item*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "method " + method(/*item*/ ctx[0]) + " svelte-lw7dsl")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*url*/ ctx[3](/*item*/ ctx[0]) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = /*pth*/ ctx[4](/*item*/ ctx[0]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$logstore, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-lw7dsl")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_logid_value !== (div_data_logid_value = /*item*/ ctx[0].logid)) {
    				attr_dev(div, "data-logid", div_data_logid_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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

    function status({ general: g }) {
    	return `_${Math.trunc(g.status / 100)}`;
    }

    function method({ general: g }) {
    	return `${g.method.toLowerCase()}`;
    }

    function method2({ general: g }) {
    	return g.method.toLowerCase() + (g.ext ? `<${g.ext}> ` : "");
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $client;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(1, $logstore = $$value));
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(5, $client = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;

    	function empty() {
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

    	function clickHandler(e) {
    		let { logid } = e.currentTarget.dataset;

    		if (logid === $logstore.logid) {
    			empty();
    		} else {
    			empty();
    			const o = window.mitm.files.log[item.key][logid];

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
    		let msg;

    		if (g.url.match("/log/")) {
    			msg = g.url.split("@")[1];
    		} else if ($client.nohostlogs) {
    			msg = g.path;
    		} else {
    			msg = `${g.url.split("?")[0]}`;
    		}

    		if ($client.nohostlogs && g.ext === "") {
    			const [a1, a2] = msg.split("--");
    			msg = a2 || a1;
    		}

    		return msg;
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

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		item,
    		logstore,
    		client,
    		empty,
    		clickHandler,
    		status,
    		method,
    		method2,
    		url,
    		pth,
    		$logstore,
    		$client
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $logstore, clickHandler, url, pth];
    }

    class Item$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$m.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

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

    /* src/components/logs/List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$4, console: console_1$b } = globals;
    const file$i = "src/components/logs/List.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (63:2) {#each Object.keys(_data[key]) as logid}
    function create_each_block_1(ctx) {
    	let item;
    	let current;

    	item = new Item$2({
    			props: {
    				item: {
    					key: /*key*/ ctx[5],
    					logid: /*logid*/ ctx[8],
    					.../*_data*/ ctx[0][/*key*/ ctx[5]][/*logid*/ ctx[8]],
    					nohostlogs: /*$client*/ ctx[1].nohostlogs
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

    			if (dirty & /*_data, $client*/ 3) item_changes.item = {
    				key: /*key*/ ctx[5],
    				logid: /*logid*/ ctx[8],
    				.../*_data*/ ctx[0][/*key*/ ctx[5]][/*logid*/ ctx[8]],
    				nohostlogs: /*$client*/ ctx[1].nohostlogs
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(63:2) {#each Object.keys(_data[key]) as logid}",
    		ctx
    	});

    	return block;
    }

    // (61:0) {#each Object.keys(_data) as key, i}
    function create_each_block$5(ctx) {
    	let details;
    	let summary;
    	let raw_value = /*key*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let current;
    	let each_value_1 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[5]]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr_dev(summary, "class", "svelte-onq3ff");
    			add_location(summary, file$i, 61, 11, 1299);
    			add_location(details, file$i, 61, 2, 1290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			summary.innerHTML = raw_value;
    			append_dev(details, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(details, null);
    			}

    			append_dev(details, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*_data*/ 1) && raw_value !== (raw_value = /*key*/ ctx[5] + "")) summary.innerHTML = raw_value;
    			if (dirty & /*Object, _data, $client*/ 3) {
    				each_value_1 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[5]]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(details, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    			if (detaching) detach_dev(details);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(61:0) {#each Object.keys(_data) as key, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[0]);
    	validate_each_argument(each_value);
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
    			if (dirty & /*Object, _data, $client*/ 3) {
    				each_value = Object.keys(/*_data*/ ctx[0]);
    				validate_each_argument(each_value);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function nohostlogs(flag) {
    	console.log("nohostlogs", flag);
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let $client;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(1, $client = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount logs");
    		_ws_connect.logOnMount = () => ws__send("getLog", "", logHandler);
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
    			$$invalidate(2, data = obj);
    		} else {
    			const { log } = window.mitm.files;
    			const newLog = {};

    			for (let k in obj) {
    				newLog[k] = obj[k];
    			}

    			$$invalidate(2, data = newLog);
    			window.mitm.files.log = newLog;
    		}
    	};

    	window.mitm.files.log_events.LogsTable = () => {
    		ws__send("getLog", "", logHandler);
    	};

    	const writable_props = [];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$b.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		logstore,
    		onMount,
    		Item: Item$2,
    		client,
    		rerender,
    		data,
    		logHandler,
    		nohostlogs,
    		_data,
    		$client
    	});

    	$$self.$inject_state = $$props => {
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("_data" in $$props) $$invalidate(0, _data = $$props._data);
    	};

    	let _data;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 4) {
    			 $$invalidate(0, _data = data);
    		}
    	};

    	return [_data, $client];
    }

    class List$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    const tabstore = writable({
      editor: {},
      tab: 0
    });

    /* src/components/logs/Button2.svelte generated by Svelte v3.29.7 */

    const { console: console_1$c } = globals;
    const file$j = "src/components/logs/Button2.svelte";

    function create_fragment$o(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let mounted;
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
    			button2.textContent = "Open";
    			attr_dev(button0, "class", "tlb btn-min svelte-1mu3roi");
    			add_location(button0, file$j, 28, 2, 612);
    			attr_dev(button1, "class", "tlb btn-plus svelte-1mu3roi");
    			add_location(button1, file$j, 29, 2, 680);
    			attr_dev(button2, "class", "tlb btn-open svelte-1mu3roi");
    			add_location(button2, file$j, 30, 2, 748);
    			attr_dev(div, "class", "btn-container svelte-1mu3roi");
    			add_location(div, file$j, 27, 0, 582);
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
    			append_dev(div, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*btnMin*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*btnPlus*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*btnOpen*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
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
    	let $logstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(3, $tabstore = $$value));
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(4, $logstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button2", slots, []);

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

    	function btnOpen() {
    		let arr = $logstore.path.split("/");
    		arr.pop();
    		const path = arr.join("/");
    		console.log({ path });

    		ws__send("openFolder", { path }, data => {
    			console.log("Done Open!");
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$c.warn(`<Button2> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		tabstore,
    		logstore,
    		btnMin,
    		btnPlus,
    		btnOpen,
    		$tabstore,
    		$logstore
    	});

    	return [btnMin, btnPlus, btnOpen];
    }

    class Button2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button2",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src/components/logs/BaseTab.svelte generated by Svelte v3.29.7 */

    const { console: console_1$d } = globals;
    const file$k = "src/components/logs/BaseTab.svelte";

    // (88:0) <Tab label="Headers">
    function create_default_slot_2$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco1");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 89, 4, 2081);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 88, 2, 2048);
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
    		source: "(88:0) <Tab label=\\\"Headers\\\">",
    		ctx
    	});

    	return block;
    }

    // (94:0) <Tab label="Response">
    function create_default_slot_1$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco2");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 95, 4, 2185);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 94, 2, 2152);
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
    		source: "(94:0) <Tab label=\\\"Response\\\">",
    		ctx
    	});

    	return block;
    }

    // (100:0) <Tab label="CSP">
    function create_default_slot$3(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco3");
    			attr_dev(div0, "class", "svelte-1tedr8d");
    			add_location(div0, file$k, 101, 4, 2284);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$k, 100, 2, 2251);
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
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(100:0) <Tab label=\\\"CSP\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let tab0;
    	let t0;
    	let tab1;
    	let t1;
    	let tab2;
    	let current;

    	tab0 = new Tab({
    			props: {
    				label: "Headers",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				label: "Response",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: {
    				label: "CSP",
    				$$slots: { default: [create_default_slot$3] },
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

    			if (dirty & /*$$scope*/ 1024) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    			const tab2_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $tabstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(6, $logstore = $$value));
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(7, $tabstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BaseTab", slots, []);

    	const option = {
    		...cfg,
    		readOnly: true,
    		contextmenu: false
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
    		const ext = $logstore.ext === "js" ? "javascript" : $logstore.ext;
    		const hdrs = JSON.parse($logstore.headers);
    		const csp3 = hdrs.CSP || {};

    		const val1 = {
    			...option,
    			language: "json",
    			value: $logstore.headers
    		};

    		const val2 = {
    			...option,
    			language: ext,
    			value: $logstore.response
    		};

    		const val3 = {
    			...option,
    			language: "json",
    			value: JSON.stringify(csp3, null, 2)
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

    	function isCSP() {
    		const h = $logstore.respHeader;
    		const csp = h["content-security-policy"] || h["content-security-policy-report-only"];
    		return csp;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$d.warn(`<BaseTab> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		cfg,
    		resize,
    		logstore,
    		tabstore,
    		onMount,
    		Tab,
    		option,
    		node1,
    		node2,
    		node3,
    		edit1,
    		edit2,
    		edit3,
    		isCSP,
    		$logstore,
    		$tabstore
    	});

    	$$self.$inject_state = $$props => {
    		if ("node1" in $$props) node1 = $$props.node1;
    		if ("node2" in $$props) node2 = $$props.node2;
    		if ("node3" in $$props) node3 = $$props.node3;
    		if ("edit1" in $$props) edit1 = $$props.edit1;
    		if ("edit2" in $$props) edit2 = $$props.edit2;
    		if ("edit3" in $$props) edit3 = $$props.edit3;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class BaseTab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BaseTab",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src/components/logs/Json.svelte generated by Svelte v3.29.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-json" size="is-small">
    function create_default_slot$4(ctx) {
    	let basetab;
    	let current;
    	basetab = new BaseTab({ $$inline: true });

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
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-json\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let button2;
    	let t;
    	let tabs;
    	let current;
    	button2 = new Button2({ $$inline: true });

    	tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-json",
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
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Json", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Json> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Tabs,
    		Tab,
    		tabstore,
    		Button2,
    		BaseTab,
    		$tabstore
    	});

    	return [$tabstore];
    }

    class Json extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Json",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src/components/logs/Html.svelte generated by Svelte v3.29.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-html" size="is-small">
    function create_default_slot$5(ctx) {
    	let basetab;
    	let current;
    	basetab = new BaseTab({ $$inline: true });

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
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-html\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let button2;
    	let t;
    	let tabs;
    	let current;
    	button2 = new Button2({ $$inline: true });

    	tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-html",
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
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Html", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Html> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Tabs,
    		Tab,
    		tabstore,
    		Button2,
    		BaseTab,
    		$tabstore
    	});

    	return [$tabstore];
    }

    class Html extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Html",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src/components/logs/Text.svelte generated by Svelte v3.29.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-text" size="is-small">
    function create_default_slot$6(ctx) {
    	let basetab;
    	let current;
    	basetab = new BaseTab({ $$inline: true });

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
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-text\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let button2;
    	let t;
    	let tabs;
    	let current;
    	button2 = new Button2({ $$inline: true });

    	tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-text",
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Text", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Tabs,
    		Tab,
    		tabstore,
    		Button2,
    		BaseTab,
    		$tabstore
    	});

    	return [$tabstore];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* src/components/logs/Css.svelte generated by Svelte v3.29.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-css" size="is-small">
    function create_default_slot$7(ctx) {
    	let basetab;
    	let current;
    	basetab = new BaseTab({ $$inline: true });

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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-css\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let button2;
    	let t;
    	let tabs;
    	let current;
    	button2 = new Button2({ $$inline: true });

    	tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-css",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$7] },
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Css", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Css> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Tabs,
    		Tab,
    		tabstore,
    		Button2,
    		BaseTab,
    		$tabstore
    	});

    	return [$tabstore];
    }

    class Css extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Css",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src/components/logs/Js.svelte generated by Svelte v3.29.7 */

    // (24:0) <Tabs value={$tabstore.tab} style="is-boxed tab-js" size="is-small">
    function create_default_slot$8(ctx) {
    	let basetab;
    	let current;
    	basetab = new BaseTab({ $$inline: true });

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
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(24:0) <Tabs value={$tabstore.tab} style=\\\"is-boxed tab-js\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let button2;
    	let t;
    	let tabs;
    	let current;
    	button2 = new Button2({ $$inline: true });

    	tabs = new Tabs({
    			props: {
    				value: /*$tabstore*/ ctx[0].tab,
    				style: "is-boxed tab-js",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$8] },
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
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let $tabstore;
    	validate_store(tabstore, "tabstore");
    	component_subscribe($$self, tabstore, $$value => $$invalidate(0, $tabstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Js", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Js> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Tabs,
    		Tab,
    		tabstore,
    		Button2,
    		BaseTab,
    		$tabstore
    	});

    	return [$tabstore];
    }

    class Js extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Js",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src/components/logs/Show.svelte generated by Svelte v3.29.7 */
    const file$l = "src/components/logs/Show.svelte";

    // (23:2) {:else}
    function create_else_block$1(ctx) {
    	let pre;
    	let t_value = /*$logstore*/ ctx[0].response + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(t_value);
    			attr_dev(pre, "class", "svelte-1bhfci6");
    			add_location(pre, file$l, 23, 4, 578);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(23:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:33) 
    function create_if_block_5(ctx) {
    	let js;
    	let current;
    	js = new Js({ $$inline: true });

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
    		source: "(21:33) ",
    		ctx
    	});

    	return block;
    }

    // (19:34) 
    function create_if_block_4(ctx) {
    	let css;
    	let current;
    	css = new Css({ $$inline: true });

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
    		source: "(19:34) ",
    		ctx
    	});

    	return block;
    }

    // (17:34) 
    function create_if_block_3(ctx) {
    	let text_1;
    	let current;
    	text_1 = new Text({ $$inline: true });

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
    		source: "(17:34) ",
    		ctx
    	});

    	return block;
    }

    // (15:35) 
    function create_if_block_2$1(ctx) {
    	let html;
    	let current;
    	html = new Html({ $$inline: true });

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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(15:35) ",
    		ctx
    	});

    	return block;
    }

    // (13:35) 
    function create_if_block_1$3(ctx) {
    	let json;
    	let current;
    	json = new Json({ $$inline: true });

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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(13:35) ",
    		ctx
    	});

    	return block;
    }

    // (11:2) {#if $logstore.title.match('.png')}
    function create_if_block$4(ctx) {
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(11:2) {#if $logstore.title.match('.png')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
    	let div;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	const if_block_creators = [
    		create_if_block$4,
    		create_if_block_1$3,
    		create_if_block_2$1,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_else_block$1
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*$logstore*/ 1) show_if = !!/*$logstore*/ ctx[0].title.match(".png");
    		if (show_if) return 0;
    		if (/*$logstore*/ ctx[0].ext === "json") return 1;
    		if (/*$logstore*/ ctx[0].ext === "html") return 2;
    		if (/*$logstore*/ ctx[0].ext === "txt") return 3;
    		if (/*$logstore*/ ctx[0].ext === "css") return 4;
    		if (/*$logstore*/ ctx[0].ext === "js") return 5;
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
    				} else {
    					if_block.p(ctx, dirty);
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
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let $logstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(0, $logstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Show", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Show> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		logstore,
    		Json,
    		Html,
    		Text,
    		Css,
    		Js,
    		$logstore
    	});

    	return [$logstore];
    }

    class Show extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Show",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* src/components/logs/Index.svelte generated by Svelte v3.29.7 */

    // (29:0) <VBox2 {title} {top} {left} {dragend} {box} {List} show={$logstore.logid}>
    function create_default_slot$9(ctx) {
    	let show;
    	let current;
    	show = new Show({ $$inline: true });

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
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(29:0) <VBox2 {title} {top} {left} {dragend} {box} {List} show={$logstore.logid}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let vbox2;
    	let current;

    	vbox2 = new VBox2({
    			props: {
    				title: Title,
    				top: top$2,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[3],
    				box: /*box*/ ctx[2],
    				List: List$2,
    				show: /*$logstore*/ ctx[1].logid,
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(vbox2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(vbox2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const vbox2_changes = {};
    			if (dirty & /*left*/ 1) vbox2_changes.left = /*left*/ ctx[0];
    			if (dirty & /*$logstore*/ 2) vbox2_changes.show = /*$logstore*/ ctx[1].logid;

    			if (dirty & /*$$scope*/ 16) {
    				vbox2_changes.$$scope = { dirty, ctx };
    			}

    			vbox2.$set(vbox2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(vbox2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(vbox2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(vbox2, detaching);
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

    const top$2 = "47";
    const id$2 = "logsLeft";

    function instance$w($$self, $$props, $$invalidate) {
    	let $logstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(1, $logstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let box = false;
    	let left = 163;

    	onMount(async () => {
    		chrome.storage.local.get(id$2, function (opt) {
    			opt[id$2] && $$invalidate(0, left = opt[id$2]);
    		});
    	});

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    		const data = {};
    		data[id$2] = left;
    		chrome.storage.local.set(data);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		logstore,
    		VBox2,
    		title: Title,
    		List: List$2,
    		Show,
    		box,
    		left,
    		top: top$2,
    		id: id$2,
    		dragend,
    		$logstore
    	});

    	$$self.$inject_state = $$props => {
    		if ("box" in $$props) $$invalidate(2, box = $$props.box);
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, $logstore, box, dragend];
    }

    class Index$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    const tags = writable({
      filterUrl: true,
      __tag1: {},
      __tag2: {},
      __tag3: {}
    });

    /* src/components/tags/Button.svelte generated by Svelte v3.29.7 */

    const { console: console_1$e } = globals;
    const file$m = "src/components/tags/Button.svelte";

    function create_fragment$x(ctx) {
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
    	let mounted;
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
    			add_location(input0, file$m, 48, 4, 1011);
    			attr_dev(label0, "class", "checker svelte-12umemg");
    			add_location(label0, file$m, 47, 2, 983);
    			attr_dev(button0, "class", "tlb btn-go svelte-12umemg");
    			button0.disabled = /*autoSave*/ ctx[0];
    			add_location(button0, file$m, 52, 2, 1098);
    			attr_dev(button1, "class", "tlb btn-go svelte-12umemg");
    			button1.disabled = /*autoSave*/ ctx[0];
    			add_location(button1, file$m, 53, 2, 1184);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$m, 55, 4, 1297);
    			attr_dev(label1, "class", "checker svelte-12umemg");
    			add_location(label1, file$m, 54, 2, 1269);
    			attr_dev(div, "class", "btn-container svelte-12umemg");
    			add_location(div, file$m, 46, 0, 953);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[2]),
    					listen_dev(button0, "click", btnReset, false, false, false),
    					listen_dev(button1, "click", btnSave, false, false, false),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
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
    			mounted = false;
    			run_all(dispose);
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

    function btnReset(e) {
    	window.mitm.files.route_events.routeTable();
    }

    function btnSave(e) {
    	const { __tag1, __tag2, __tag3 } = window.mitm;
    	const tags = { __tag1, __tag2, __tag3 };
    	ws__send("saveTags", tags);
    }

    function instance$x($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(1, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let autoSave = true;
    	let _tags = $tags;

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$e.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		$tags.filterUrl = this.checked;
    		tags.set($tags);
    	}

    	function input1_change_handler() {
    		autoSave = this.checked;
    		$$invalidate(0, autoSave);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		tags,
    		autoSave,
    		_tags,
    		btnReset,
    		btnSave,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("autoSave" in $$props) $$invalidate(0, autoSave = $$props.autoSave);
    		if ("_tags" in $$props) _tags = $$props._tags;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [autoSave, $tags, input0_change_handler, input1_change_handler];
    }

    class Button$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* src/components/tags/Tags1_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$5, console: console_1$f } = globals;
    const file$n = "src/components/tags/Tags1_.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[5] = list;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (109:4) {#each listTags($tags) as item}
    function create_each_block$6(ctx) {
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
    	let mounted;
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
    			add_location(input, file$n, 111, 8, 2598);
    			attr_dev(span, "class", "big svelte-784ajb");
    			add_location(span, file$n, 115, 8, 2725);
    			attr_dev(label, "class", "svelte-784ajb");
    			add_location(label, file$n, 110, 6, 2582);
    			attr_dev(div, "class", div_class_value = "space0 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-784ajb");
    			add_location(div, file$n, 109, 4, 2538);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*clicked*/ ctx[1], false, false, false),
    					listen_dev(input, "change", input_change_handler)
    				];

    				mounted = true;
    			}
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

    			if (dirty & /*$tags*/ 1 && div_class_value !== (div_class_value = "space0 " + /*routetag*/ ctx[2](/*item*/ ctx[4]) + " svelte-784ajb")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(109:4) {#each listTags($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$y(ctx) {
    	let td;
    	let div;
    	let each_value = listTags(/*$tags*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "border svelte-784ajb");
    			add_location(div, file$n, 107, 2, 2477);
    			add_location(td, file$n, 106, 0, 2470);
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
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
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
    		id: create_fragment$y.name,
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
    			}
    		}

    		add("_global_");
    		tgs = Object.keys(list).sort();
    	} else {
    		tgs = Object.keys(tags.__tag1);
    	}

    	return tgs;
    }

    function instance$y($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags1", slots, []);

    	function clicked(e) {
    		const { __tag1: { ...tagx } } = $tags;

    		setTimeout(
    			() => {
    				const { __tag1, __tag2, __tag3 } = $tags;
    				const { item } = e.target.dataset; // item = remove-ads~2
    				const flag = __tag1[item]; // flag = true ~> already changed
    				console.log("e", $tags);
    				const [group1, id1] = item.split("~");

    				if (id1) {
    					for (let ns in __tag1) {
    						const [group2, id2] = ns.split("~");

    						if (!tagx[item] && group1 === group2 && id1 !== id2) {
    							if (__tag1[group1] !== undefined) {
    								__tag1[group1] = flag;
    							}

    							__tag1[ns] = !flag;
    						} else if (__tag1[group1] !== undefined) {
    							__tag1[group1] = flag;
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

    	const writable_props = [];

    	Object_1$5.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$f.warn(`<Tags1> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		$tags.__tag1[item] = this.checked;
    		tags.set($tags);
    	}

    	$$self.$capture_state = () => ({ tags, clicked, routetag, listTags, $tags });
    	return [$tags, clicked, routetag, input_change_handler];
    }

    class Tags1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags1",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    /* src/components/tags/Tags2_1.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$6, console: console_1$g } = globals;
    const file$o = "src/components/tags/Tags2_1.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[7] = list;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (89:2) {#each itemlist(items) as item}
    function create_each_block$7(ctx) {
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
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[4].call(input, /*item*/ ctx[6]);
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
    			add_location(input, file$o, 91, 8, 2044);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*item*/ ctx[6].match(":") ? "big" : "") + " svelte-s6cnnu"));
    			add_location(span, file$o, 95, 8, 2165);
    			add_location(label, file$o, 90, 6, 2028);
    			attr_dev(div, "class", div_class_value = "space1 " + /*routetag*/ ctx[3](/*item*/ ctx[6]) + " svelte-s6cnnu");
    			add_location(div, file$o, 89, 4, 1984);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*clicked*/ ctx[2], false, false, false),
    					listen_dev(input, "change", input_change_handler)
    				];

    				mounted = true;
    			}
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(89:2) {#each itemlist(items) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$z(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = (/*ns*/ ctx[1] === "_global_" ? " * " : /*ns*/ ctx[1]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let each_value = itemlist(/*items*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
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
    			add_location(div0, file$o, 87, 2, 1887);
    			attr_dev(div1, "class", "border svelte-s6cnnu");
    			add_location(div1, file$o, 86, 0, 1864);
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
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
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
    		id: create_fragment$z.name,
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

    function instance$z($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(5, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags2_1", slots, []);
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

    	Object_1$6.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$g.warn(`<Tags2_1> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		items[item] = this.checked;
    		$$invalidate(0, items);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		items,
    		ns,
    		clicked,
    		routetag,
    		itemlist,
    		show,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, ns, clicked, routetag, input_change_handler];
    }

    class Tags2_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$z, create_fragment$z, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2_1",
    			options,
    			id: create_fragment$z.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console_1$g.warn("<Tags2_1> was created without expected prop 'items'");
    		}

    		if (/*ns*/ ctx[1] === undefined && !("ns" in props)) {
    			console_1$g.warn("<Tags2_1> was created without expected prop 'ns'");
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

    /* src/components/tags/Tags2_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$7 } = globals;
    const file$p = "src/components/tags/Tags2_.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (18:2) {#if oneSite(ns)}
    function create_if_block$5(ctx) {
    	let tags21;
    	let current;

    	tags21 = new Tags2_1({
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(18:2) {#if oneSite(ns)}",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#each Object.keys($tags.__tag2) as ns}
    function create_each_block$8(ctx) {
    	let show_if = /*oneSite*/ ctx[1](/*ns*/ ctx[2]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$5(ctx);

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

    					if (dirty & /*$tags*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
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
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(17:0) {#each Object.keys($tags.__tag2) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$A(ctx) {
    	let td;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[0].__tag2);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
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

    			add_location(td, file$p, 15, 0, 329);
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
    			if (dirty & /*$tags, Object, oneSite*/ 3) {
    				each_value = Object.keys(/*$tags*/ ctx[0].__tag2);
    				validate_each_argument(each_value);
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
    		id: create_fragment$A.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$A($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags2", slots, []);

    	function oneSite(ns) {
    		const { toRegex } = window.mitm.fn;

    		if ($tags.filterUrl) {
    			const rgx = toRegex(ns.replace(/~/, "[^.]*"));
    			return mitm.browser.activeUrl.match(rgx) || ns === "_global_";
    		} else {
    			return true;
    		}
    	}

    	const writable_props = [];

    	Object_1$7.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags2> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ tags, Tags21: Tags2_1, oneSite, $tags });
    	return [$tags, oneSite];
    }

    class Tags2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$A, create_fragment$A, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2",
    			options,
    			id: create_fragment$A.name
    		});
    	}
    }

    /* src/components/tags/Tags3_3.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$8, console: console_1$h } = globals;
    const file$q = "src/components/tags/Tags3_3.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (51:0) {#each xitems($tags) as item}
    function create_each_block$9(ctx) {
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
    	let mounted;
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
    			add_location(input, file$q, 53, 6, 1175);
    			add_location(span, file$q, 57, 6, 1288);
    			add_location(label, file$q, 52, 4, 1161);
    			attr_dev(div, "class", div_class_value = "space3 " + /*routetag*/ ctx[4](/*item*/ ctx[1]) + " svelte-olxey7");
    			add_location(div, file$q, 51, 2, 1119);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*clicked*/ ctx[3], false, false, false),
    					listen_dev(input, "change", input_change_handler)
    				];

    				mounted = true;
    			}
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(51:0) {#each xitems($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$B(ctx) {
    	let each_1_anchor;
    	let each_value = /*xitems*/ ctx[5](/*$tags*/ ctx[2]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
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
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
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
    		id: create_fragment$B.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$B($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3_3", slots, []);
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

    	Object_1$8.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$h.warn(`<Tags3_3> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		items[item] = this.checked;
    		$$invalidate(0, items);
    		$$invalidate(5, xitems);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("path" in $$props) $$invalidate(6, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(7, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		items,
    		item,
    		path,
    		ns,
    		clicked,
    		routetag,
    		xitems,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("path" in $$props) $$invalidate(6, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(7, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, item, $tags, clicked, routetag, xitems, path, ns, input_change_handler];
    }

    class Tags3_3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$B, create_fragment$B, safe_not_equal, { items: 0, item: 1, path: 6, ns: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_3",
    			options,
    			id: create_fragment$B.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console_1$h.warn("<Tags3_3> was created without expected prop 'items'");
    		}

    		if (/*item*/ ctx[1] === undefined && !("item" in props)) {
    			console_1$h.warn("<Tags3_3> was created without expected prop 'item'");
    		}

    		if (/*path*/ ctx[6] === undefined && !("path" in props)) {
    			console_1$h.warn("<Tags3_3> was created without expected prop 'path'");
    		}

    		if (/*ns*/ ctx[7] === undefined && !("ns" in props)) {
    			console_1$h.warn("<Tags3_3> was created without expected prop 'ns'");
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

    /* src/components/tags/Tags3_2.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$9 } = globals;
    const file$r = "src/components/tags/Tags3_2.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (17:0) {#each xitems($tags).filter(x=>x[0]!==':') as item}
    function create_each_block$a(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let t2_value = /*items*/ ctx[0][`:${/*item*/ ctx[5]}`] + "";
    	let t2;
    	let t3;
    	let tags33;
    	let current;

    	tags33 = new Tags3_3({
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
    			add_location(div, file$r, 17, 2, 344);
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
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(17:0) {#each xitems($tags).filter(x=>x[0]!==':') as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$C(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*xitems*/ ctx[4](/*$tags*/ ctx[3]).filter(func);
    	validate_each_argument(each_value);
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
    				validate_each_argument(each_value);
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
    		id: create_fragment$C.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = x => x[0] !== ":";

    function instance$C($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(3, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3_2", slots, []);
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

    	Object_1$9.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("path" in $$props) $$invalidate(1, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(2, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		Tags33: Tags3_3,
    		items,
    		path,
    		ns,
    		xitems,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("path" in $$props) $$invalidate(1, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(2, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, path, ns, $tags, xitems];
    }

    class Tags3_2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$C, create_fragment$C, safe_not_equal, { items: 0, path: 1, ns: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_2",
    			options,
    			id: create_fragment$C.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

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

    /* src/components/tags/Tags3_1.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$a } = globals;
    const file$s = "src/components/tags/Tags3_1.svelte";

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (17:2) {#each xitems($tags) as path}
    function create_each_block$b(ctx) {
    	let div;
    	let t0_value = /*path*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let tags32;
    	let current;

    	tags32 = new Tags3_2({
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
    			add_location(div, file$s, 17, 4, 364);
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
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(17:2) {#each xitems($tags) as path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$D(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = (/*ns*/ ctx[1] === "_global_" ? " * " : /*ns*/ ctx[1]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let current;
    	let each_value = /*xitems*/ ctx[3](/*$tags*/ ctx[2]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
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
    			add_location(div0, file$s, 15, 2, 269);
    			attr_dev(div1, "class", "border svelte-dueni6");
    			add_location(div1, file$s, 14, 0, 246);
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
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$b(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$b(child_ctx);
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
    		id: create_fragment$D.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$D($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3_1", slots, []);
    	let { items } = $$props;
    	let { ns } = $$props;

    	function xitems(tags) {
    		const { __tag3 } = tags;
    		const namespace = __tag3[ns];
    		return Object.keys(namespace);
    	}

    	const writable_props = ["items", "ns"];

    	Object_1$a.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({ tags, Tags32: Tags3_2, items, ns, xitems, $tags });

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, ns, $tags, xitems];
    }

    class Tags3_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$D, create_fragment$D, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_1",
    			options,
    			id: create_fragment$D.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

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

    /* src/components/tags/Tags3_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$b } = globals;
    const file$t = "src/components/tags/Tags3_.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (20:2) {#if istag(ns)}
    function create_if_block$6(ctx) {
    	let tags31;
    	let current;

    	tags31 = new Tags3_1({
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(20:2) {#if istag(ns)}",
    		ctx
    	});

    	return block;
    }

    // (19:0) {#each Object.keys($tags.__tag3) as ns}
    function create_each_block$c(ctx) {
    	let show_if = /*istag*/ ctx[1](/*ns*/ ctx[2]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$6(ctx);

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

    					if (dirty & /*$tags*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
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
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(19:0) {#each Object.keys($tags.__tag3) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$E(ctx) {
    	let td;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[0].__tag3);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
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

    			add_location(td, file$t, 17, 0, 426);
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
    			if (dirty & /*$tags, Object, istag*/ 3) {
    				each_value = Object.keys(/*$tags*/ ctx[0].__tag3);
    				validate_each_argument(each_value);
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
    		id: create_fragment$E.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$E($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3", slots, []);

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

    	const writable_props = [];

    	Object_1$b.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ tags, Tags31: Tags3_1, istag, $tags });
    	return [$tags, istag];
    }

    class Tags3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$E, create_fragment$E, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3",
    			options,
    			id: create_fragment$E.name
    		});
    	}
    }

    /* src/components/tags/Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$i } = globals;
    const file$u = "src/components/tags/Index.svelte";

    // (43:4) <BHeader>
    function create_default_slot_2$2(ctx) {
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
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(43:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (44:4) <BTable>
    function create_default_slot_1$2(ctx) {
    	let tr;
    	let tags1;
    	let t0;
    	let tags2;
    	let t1;
    	let tags3;
    	let current;
    	tags1 = new Tags1({ $$inline: true });
    	tags2 = new Tags2({ $$inline: true });
    	tags3 = new Tags3({ $$inline: true });

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			create_component(tags1.$$.fragment);
    			t0 = space();
    			create_component(tags2.$$.fragment);
    			t1 = space();
    			create_component(tags3.$$.fragment);
    			attr_dev(tr, "class", "set-tags");
    			add_location(tr, file$u, 44, 6, 1001);
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
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(44:4) <BTable>",
    		ctx
    	});

    	return block;
    }

    // (42:2) <BStatic height="0">
    function create_default_slot$a(ctx) {
    	let bheader;
    	let t;
    	let btable;
    	let current;

    	bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
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
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(42:2) <BStatic height=\\\"0\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$F(ctx) {
    	let button;
    	let t;
    	let div;
    	let bstatic;
    	let current;
    	button = new Button$3({ $$inline: true });

    	bstatic = new BStatic({
    			props: {
    				height: "0",
    				$$slots: { default: [create_default_slot$a] },
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
    			add_location(div, file$u, 40, 0, 910);
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
    		id: create_fragment$F.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$F($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);

    	onMount(async () => {
    		
    	});

    	window.mitm.files.getRoute_events.tagsTable = () => {
    		// window.ws__send('getRoute', '', routeHandler);
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$i.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		tags,
    		BStatic,
    		BHeader,
    		BTable,
    		Button: Button$3,
    		Tags1,
    		Tags2,
    		Tags3,
    		$tags
    	});

    	return [];
    }

    class Index$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$F, create_fragment$F, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$F.name
    		});
    	}
    }

    /* src/components/other/OpenHome.svelte generated by Svelte v3.29.7 */

    const { console: console_1$j } = globals;
    const file$v = "src/components/other/OpenHome.svelte";

    function create_fragment$G(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open Home";
    			add_location(button, file$v, 8, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", btnOpen, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$G.name,
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

    function instance$G($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OpenHome", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$j.warn(`<OpenHome> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnOpen });
    	return [];
    }

    class OpenHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$G, create_fragment$G, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpenHome",
    			options,
    			id: create_fragment$G.name
    		});
    	}
    }

    /* src/components/other/CodeHome.svelte generated by Svelte v3.29.7 */

    const { console: console_1$k } = globals;
    const file$w = "src/components/other/CodeHome.svelte";

    function create_fragment$H(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Code Home";
    			add_location(button, file$w, 8, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", btnCode, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$H.name,
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

    function instance$H($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CodeHome", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$k.warn(`<CodeHome> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnCode });
    	return [];
    }

    class CodeHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$H, create_fragment$H, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeHome",
    			options,
    			id: create_fragment$H.name
    		});
    	}
    }

    /* src/components/other/Postmessage.svelte generated by Svelte v3.29.7 */

    const { console: console_1$l } = globals;
    const file$x = "src/components/other/Postmessage.svelte";

    function create_fragment$I(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\n  Post Messages");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag();
    			add_location(input, file$x, 15, 2, 346);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$x, 14, 0, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", btnPostmessage, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$I.name,
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

    function instance$I($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Postmessage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$l.warn(`<Postmessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnPostmessage, flag });
    	return [];
    }

    class Postmessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$I, create_fragment$I, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Postmessage",
    			options,
    			id: create_fragment$I.name
    		});
    	}
    }

    /* src/components/other/Csp.svelte generated by Svelte v3.29.7 */

    const { console: console_1$m } = globals;
    const file$y = "src/components/other/Csp.svelte";

    function create_fragment$J(ctx) {
    	let label;
    	let input;
    	let input_checked_value;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\n  Content Sec. Policy");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag$1();
    			add_location(input, file$y, 15, 2, 290);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$y, 14, 0, 263);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", btnCsp, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$J.name,
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

    function instance$J($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Csp", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$m.warn(`<Csp> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnCsp, flag: flag$1 });
    	return [];
    }

    class Csp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$J, create_fragment$J, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Csp",
    			options,
    			id: create_fragment$J.name
    		});
    	}
    }

    /* src/components/other/Index.svelte generated by Svelte v3.29.7 */
    const file$z = "src/components/other/Index.svelte";

    function create_fragment$K(ctx) {
    	let ul;
    	let li0;
    	let openhome;
    	let t0;
    	let li1;
    	let codehome;
    	let t1;
    	let li2;
    	let postmessage;
    	let t2;
    	let li3;
    	let csp;
    	let current;
    	openhome = new OpenHome({ $$inline: true });
    	codehome = new CodeHome({ $$inline: true });
    	postmessage = new Postmessage({ $$inline: true });
    	csp = new Csp({ $$inline: true });

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
    			add_location(li0, file$z, 8, 0, 189);
    			attr_dev(li1, "class", "svelte-eb1kd7");
    			add_location(li1, file$z, 9, 0, 210);
    			attr_dev(li2, "class", "svelte-eb1kd7");
    			add_location(li2, file$z, 10, 0, 231);
    			attr_dev(li3, "class", "svelte-eb1kd7");
    			add_location(li3, file$z, 11, 0, 255);
    			attr_dev(ul, "class", "svelte-eb1kd7");
    			add_location(ul, file$z, 7, 0, 184);
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
    		id: create_fragment$K.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$K($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ OpenHome, CodeHome, Postmessage, Csp });
    	return [];
    }

    class Index$4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$K, create_fragment$K, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$K.name
    		});
    	}
    }

    // feat: markdown

    const source$2 = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: 'Hi!',
      fpath: '',
      path: ''
    });

    /* src/components/help/Button.svelte generated by Svelte v3.29.7 */
    const file$A = "src/components/help/Button.svelte";

    function create_fragment$L(ctx) {
    	let div;
    	let span;
    	let t0_value = parseInt(/*value*/ ctx[0]) + "";
    	let t0;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			attr_dev(span, "class", "svelte-fmpgpb");
    			add_location(span, file$A, 12, 2, 265);
    			attr_dev(input, "name", "weight");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "10");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "step", "1");
    			input.value = /*value*/ ctx[0];
    			add_location(input, file$A, 13, 2, 298);
    			attr_dev(div, "class", "btn-container svelte-fmpgpb");
    			add_location(div, file$A, 11, 0, 235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*plotValue*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && t0_value !== (t0_value = parseInt(/*value*/ ctx[0]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*value*/ 1) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$L.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$L($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let value = 61;

    	function plotValue(e) {
    		$$invalidate(0, value = +e.target.value);
    		const node = document.querySelector("#scale-mermaid");
    		node.innerHTML = `.mermaid {height: ${value}vh;}`;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ source: source$2, value, plotValue });

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, plotValue];
    }

    class Button$4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$L, create_fragment$L, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$L.name
    		});
    	}
    }

    /* src/components/help/View.svelte generated by Svelte v3.29.7 */

    const { console: console_1$n } = globals;
    const file$B = "src/components/help/View.svelte";

    function create_fragment$M(ctx) {
    	let div1;
    	let div0;
    	let raw_value = /*content*/ ctx[1](/*$source*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "markdown");
    			add_location(div0, file$B, 77, 2, 2254);
    			attr_dev(div1, "class", "show-container svelte-1nvl3j1");
    			add_location(div1, file$B, 76, 0, 2223);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			div0.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$source*/ 1 && raw_value !== (raw_value = /*content*/ ctx[1](/*$source*/ ctx[0]) + "")) div0.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$M.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const r = /(%.{2}|[~.])/g;

    function instance$M($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$2, "source");
    	component_subscribe($$self, source$2, $$value => $$invalidate(0, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("View", slots, []);

    	onMount(() => {
    		document.querySelector("#markdown").onclick = function (e) {
    			const { hash } = e.target;
    			console.log("clicked", hash);

    			if (hash) {
    				e.preventDefault();
    				e.stopPropagation();

    				// location.hash = hash;
    				const behavior = "auto";

    				const element = document.querySelector(hash);
    				const top = element.getBoundingClientRect().top - 40;
    				const _window = document.querySelector(".show-container");
    				_window.scroll({ top, behavior });
    			} else {
    				let node = e.target;

    				while (node.id !== "markdown") {
    					if (node.nodeName === "A") {
    						console.log("anchor");

    						if (node.href.match(/https?:\//)) {
    							e.preventDefault();
    							e.stopPropagation();
    							chrome.tabs.create({ url: node.href });
    						}

    						break;
    					}

    					node = node.parentElement;
    				}
    			}
    		};
    	});

    	let mermaid;

    	function content(src) {
    		!mermaid && (mermaid = window.mermaid);
    		console.log("plot the content...");

    		setTimeout(
    			() => {
    				if (document.querySelector("#markdown .mermaid")) {
    					mermaid.init();
    					const arr = document.querySelectorAll("div.details");

    					for (let node of arr) {
    						const title = node.getAttribute("title");
    						const details = document.createElement("details");
    						details.innerHTML = `<summary>${title}</summary>`;
    						const childs = [];

    						for (let child of node.children) {
    							childs.push(child);
    						}

    						for (let child of childs) {
    							details.appendChild(child);
    						}

    						node.appendChild(details);
    					}
    				}

    				if (!document.querySelector("#markdown a.up")) {
    					let _top;
    					const h1 = document.querySelector("h1");
    					const arr = document.querySelectorAll("h1,h2,h3,h4,h5");
    					h1 && (_top = ` <a class="up" href="#${h1.id}">{up}</a>`);

    					for (let [i, node] of arr.entries()) {
    						if (_top && i > 0) {
    							node.innerHTML = `${node.innerHTML}${_top}`;
    						}

    						node.id = node.id.replace(r, "");
    						console.log(node);
    					}
    				}
    			},
    			1
    		);

    		return src.content;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$n.warn(`<View> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		source: source$2,
    		mermaid,
    		r,
    		content,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("mermaid" in $$props) mermaid = $$props.mermaid;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$source, content];
    }

    class View extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$M, create_fragment$M, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "View",
    			options,
    			id: create_fragment$M.name
    		});
    	}
    }

    /* src/components/help/Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$o } = globals;
    const file$C = "src/components/help/Item.svelte";

    function create_fragment$N(ctx) {
    	let div;
    	let t_value = title$2(/*item*/ ctx[0]) + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-enxu2w");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$C, 28, 0, 567);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*clickHandler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = title$2(/*item*/ ctx[0]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-enxu2w")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_item_value !== (div_data_item_value = /*item*/ ctx[0].element)) {
    				attr_dev(div, "data-item", div_data_item_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$N.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$2(t) {
    	console.log(t.title);
    	const string = t.title.replace(/\.md$/, "");
    	const pre = string.match(/^([^a-zA-Z]+.|.)/)[0];
    	const post = string.replace(pre, "").toLowerCase();
    	return pre.toUpperCase() + post;
    }

    function instance$N($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$2, "source");
    	component_subscribe($$self, source$2, $$value => $$invalidate(1, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;

    	function clickHandler(e) {
    		console.log(item);
    		const { fpath } = item;

    		ws__send("getMContent", { fpath }, ({ content }) => {
    			source$2.update(n => {
    				return { ...n, content, fpath: item.fpath };
    			});
    		});
    	}

    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$o.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		source: source$2,
    		item,
    		clickHandler,
    		title: title$2,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $source, clickHandler];
    }

    class Item$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$N, create_fragment$N, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$N.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$o.warn("<Item> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/help/List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$c, console: console_1$p } = globals;
    const file$D = "src/components/help/List.svelte";

    function get_each_context$d(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (55:2) {:else}
    function create_else_block$2(ctx) {
    	let details;
    	let summary;
    	let raw_value = /*key*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let current;
    	let each_value_2 = Object.keys(/*_data*/ ctx[1][/*key*/ ctx[5]]);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			add_location(summary, file$D, 55, 13, 1405);
    			add_location(details, file$D, 55, 4, 1396);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			summary.innerHTML = raw_value;
    			append_dev(details, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(details, null);
    			}

    			append_dev(details, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*_data*/ 2) && raw_value !== (raw_value = /*key*/ ctx[5] + "")) summary.innerHTML = raw_value;
    			if (dirty & /*Object, _data, onChange*/ 3) {
    				each_value_2 = Object.keys(/*_data*/ ctx[1][/*key*/ ctx[5]]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(details, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
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
    			if (detaching) detach_dev(details);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(55:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (49:2) {#if key==='_readme_'}
    function create_if_block$7(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = Object.keys(/*_data*/ ctx[1][/*key*/ ctx[5]]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "readme");
    			add_location(div, file$D, 49, 4, 1215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, _data, onChange*/ 3) {
    				each_value_1 = Object.keys(/*_data*/ ctx[1][/*key*/ ctx[5]]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(49:2) {#if key==='_readme_'}",
    		ctx
    	});

    	return block;
    }

    // (57:6) {#each Object.keys(_data[key]) as item}
    function create_each_block_2(ctx) {
    	let item;
    	let current;

    	item = new Item$3({
    			props: {
    				item: {
    					element: /*item*/ ctx[8],
    					.../*_data*/ ctx[1][/*key*/ ctx[5]][/*item*/ ctx[8]]
    				},
    				onChange: /*onChange*/ ctx[0]
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
    				element: /*item*/ ctx[8],
    				.../*_data*/ ctx[1][/*key*/ ctx[5]][/*item*/ ctx[8]]
    			};

    			if (dirty & /*onChange*/ 1) item_changes.onChange = /*onChange*/ ctx[0];
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(57:6) {#each Object.keys(_data[key]) as item}",
    		ctx
    	});

    	return block;
    }

    // (51:6) {#each Object.keys(_data[key]) as item}
    function create_each_block_1$1(ctx) {
    	let item;
    	let current;

    	item = new Item$3({
    			props: {
    				item: {
    					element: /*item*/ ctx[8],
    					.../*_data*/ ctx[1][/*key*/ ctx[5]][/*item*/ ctx[8]]
    				},
    				onChange: /*onChange*/ ctx[0]
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
    				element: /*item*/ ctx[8],
    				.../*_data*/ ctx[1][/*key*/ ctx[5]][/*item*/ ctx[8]]
    			};

    			if (dirty & /*onChange*/ 1) item_changes.onChange = /*onChange*/ ctx[0];
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
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(51:6) {#each Object.keys(_data[key]) as item}",
    		ctx
    	});

    	return block;
    }

    // (48:0) {#each Object.keys(_data) as key, i}
    function create_each_block$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$7, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*key*/ ctx[5] === "_readme_") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$d.name,
    		type: "each",
    		source: "(48:0) {#each Object.keys(_data) as key, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$O(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$d(get_each_context$d(ctx, each_value, i));
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
    			if (dirty & /*Object, _data, onChange*/ 3) {
    				each_value = Object.keys(/*_data*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$d(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$d(child_ctx);
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
    		id: create_fragment$O.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$O($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { onChange } = $$props;
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount markdown");
    		_ws_connect.markdownOnMount = () => ws__send("getMarkdown", "", markdownHandler);
    	});

    	const markdownHandler = obj => {
    		console.warn("ws__send(getMarkdown)", obj);

    		if (window.mitm.files.markdown === undefined) {
    			window.mitm.files.markdown = obj;
    			$$invalidate(3, data = obj);
    		} else {
    			const { markdown } = window.mitm.files;
    			const newmarkdown = {};

    			for (let k in obj) {
    				newmarkdown[k] = obj[k];
    			}

    			$$invalidate(3, data = newmarkdown);
    			window.mitm.files.markdown = newmarkdown;
    		}

    		/**
     * event handler after receiving ws packet
     * ie: window.mitm.files.getProfile_events = {eventObject...}
     */
    		const { getProfile_events } = window.mitm.files;

    		for (let key in getProfile_events) {
    			getProfile_events[key](data);
    		}

    		rerender = rerender + 1;
    	};

    	window.mitm.files.markdown_events.markdownTable = () => {
    		console.log("markdownTable getting called!!!");
    		window.ws__send("getMarkdown", "", markdownHandler);
    	};

    	const writable_props = ["onChange"];

    	Object_1$c.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$p.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		onChange,
    		onMount,
    		Item: Item$3,
    		rerender,
    		data,
    		markdownHandler,
    		_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    	};

    	let _data;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 8) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [onChange, _data];
    }

    class List$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$O, create_fragment$O, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$O.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$p.warn("<List> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/help/Index.svelte generated by Svelte v3.29.7 */

    // (29:0) <VBox2 {title} {left} {dragend} {box} {List}>
    function create_default_slot$b(ctx) {
    	let view;
    	let current;
    	view = new View({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(view.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(view, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(view.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(view.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(view, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(29:0) <VBox2 {title} {left} {dragend} {box} {List}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$P(ctx) {
    	let button;
    	let t;
    	let vbox2;
    	let current;
    	button = new Button$4({ $$inline: true });

    	vbox2 = new VBox2({
    			props: {
    				title: title$3,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[2],
    				box: /*box*/ ctx[1],
    				List: List$3,
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t = space();
    			create_component(vbox2.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(vbox2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const vbox2_changes = {};
    			if (dirty & /*left*/ 1) vbox2_changes.left = /*left*/ ctx[0];

    			if (dirty & /*$$scope*/ 8) {
    				vbox2_changes.$$scope = { dirty, ctx };
    			}

    			vbox2.$set(vbox2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(vbox2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(vbox2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(vbox2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$P.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const title$3 = "-Help-";
    const id$3 = "helpLeft";

    function instance$P($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let box = false;
    	let left = 150;

    	onMount(async () => {
    		chrome.storage.local.get(id$3, function (opt) {
    			opt[id$3] && $$invalidate(0, left = opt[id$3]);
    		});
    	});

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    		const data = {};
    		data[id$3] = left;
    		chrome.storage.local.set(data);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Button: Button$4,
    		VBox2,
    		View,
    		List: List$3,
    		box,
    		left,
    		title: title$3,
    		id: id$3,
    		dragend
    	});

    	$$self.$inject_state = $$props => {
    		if ("box" in $$props) $$invalidate(1, box = $$props.box);
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, box, dragend];
    }

    class Index$5 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$P, create_fragment$P, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$P.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.7 */
    const file$E = "src/App.svelte";

    // (26:2) <Tab label="Route">
    function create_default_slot_6(ctx) {
    	let route;
    	let current;
    	route = new Index({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(26:2) <Tab label=\\\"Route\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:2) <Tab label="Profile">
    function create_default_slot_5(ctx) {
    	let profile;
    	let current;
    	profile = new Index$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(profile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(profile, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(profile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(profile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(profile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(27:2) <Tab label=\\\"Profile\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:2) <Tab label="Logs">
    function create_default_slot_4$1(ctx) {
    	let logstab;
    	let current;
    	logstab = new Index$2({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(logstab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(logstab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logstab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logstab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logstab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(28:2) <Tab label=\\\"Logs\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:2) <Tab label="Tags">
    function create_default_slot_3$1(ctx) {
    	let tagstab;
    	let current;
    	tagstab = new Index$3({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tagstab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tagstab, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tagstab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tagstab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tagstab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(29:2) <Tab label=\\\"Tags\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:2) <Tab label="Other">
    function create_default_slot_2$3(ctx) {
    	let other;
    	let current;
    	other = new Index$4({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(other.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(other, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(other.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(other.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(other, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(30:2) <Tab label=\\\"Other\\\">",
    		ctx
    	});

    	return block;
    }

    // (31:2) <Tab label="Help">
    function create_default_slot_1$3(ctx) {
    	let help;
    	let current;
    	help = new Index$5({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(help.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(help, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(help.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(help.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(help, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(31:2) <Tab label=\\\"Help\\\">",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Tabs style="is-boxed" size="is-small">
    function create_default_slot$c(ctx) {
    	let tab0;
    	let t0;
    	let tab1;
    	let t1;
    	let tab2;
    	let t2;
    	let tab3;
    	let t3;
    	let tab4;
    	let t4;
    	let tab5;
    	let current;

    	tab0 = new Tab({
    			props: {
    				label: "Route",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				label: "Profile",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: {
    				label: "Logs",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab3 = new Tab({
    			props: {
    				label: "Tags",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab4 = new Tab({
    			props: {
    				label: "Other",
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab5 = new Tab({
    			props: {
    				label: "Help",
    				$$slots: { default: [create_default_slot_1$3] },
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
    			t4 = space();
    			create_component(tab5.$$.fragment);
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
    			insert_dev(target, t4, anchor);
    			mount_component(tab5, target, anchor);
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
    			const tab5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tab5_changes.$$scope = { dirty, ctx };
    			}

    			tab5.$set(tab5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			transition_in(tab3.$$.fragment, local);
    			transition_in(tab4.$$.fragment, local);
    			transition_in(tab5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			transition_out(tab3.$$.fragment, local);
    			transition_out(tab4.$$.fragment, local);
    			transition_out(tab5.$$.fragment, local);
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
    			if (detaching) detach_dev(t4);
    			destroy_component(tab5, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(25:0) <Tabs style=\\\"is-boxed\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$Q(ctx) {
    	let main;
    	let tabs;
    	let current;

    	tabs = new Tabs({
    			props: {
    				style: "is-boxed",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$c] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			attr_dev(main, "class", "main");
    			add_location(main, file$E, 23, 0, 730);
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
    		id: create_fragment$Q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$Q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Tabs,
    		Tab,
    		Route: Index,
    		Profile: Index$1,
    		LogsTab: Index$2,
    		TagsTab: Index$3,
    		Other: Index$4,
    		Help: Index$5
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$Q, create_fragment$Q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$Q.name
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvbW90aW9uL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWJzLnN2ZWx0ZSIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L0JTdGF0aWMuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L1NwbGl0dGVyLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9CUmVzaXplLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9WQm94Mi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbW9uYWNvL2luaXQuanMiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9FZGl0b3Iuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9MaXN0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3JvdXRlL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9FZGl0b3Iuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvTGlzdC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9wcm9maWxlL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3Mvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvb3RoZXIvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvTGlzdC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL3RhYi5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvQnV0dG9uMi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0Jhc2VUYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Kc29uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvSHRtbC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1RleHQuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Dc3Muc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Kcy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1Nob3cuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9JbmRleC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczFfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczJfMS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MyXy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MzXzMuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzM18yLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfMS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MzXy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL09wZW5Ib21lLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL0NvZGVIb21lLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL1Bvc3RtZXNzYWdlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL0NzcC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvVmlldy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwL0l0ZW0uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9MaXN0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvSW5kZXguc3ZlbHRlIiwiLi4vc3JjL0FwcC5zdmVsdGUiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAoJCRzY29wZS5kaXJ0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxldHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdChzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4sIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBjb25zdCBzbG90X2NoYW5nZXMgPSBnZXRfc2xvdF9jaGFuZ2VzKHNsb3RfZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4pO1xuICAgIGlmIChzbG90X2NoYW5nZXMpIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jb250ZXh0ID0gZ2V0X3Nsb3RfY29udGV4dChzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG4gICAgICAgIHNsb3QucChzbG90X2NvbnRleHQsIHNsb3RfY2hhbmdlcyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Jlc3RfcHJvcHMocHJvcHMsIGtleXMpIHtcbiAgICBjb25zdCByZXN0ID0ge307XG4gICAga2V5cyA9IG5ldyBTZXQoa2V5cyk7XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoIWtleXMuaGFzKGspICYmIGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3Rba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfc2xvdHMoc2xvdHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzbG90cykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlID0gcmV0KSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG5vZGUuX19wcm90b19fKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdfX3ZhbHVlJykge1xuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNjcmlwdG9yc1trZXldICYmIGRlc2NyaXB0b3JzW2tleV0uc2V0KSB7XG4gICAgICAgICAgICBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdmdfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YShub2RlLCBwcm9wLCB2YWx1ZSkge1xuICAgIGlmIChwcm9wIGluIG5vZGUpIHtcbiAgICAgICAgbm9kZVtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYXR0cihub2RlLCBwcm9wLCB2YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXAsIF9fdmFsdWUsIGNoZWNrZWQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUuYWRkKGdyb3VwW2ldLl9fdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrZWQpIHtcbiAgICAgICAgdmFsdWUuZGVsZXRlKF9fdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh2YWx1ZSk7XG59XG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gbnVsbCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgIGxldCBqID0gMDtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2orK107XG4gICAgICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmUubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShyZW1vdmVba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3ZnID8gc3ZnX2VsZW1lbnQobmFtZSkgOiBlbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gY2xhaW1fdGV4dChub2RlcywgZGF0YSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gJycgKyBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dChkYXRhKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3NwYWNlKG5vZGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX3RleHQobm9kZXMsICcgJyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbi8vIHVuZm9ydHVuYXRlbHkgdGhpcyBjYW4ndCBiZSBhIGNvbnN0YW50IGFzIHRoYXQgd291bGRuJ3QgYmUgdHJlZS1zaGFrZWFibGVcbi8vIHNvIHdlIGNhY2hlIHRoZSByZXN1bHQgaW5zdGVhZFxubGV0IGNyb3Nzb3JpZ2luO1xuZnVuY3Rpb24gaXNfY3Jvc3NvcmlnaW4oKSB7XG4gICAgaWYgKGNyb3Nzb3JpZ2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY3Jvc3NvcmlnaW4gPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm9pZCB3aW5kb3cucGFyZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY3Jvc3NvcmlnaW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjcm9zc29yaWdpbjtcbn1cbmZ1bmN0aW9uIGFkZF9yZXNpemVfbGlzdGVuZXIobm9kZSwgZm4pIHtcbiAgICBjb25zdCBjb21wdXRlZF9zdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgY29uc3Qgel9pbmRleCA9IChwYXJzZUludChjb21wdXRlZF9zdHlsZS56SW5kZXgpIHx8IDApIC0gMTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICBgb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogJHt6X2luZGV4fTtgKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBpc19jcm9zc29yaWdpbigpO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9IFwiZGF0YTp0ZXh0L2h0bWwsPHNjcmlwdD5vbnJlc2l6ZT1mdW5jdGlvbigpe3BhcmVudC5wb3N0TWVzc2FnZSgwLCcqJyl9PC9zY3JpcHQ+XCI7XG4gICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKHdpbmRvdywgJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGlmcmFtZS5jb250ZW50V2luZG93KVxuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGlmcmFtZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3RlbihpZnJhbWUuY29udGVudFdpbmRvdywgJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXBwZW5kKG5vZGUsIGlmcmFtZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVuc3Vic2NyaWJlICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRldGFjaChpZnJhbWUpO1xuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuYSA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICB9XG4gICAgbShodG1sLCB0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmUpIHtcbiAgICAgICAgICAgIHRoaXMuZSA9IGVsZW1lbnQodGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICAgICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmkoYW5jaG9yKTtcbiAgICB9XG4gICAgaChodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwKGh0bWwpIHtcbiAgICAgICAgdGhpcy5kKCk7XG4gICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgdGhpcy5pKHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gYXR0cmlidXRlX3RvX29iamVjdChhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgICByZXN1bHRbYXR0cmlidXRlLm5hbWVdID0gYXR0cmlidXRlLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cyhlbGVtZW50KSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgcmVzdWx0W25vZGUuc2xvdCB8fCAnZGVmYXVsdCddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBhY3RpdmVfZG9jcyA9IG5ldyBTZXQoKTtcbmxldCBhY3RpdmUgPSAwO1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGFjdGl2ZV9kb2NzLmFkZChkb2MpO1xuICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBkb2MuX19zdmVsdGVfc3R5bGVzaGVldCB8fCAoZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQgPSBkb2MuaGVhZC5hcHBlbmRDaGlsZChlbGVtZW50KCdzdHlsZScpKS5zaGVldCk7XG4gICAgY29uc3QgY3VycmVudF9ydWxlcyA9IGRvYy5fX3N2ZWx0ZV9ydWxlcyB8fCAoZG9jLl9fc3ZlbHRlX3J1bGVzID0ge30pO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogJyd9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgY29uc3QgcHJldmlvdXMgPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpLnNwbGl0KCcsICcpO1xuICAgIGNvbnN0IG5leHQgPSBwcmV2aW91cy5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBwcmV2aW91cy5sZW5ndGggLSBuZXh0Lmxlbmd0aDtcbiAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5leHQuam9pbignLCAnKTtcbiAgICAgICAgYWN0aXZlIC09IGRlbGV0ZWQ7XG4gICAgICAgIGlmICghYWN0aXZlKVxuICAgICAgICAgICAgY2xlYXJfcnVsZXMoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBhY3RpdmVfZG9jcy5mb3JFYWNoKGRvYyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQ7XG4gICAgICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgICAgICBkb2MuX19zdmVsdGVfcnVsZXMgPSB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFjdGl2ZV9kb2NzLmNsZWFyKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5sZXQgZmx1c2hpbmcgPSBmYWxzZTtcbmNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgaWYgKGZsdXNoaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgc2Vlbl9jYWxsYmFja3MuY2xlYXIoKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSBwcm9ncmFtLmIgLSB0O1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ja3NbaV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgICAgICBpZiAoIWluZm8uaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBgICR7bmFtZX09XCIke1N0cmluZyh2YWx1ZSkucmVwbGFjZSgvXCIvZywgJyYjMzQ7JykucmVwbGFjZSgvJy9nLCAnJiMzOTsnKX1cImA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cykge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgICAgIC8vIHRoZXNlIHdpbGwgYmUgaW1tZWRpYXRlbHkgZGlzY2FyZGVkXG4gICAgICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpXG4gICAgICAgIH07XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudCh7ICQkIH0pO1xuICAgICAgICBjb25zdCBodG1sID0gZm4ocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiAocHJvcHMgPSB7fSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgICAgICBvbl9kZXN0cm95ID0gW107XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IHRpdGxlOiAnJywgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC50aXRsZSArIHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiAnJztcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICB9KTtcbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCBwcm9wX3ZhbHVlcyA9IG9wdGlvbnMucHJvcHMgfHwge307XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5LFxuICAgICAgICBza2lwX2JvdW5kOiBmYWxzZVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBjaGlsZHJlbihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChub2Rlcyk7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGRldGFjaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBPYmplY3QuYXNzaWduKHsgdmVyc2lvbjogJzMuMjkuNycgfSwgZGV0YWlsKSkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmUnLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbikge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IG9wdGlvbnMgPT09IHRydWUgPyBbJ2NhcHR1cmUnXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0UHJvcGVydHknLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGFzZXQnLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGEnLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnICYmICEoYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmICdsZW5ndGgnIGluIGFyZykpIHtcbiAgICAgICAgbGV0IG1zZyA9ICd7I2VhY2h9IG9ubHkgaXRlcmF0ZXMgb3ZlciBhcnJheS1saWtlIG9iamVjdHMuJztcbiAgICAgICAgaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgYXJnICYmIFN5bWJvbC5pdGVyYXRvciBpbiBhcmcpIHtcbiAgICAgICAgICAgIG1zZyArPSAnIFlvdSBjYW4gdXNlIGEgc3ByZWFkIHRvIGNvbnZlcnQgdGhpcyBpdGVyYWJsZSBpbnRvIGFuIGFycmF5Lic7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfc2xvdHMobmFtZSwgc2xvdCwga2V5cykge1xuICAgIGZvciAoY29uc3Qgc2xvdF9rZXkgb2YgT2JqZWN0LmtleXMoc2xvdCkpIHtcbiAgICAgICAgaWYgKCF+a2V5cy5pbmRleE9mKHNsb3Rfa2V5KSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGA8JHtuYW1lfT4gcmVjZWl2ZWQgYW4gdW5leHBlY3RlZCBzbG90IFwiJHtzbG90X2tleX1cIi5gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIid0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbiAgICAkY2FwdHVyZV9zdGF0ZSgpIHsgfVxuICAgICRpbmplY3Rfc3RhdGUoKSB7IH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSBsb29wIGRldGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2xvY2F0aW9uLCBhZGRfcmVuZGVyX2NhbGxiYWNrLCBhZGRfcmVzaXplX2xpc3RlbmVyLCBhZGRfdHJhbnNmb3JtLCBhZnRlclVwZGF0ZSwgYXBwZW5kLCBhcHBlbmRfZGV2LCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9zcGFjZSwgY2xhaW1fdGV4dCwgY2xlYXJfbG9vcHMsIGNvbXBvbmVudF9zdWJzY3JpYmUsIGNvbXB1dGVfcmVzdF9wcm9wcywgY29tcHV0ZV9zbG90cywgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cywgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Nyb3Nzb3JpZ2luLCBpc19lbXB0eSwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHF1ZXJ5X3NlbGVjdG9yX2FsbCwgcmFmLCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9kYXRhLCBzZXRfZGF0YV9kZXYsIHNldF9pbnB1dF90eXBlLCBzZXRfaW5wdXRfdmFsdWUsIHNldF9ub3csIHNldF9yYWYsIHNldF9zdG9yZV92YWx1ZSwgc2V0X3N0eWxlLCBzZXRfc3ZnX2F0dHJpYnV0ZXMsIHNwYWNlLCBzcHJlYWQsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3Nsb3RzLCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCB0eXBlID0gJydcbiAgZXhwb3J0IGxldCBwYWNrID0gJ2ZhcydcbiAgZXhwb3J0IGxldCBpY29uXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG4gIGV4cG9ydCBsZXQgY3VzdG9tQ2xhc3MgPSAnJ1xuICBleHBvcnQgbGV0IGN1c3RvbVNpemUgPSAnJ1xuICBleHBvcnQgbGV0IGlzQ2xpY2thYmxlID0gZmFsc2VcbiAgZXhwb3J0IGxldCBpc0xlZnQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzUmlnaHQgPSBmYWxzZVxuXG4gIGxldCBuZXdDdXN0b21TaXplID0gJydcbiAgbGV0IG5ld1R5cGUgPSAnJ1xuXG4gICQ6IG5ld1BhY2sgPSBwYWNrIHx8ICdmYXMnXG5cbiAgJDoge1xuICAgIGlmIChjdXN0b21TaXplKSBuZXdDdXN0b21TaXplID0gY3VzdG9tU2l6ZVxuICAgIGVsc2Uge1xuICAgICAgc3dpdGNoIChzaXplKSB7XG4gICAgICAgIGNhc2UgJ2lzLXNtYWxsJzpcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpcy1tZWRpdW0nOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtbGcnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaXMtbGFyZ2UnOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtM3gnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJydcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkOiB7XG4gICAgaWYgKCF0eXBlKSBuZXdUeXBlID0gJydcbiAgICBsZXQgc3BsaXRUeXBlID0gW11cbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzcGxpdFR5cGUgPSB0eXBlLnNwbGl0KCctJylcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQga2V5IGluIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVba2V5XSkge1xuICAgICAgICAgIHNwbGl0VHlwZSA9IGtleS5zcGxpdCgnLScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3BsaXRUeXBlLmxlbmd0aCA8PSAxKSBuZXdUeXBlID0gJydcbiAgICBlbHNlIG5ld1R5cGUgPSBgaGFzLXRleHQtJHtzcGxpdFR5cGVbMV19YFxuICB9XG48L3NjcmlwdD5cblxuPHNwYW4gY2xhc3M9XCJpY29uIHtzaXplfSB7bmV3VHlwZX0geyhpc0xlZnQgJiYgJ2lzLWxlZnQnKSB8fCAnJ30geyhpc1JpZ2h0ICYmICdpcy1yaWdodCcpIHx8ICcnfVwiIGNsYXNzOmlzLWNsaWNrYWJsZT17aXNDbGlja2FibGV9IG9uOmNsaWNrPlxuICA8aSBjbGFzcz1cIntuZXdQYWNrfSBmYS17aWNvbn0ge2N1c3RvbUNsYXNzfSB7bmV3Q3VzdG9tU2l6ZX1cIiAvPlxuPC9zcGFuPlxuIiwiaW1wb3J0IHsgbm9vcCwgc2FmZV9ub3RfZXF1YWwsIHN1YnNjcmliZSwgcnVuX2FsbCwgaXNfZnVuY3Rpb24gfSBmcm9tICcuLi9pbnRlcm5hbC9pbmRleC5tanMnO1xuZXhwb3J0IHsgZ2V0X3N0b3JlX3ZhbHVlIGFzIGdldCB9IGZyb20gJy4uL2ludGVybmFsL2luZGV4Lm1qcyc7XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0gdmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcn1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmxlKHZhbHVlLCBzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogd3JpdGFibGUodmFsdWUsIHN0YXJ0KS5zdWJzY3JpYmVcbiAgICB9O1xufVxuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcbiAgICAgICAgaWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIGlmIChzdG9wKSB7IC8vIHN0b3JlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgY29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBzWzFdKCk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUucHVzaChzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5fcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuICAgICAgICBzZXQoZm4odmFsdWUpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuICAgICAgICBzdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuICAgICAgICB9XG4gICAgICAgIHJ1bih2YWx1ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHN1YnNjcmliZXJzLmluZGV4T2Yoc3Vic2NyaWJlcik7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cbmZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuICAgIGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG4gICAgY29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlXG4gICAgICAgID8gW3N0b3Jlc11cbiAgICAgICAgOiBzdG9yZXM7XG4gICAgY29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG4gICAgcmV0dXJuIHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIChzZXQpID0+IHtcbiAgICAgICAgbGV0IGluaXRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgbGV0IHBlbmRpbmcgPSAwO1xuICAgICAgICBsZXQgY2xlYW51cCA9IG5vb3A7XG4gICAgICAgIGNvbnN0IHN5bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0KTtcbiAgICAgICAgICAgIGlmIChhdXRvKSB7XG4gICAgICAgICAgICAgICAgc2V0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcnMgPSBzdG9yZXNfYXJyYXkubWFwKChzdG9yZSwgaSkgPT4gc3Vic2NyaWJlKHN0b3JlLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICAgICAgcGVuZGluZyAmPSB+KDEgPDwgaSk7XG4gICAgICAgICAgICBpZiAoaW5pdGVkKSB7XG4gICAgICAgICAgICAgICAgc3luYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBwZW5kaW5nIHw9ICgxIDw8IGkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGluaXRlZCA9IHRydWU7XG4gICAgICAgIHN5bmMoKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBkZXJpdmVkLCByZWFkYWJsZSwgd3JpdGFibGUgfTtcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnLi4vc3RvcmUvaW5kZXgubWpzJztcbmltcG9ydCB7IG5vdywgbG9vcCwgYXNzaWduIH0gZnJvbSAnLi4vaW50ZXJuYWwvaW5kZXgubWpzJztcbmltcG9ydCB7IGxpbmVhciB9IGZyb20gJy4uL2Vhc2luZy9pbmRleC5tanMnO1xuXG5mdW5jdGlvbiBpc19kYXRlKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiB0aWNrX3NwcmluZyhjdHgsIGxhc3RfdmFsdWUsIGN1cnJlbnRfdmFsdWUsIHRhcmdldF92YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgY3VycmVudF92YWx1ZSA9PT0gJ251bWJlcicgfHwgaXNfZGF0ZShjdXJyZW50X3ZhbHVlKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGRlbHRhID0gdGFyZ2V0X3ZhbHVlIC0gY3VycmVudF92YWx1ZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB2ZWxvY2l0eSA9IChjdXJyZW50X3ZhbHVlIC0gbGFzdF92YWx1ZSkgLyAoY3R4LmR0IHx8IDEgLyA2MCk7IC8vIGd1YXJkIGRpdiBieSAwXG4gICAgICAgIGNvbnN0IHNwcmluZyA9IGN0eC5vcHRzLnN0aWZmbmVzcyAqIGRlbHRhO1xuICAgICAgICBjb25zdCBkYW1wZXIgPSBjdHgub3B0cy5kYW1waW5nICogdmVsb2NpdHk7XG4gICAgICAgIGNvbnN0IGFjY2VsZXJhdGlvbiA9IChzcHJpbmcgLSBkYW1wZXIpICogY3R4Lmludl9tYXNzO1xuICAgICAgICBjb25zdCBkID0gKHZlbG9jaXR5ICsgYWNjZWxlcmF0aW9uKSAqIGN0eC5kdDtcbiAgICAgICAgaWYgKE1hdGguYWJzKGQpIDwgY3R4Lm9wdHMucHJlY2lzaW9uICYmIE1hdGguYWJzKGRlbHRhKSA8IGN0eC5vcHRzLnByZWNpc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldF92YWx1ZTsgLy8gc2V0dGxlZFxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY3R4LnNldHRsZWQgPSBmYWxzZTsgLy8gc2lnbmFsIGxvb3AgdG8ga2VlcCB0aWNraW5nXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByZXR1cm4gaXNfZGF0ZShjdXJyZW50X3ZhbHVlKSA/XG4gICAgICAgICAgICAgICAgbmV3IERhdGUoY3VycmVudF92YWx1ZS5nZXRUaW1lKCkgKyBkKSA6IGN1cnJlbnRfdmFsdWUgKyBkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudF92YWx1ZSkpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gY3VycmVudF92YWx1ZS5tYXAoKF8sIGkpID0+IHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZVtpXSwgY3VycmVudF92YWx1ZVtpXSwgdGFyZ2V0X3ZhbHVlW2ldKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBjdXJyZW50X3ZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCBuZXh0X3ZhbHVlID0ge307XG4gICAgICAgIGZvciAoY29uc3QgayBpbiBjdXJyZW50X3ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBuZXh0X3ZhbHVlW2tdID0gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2tdLCBjdXJyZW50X3ZhbHVlW2tdLCB0YXJnZXRfdmFsdWVba10pO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIG5leHRfdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzcHJpbmcgJHt0eXBlb2YgY3VycmVudF92YWx1ZX0gdmFsdWVzYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3ByaW5nKHZhbHVlLCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBzdG9yZSA9IHdyaXRhYmxlKHZhbHVlKTtcbiAgICBjb25zdCB7IHN0aWZmbmVzcyA9IDAuMTUsIGRhbXBpbmcgPSAwLjgsIHByZWNpc2lvbiA9IDAuMDEgfSA9IG9wdHM7XG4gICAgbGV0IGxhc3RfdGltZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgY3VycmVudF90b2tlbjtcbiAgICBsZXQgbGFzdF92YWx1ZSA9IHZhbHVlO1xuICAgIGxldCB0YXJnZXRfdmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgaW52X21hc3MgPSAxO1xuICAgIGxldCBpbnZfbWFzc19yZWNvdmVyeV9yYXRlID0gMDtcbiAgICBsZXQgY2FuY2VsX3Rhc2sgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlLCBvcHRzID0ge30pIHtcbiAgICAgICAgdGFyZ2V0X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGN1cnJlbnRfdG9rZW4gPSB7fTtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgfHwgb3B0cy5oYXJkIHx8IChzcHJpbmcuc3RpZmZuZXNzID49IDEgJiYgc3ByaW5nLmRhbXBpbmcgPj0gMSkpIHtcbiAgICAgICAgICAgIGNhbmNlbF90YXNrID0gdHJ1ZTsgLy8gY2FuY2VsIGFueSBydW5uaW5nIGFuaW1hdGlvblxuICAgICAgICAgICAgbGFzdF90aW1lID0gbm93KCk7XG4gICAgICAgICAgICBsYXN0X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gdGFyZ2V0X3ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRzLnNvZnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhdGUgPSBvcHRzLnNvZnQgPT09IHRydWUgPyAuNSA6ICtvcHRzLnNvZnQ7XG4gICAgICAgICAgICBpbnZfbWFzc19yZWNvdmVyeV9yYXRlID0gMSAvIChyYXRlICogNjApO1xuICAgICAgICAgICAgaW52X21hc3MgPSAwOyAvLyBpbmZpbml0ZSBtYXNzLCB1bmFmZmVjdGVkIGJ5IHNwcmluZyBmb3JjZXNcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2spIHtcbiAgICAgICAgICAgIGxhc3RfdGltZSA9IG5vdygpO1xuICAgICAgICAgICAgY2FuY2VsX3Rhc2sgPSBmYWxzZTtcbiAgICAgICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbmNlbF90YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbF90YXNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRhc2sgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGludl9tYXNzID0gTWF0aC5taW4oaW52X21hc3MgKyBpbnZfbWFzc19yZWNvdmVyeV9yYXRlLCAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdHggPSB7XG4gICAgICAgICAgICAgICAgICAgIGludl9tYXNzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzOiBzcHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIHNldHRsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGR0OiAobm93IC0gbGFzdF90aW1lKSAqIDYwIC8gMTAwMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dF92YWx1ZSA9IHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZSwgdmFsdWUsIHRhcmdldF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgbGFzdF90aW1lID0gbm93O1xuICAgICAgICAgICAgICAgIGxhc3RfdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBuZXh0X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoY3R4LnNldHRsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhY3R4LnNldHRsZWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVsZmlsID0+IHtcbiAgICAgICAgICAgIHRhc2sucHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4gPT09IGN1cnJlbnRfdG9rZW4pXG4gICAgICAgICAgICAgICAgICAgIGZ1bGZpbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBzcHJpbmcgPSB7XG4gICAgICAgIHNldCxcbiAgICAgICAgdXBkYXRlOiAoZm4sIG9wdHMpID0+IHNldChmbih0YXJnZXRfdmFsdWUsIHZhbHVlKSwgb3B0cyksXG4gICAgICAgIHN1YnNjcmliZTogc3RvcmUuc3Vic2NyaWJlLFxuICAgICAgICBzdGlmZm5lc3MsXG4gICAgICAgIGRhbXBpbmcsXG4gICAgICAgIHByZWNpc2lvblxuICAgIH07XG4gICAgcmV0dXJuIHNwcmluZztcbn1cblxuZnVuY3Rpb24gZ2V0X2ludGVycG9sYXRvcihhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIgfHwgYSAhPT0gYSlcbiAgICAgICAgcmV0dXJuICgpID0+IGE7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBhO1xuICAgIGlmICh0eXBlICE9PSB0eXBlb2YgYiB8fCBBcnJheS5pc0FycmF5KGEpICE9PSBBcnJheS5pc0FycmF5KGIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGludGVycG9sYXRlIHZhbHVlcyBvZiBkaWZmZXJlbnQgdHlwZScpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICBjb25zdCBhcnIgPSBiLm1hcCgoYmksIGkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBnZXRfaW50ZXJwb2xhdG9yKGFbaV0sIGJpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ID0+IGFyci5tYXAoZm4gPT4gZm4odCkpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKCFhIHx8ICFiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPYmplY3QgY2Fubm90IGJlIG51bGwnKTtcbiAgICAgICAgaWYgKGlzX2RhdGUoYSkgJiYgaXNfZGF0ZShiKSkge1xuICAgICAgICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBiIC0gYTtcbiAgICAgICAgICAgIHJldHVybiB0ID0+IG5ldyBEYXRlKGEgKyB0ICogZGVsdGEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhiKTtcbiAgICAgICAgY29uc3QgaW50ZXJwb2xhdG9ycyA9IHt9O1xuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIGludGVycG9sYXRvcnNba2V5XSA9IGdldF9pbnRlcnBvbGF0b3IoYVtrZXldLCBiW2tleV0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHQgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IGludGVycG9sYXRvcnNba2V5XSh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYiAtIGE7XG4gICAgICAgIHJldHVybiB0ID0+IGEgKyB0ICogZGVsdGE7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGludGVycG9sYXRlICR7dHlwZX0gdmFsdWVzYCk7XG59XG5mdW5jdGlvbiB0d2VlbmVkKHZhbHVlLCBkZWZhdWx0cyA9IHt9KSB7XG4gICAgY29uc3Qgc3RvcmUgPSB3cml0YWJsZSh2YWx1ZSk7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHRhcmdldF92YWx1ZSA9IHZhbHVlO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUsIG9wdHMpIHtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IG5ld192YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICBsZXQgcHJldmlvdXNfdGFzayA9IHRhc2s7XG4gICAgICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIGxldCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSA0MDAsIGVhc2luZyA9IGxpbmVhciwgaW50ZXJwb2xhdGUgPSBnZXRfaW50ZXJwb2xhdG9yIH0gPSBhc3NpZ24oYXNzaWduKHt9LCBkZWZhdWx0cyksIG9wdHMpO1xuICAgICAgICBpZiAoZHVyYXRpb24gPT09IDApIHtcbiAgICAgICAgICAgIGlmIChwcmV2aW91c190YXNrKSB7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzay5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX3Rhc2sgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gdGFyZ2V0X3ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGFydCA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGxldCBmbjtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChub3cgPCBzdGFydClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgIGZuID0gaW50ZXJwb2xhdGUodmFsdWUsIG5ld192YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbih2YWx1ZSwgbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmV2aW91c190YXNrKSB7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzay5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX3Rhc2sgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IG5vdyAtIHN0YXJ0O1xuICAgICAgICAgICAgaWYgKGVsYXBzZWQgPiBkdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IG5ld192YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gZm4oZWFzaW5nKGVsYXBzZWQgLyBkdXJhdGlvbikpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhc2sucHJvbWlzZTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2V0LFxuICAgICAgICB1cGRhdGU6IChmbiwgb3B0cykgPT4gc2V0KGZuKHRhcmdldF92YWx1ZSwgdmFsdWUpLCBvcHRzKSxcbiAgICAgICAgc3Vic2NyaWJlOiBzdG9yZS5zdWJzY3JpYmVcbiAgICB9O1xufVxuXG5leHBvcnQgeyBzcHJpbmcsIHR3ZWVuZWQgfTtcbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IHNldENvbnRleHQsIGdldENvbnRleHQsIG9uTW91bnQsIG9uRGVzdHJveSwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICBpbXBvcnQgeyBnZXQsIHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuICBpbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSdcblxuICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgLyoqIEluZGV4IG9mIHRoZSBhY3RpdmUgdGFiICh6ZXJvLWJhc2VkKVxuICAgKiBAc3ZlbHRlLXByb3Age051bWJlcn0gW3ZhbHVlPTBdXG4gICAqICovXG4gIGV4cG9ydCBsZXQgdmFsdWUgPSAwXG5cbiAgLyoqIFNpemUgb2YgdGFic1xuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW3NpemVdXG4gICAqIEB2YWx1ZXMgJCRzaXplcyQkXG4gICAqICovXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG5cbiAgLyoqIFBvc2l0aW9uIG9mIHRhYnMgbGlzdCwgaG9yaXpvbnRhbGx5LiBCeSBkZWZhdWx0IHRoZXkncmUgcG9zaXRpb25lZCB0byB0aGUgbGVmdFxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW3Bvc2l0aW9uXVxuICAgKiBAdmFsdWVzIGlzLWNlbnRlcmVkLCBpcy1yaWdodFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHBvc2l0aW9uID0gJydcblxuICAvKiogU3R5bGUgb2YgdGFic1xuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW3N0eWxlXVxuICAgKiBAdmFsdWVzIGlzLWJveGVkLCBpcy10b2dnbGUsIGlzLXRvZ2dsZS1yb3VuZGVkLCBpcy1mdWxsd2lkdGhcbiAgICogKi9cbiAgZXhwb3J0IGxldCBzdHlsZSA9ICcnXG5cbiAgZXhwb3J0IGxldCBleHBhbmRlZCA9IGZhbHNlXG5cbiAgbGV0IGFjdGl2ZVRhYiA9IDBcbiAgJDogY2hhbmdlVGFiKHZhbHVlKVxuXG4gIGNvbnN0IHRhYnMgPSB3cml0YWJsZShbXSlcblxuICBjb25zdCB0YWJDb25maWcgPSB7XG4gICAgYWN0aXZlVGFiLFxuICAgIHRhYnMsXG4gIH1cblxuICBzZXRDb250ZXh0KCd0YWJzJywgdGFiQ29uZmlnKVxuXG4gIC8vIFRoaXMgb25seSBydW5zIGFzIHRhYnMgYXJlIGFkZGVkL3JlbW92ZWRcbiAgY29uc3QgdW5zdWJzY3JpYmUgPSB0YWJzLnN1YnNjcmliZSh0cyA9PiB7XG4gICAgaWYgKHRzLmxlbmd0aCA+IDAgJiYgdHMubGVuZ3RoID4gdmFsdWUgLSAxKSB7XG4gICAgICB0cy5mb3JFYWNoKHQgPT4gdC5kZWFjdGl2YXRlKCkpXG4gICAgICBpZiAodHNbdmFsdWVdKSB0c1t2YWx1ZV0uYWN0aXZhdGUoKVxuICAgIH1cbiAgfSlcblxuICBmdW5jdGlvbiBjaGFuZ2VUYWIodGFiTnVtYmVyKSB7XG4gICAgY29uc3QgdHMgPSBnZXQodGFicylcbiAgICAvLyBOT1RFOiBjaGFuZ2UgdGhpcyBiYWNrIHRvIHVzaW5nIGNoYW5nZVRhYiBpbnN0ZWFkIG9mIGFjdGl2YXRlL2RlYWN0aXZhdGUgb25jZSB0cmFuc2l0aW9ucy9hbmltYXRpb25zIGFyZSB3b3JraW5nXG4gICAgaWYgKHRzW2FjdGl2ZVRhYl0pIHRzW2FjdGl2ZVRhYl0uZGVhY3RpdmF0ZSgpXG4gICAgaWYgKHRzW3RhYk51bWJlcl0pIHRzW3RhYk51bWJlcl0uYWN0aXZhdGUoKVxuICAgIC8vIHRzLmZvckVhY2godCA9PiB0LmNoYW5nZVRhYih7IGZyb206IGFjdGl2ZVRhYiwgdG86IHRhYk51bWJlciB9KSlcbiAgICBhY3RpdmVUYWIgPSB0YWJDb25maWcuYWN0aXZlVGFiID0gdGFiTnVtYmVyXG4gICAgZGlzcGF0Y2goJ2FjdGl2ZVRhYkNoYW5nZWQnLCB0YWJOdW1iZXIpXG4gIH1cblxuICBvbk1vdW50KCgpID0+IHtcbiAgICBjaGFuZ2VUYWIoYWN0aXZlVGFiKVxuICB9KVxuXG4gIG9uRGVzdHJveSgoKSA9PiB7XG4gICAgdW5zdWJzY3JpYmUoKVxuICB9KVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAudGFicy13cmFwcGVyIHtcbiAgICAmLmlzLWZ1bGx3aWR0aCB7XG4gICAgICAvKiBUT0RPICovXG4gICAgfVxuXG4gICAgLnRhYi1jb250ZW50IHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgICAgZmxleC13cmFwOiBub3dyYXA7XG4gICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgfVxuICB9XG48L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwidGFicy13cmFwcGVyXCIgY2xhc3M6aXMtZnVsbHdpZHRoPXtleHBhbmRlZH0+XG4gIDxuYXYgY2xhc3M9XCJ0YWJzIHtzaXplfSB7cG9zaXRpb259IHtzdHlsZX1cIj5cbiAgICA8dWw+XG4gICAgICB7I2VhY2ggJHRhYnMgYXMgdGFiLCBpbmRleH1cbiAgICAgICAgPGxpIGNsYXNzOmlzLWFjdGl2ZT17aW5kZXggPT09IGFjdGl2ZVRhYn0+XG4gICAgICAgICAgPGEgaHJlZiBvbjpjbGlja3xwcmV2ZW50RGVmYXVsdD17KCkgPT4gY2hhbmdlVGFiKGluZGV4KX0+XG4gICAgICAgICAgICB7I2lmIHRhYi5pY29ufVxuICAgICAgICAgICAgICA8SWNvbiBwYWNrPXt0YWIuaWNvblBhY2t9IGljb249e3RhYi5pY29ufSAvPlxuICAgICAgICAgICAgey9pZn1cblxuICAgICAgICAgICAgPHNwYW4+e3RhYi5sYWJlbH08L3NwYW4+XG4gICAgICAgICAgPC9hPlxuICAgICAgICA8L2xpPlxuICAgICAgey9lYWNofVxuICAgIDwvdWw+XG4gIDwvbmF2PlxuICA8c2VjdGlvbiBjbGFzcz1cInRhYi1jb250ZW50XCI+XG4gICAgPHNsb3QgLz5cbiAgPC9zZWN0aW9uPlxuPC9kaXY+XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBiZWZvcmVVcGRhdGUsIHNldENvbnRleHQsIGdldENvbnRleHQsIHRpY2ssIG9uTW91bnQgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJ1xuXG4gIC8qKiBMYWJlbCBmb3IgdGFiXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBsYWJlbFxuICAgKiAqL1xuICBleHBvcnQgbGV0IGxhYmVsXG5cbiAgLyoqIFNob3cgdGhpcyBpY29uIG9uIGxlZnQtc2lkZSBvZiB0aGUgdGFiXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbaWNvbl1cbiAgICogKi9cbiAgZXhwb3J0IGxldCBpY29uID0gJydcblxuICAvKiogRm9udGF3ZXNvbWUgaWNvbiBwYWNrIHRvIHVzZS4gQnkgZGVmYXVsdCB0aGUgPGNvZGU+SWNvbjwvY29kZT4gY29tcG9uZW50IHVzZXMgPGNvZGU+ZmFzPC9jb2RlPlxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW2ljb25QYWNrXVxuICAgKiBAdmFsdWVzIDxjb2RlPmZhczwvY29kZT4sIDxjb2RlPmZhYjwvY29kZT4sIGV0Yy4uLlxuICAgKiAqL1xuICBleHBvcnQgbGV0IGljb25QYWNrID0gJydcblxuICBsZXQgYWN0aXZlID0gZmFsc2VcblxuICBsZXQgZWxcbiAgbGV0IGluZGV4XG4gIGxldCBzdGFydGluZyA9IGZhbHNlXG4gIGxldCBkaXJlY3Rpb24gPSAnJ1xuICBsZXQgaXNJbiA9IGZhbHNlXG5cbiAgY29uc3QgdGFiQ29uZmlnID0gZ2V0Q29udGV4dCgndGFicycpXG5cbiAgZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoYW5nZVRhYih7IGZyb20sIHRvIH0pIHtcbiAgICBpZiAoZnJvbSA9PT0gdG8pIHJldHVyblxuXG4gICAgLy8gY29uc29sZS5sb2coeyBpbmRleCwgZnJvbSwgdG8gfSwgdG8gPT09IGluZGV4KVxuICAgIGlmIChmcm9tID09PSBpbmRleCkge1xuICAgICAgLy8gVHJhbnNpdGlvbiBvdXRcbiAgICAgIGRpcmVjdGlvbiA9IGluZGV4IDwgdG8gPyAnbGVmdCcgOiAncmlnaHQnXG4gICAgfSBlbHNlIGlmICh0byA9PT0gaW5kZXgpIHtcbiAgICAgIC8vIFRyYW5zaXRpb24gaW47IHN0YXJ0IGF0IGRpcmVjdGlvbiB3aGVuIHJlbmRlcmVkLCB0aGVuIHJlbW92ZSBpdFxuICAgICAgLy8gY29uc29sZS5sb2coJ1RSQU5TSVRJT04nLCB7IGluZGV4LCB0bywgYWN0aXZlIH0pXG4gICAgICBhY3RpdmUgPSB0cnVlXG4gICAgICBkaXJlY3Rpb24gPSBpbmRleCA+IGZyb20gPyAncmlnaHQnIDogJ2xlZnQnXG4gICAgICAvLyBhd2FpdCB0aWNrKClcbiAgICAgIC8vIGRpcmVjdGlvbiA9ICcnXG4gICAgfSBlbHNlIGRpcmVjdGlvbiA9ICcnXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVJbmRleCgpIHtcbiAgICBpZiAoIWVsKSByZXR1cm5cbiAgICBpbmRleCA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoZWwucGFyZW50Tm9kZS5jaGlsZHJlbiwgZWwpXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiB0cmFuc2l0aW9uZW5kKGV2ZW50KSB7XG4gICAgLy8gY29uc29sZS5sb2coeyBpbmRleCwgYWN0aXZlLCBhY3RpdmVUYWI6IHRhYkNvbmZpZy5hY3RpdmVUYWIgfSlcbiAgICAvLyBjb25zb2xlLmxvZyhldmVudC50YXJnZXQpXG4gICAgYWN0aXZlID0gaW5kZXggPT09IHRhYkNvbmZpZy5hY3RpdmVUYWJcbiAgICBhd2FpdCB0aWNrKClcbiAgICBkaXJlY3Rpb24gPSAnJ1xuICB9XG5cbiAgdGFiQ29uZmlnLnRhYnMuc3Vic2NyaWJlKHRhYnMgPT4ge1xuICAgIHVwZGF0ZUluZGV4KClcbiAgfSlcblxuICBvbk1vdW50KCgpID0+IHtcbiAgICB1cGRhdGVJbmRleCgpXG5cbiAgICB0YWJDb25maWcudGFicy51cGRhdGUodGFicyA9PiBbXG4gICAgICAuLi50YWJzLFxuICAgICAge1xuICAgICAgICBpbmRleCxcbiAgICAgICAgbGFiZWwsXG4gICAgICAgIGljb24sXG4gICAgICAgIGljb25QYWNrLFxuICAgICAgICBhY3RpdmF0ZTogKCkgPT4gKGFjdGl2ZSA9IHRydWUpLFxuICAgICAgICBkZWFjdGl2YXRlOiAoKSA9PiAoYWN0aXZlID0gZmFsc2UpLFxuICAgICAgICBjaGFuZ2VUYWIsXG4gICAgICB9LFxuICAgIF0pXG4gIH0pXG5cbiAgYmVmb3JlVXBkYXRlKGFzeW5jICgpID0+IHtcbiAgICBpZiAoaW5kZXggPT09IHRhYkNvbmZpZy5hY3RpdmVUYWIgJiYgZGlyZWN0aW9uKSB7XG4gICAgICBhd2FpdCB0aWNrKClcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkaXJlY3Rpb24gPSAnJ1xuICAgICAgfSlcbiAgICB9XG4gIH0pXG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC8vIE5PVEU6IGFkZCB0cmFuc2l0aW9ucy9hbmltYXRpb25zIGJhY2sgb25jZSB0aGV5J3JlIHdvcmtpbmdcbiAgLnRhYiB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgICBmbGV4OiAxIDAgMTAwJTtcbiAgICAvLyB3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xuICAgIC8vIHRyYW5zaXRpb246IHRyYW5zZm9ybSA0MDBtcyBlYXNlLWluO1xuXG4gICAgJi5pcy1hY3RpdmUge1xuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgLy8gdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDApO1xuICAgIH1cblxuICAgIC8vICYuc3RhcnRpbmcge1xuICAgIC8vICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICAvLyB9XG5cbiAgICAvLyAmLmxlZnQge1xuICAgIC8vICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC0xMDAlKTtcbiAgICAvLyB9XG5cbiAgICAvLyAmLnJpZ2h0IHtcbiAgICAvLyAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMDAlKTtcbiAgICAvLyB9XG5cbiAgICAvLyAmLnN0YXJ0aW5nIHtcbiAgICAvLyAgIHRyYW5zaXRpb246IG5vbmU7XG4gICAgLy8gfVxuICB9XG48L3N0eWxlPlxuXG48ZGl2XG4gIGNsYXNzPVwidGFiIHtkaXJlY3Rpb259XCJcbiAgY2xhc3M6aXMtYWN0aXZlPXthY3RpdmV9XG4gIGJpbmQ6dGhpcz17ZWx9XG4gIGFyaWEtaGlkZGVuPXshYWN0aXZlfVxuICBvbjp0cmFuc2l0aW9uZW5kPXt0cmFuc2l0aW9uZW5kfT5cbiAgPHNsb3Qge2xhYmVsfSB7aWNvblBhY2t9IHtpY29ufSAvPlxuPC9kaXY+XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcblxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcbiAgb3BlbkRpc2FibGVkOiBmYWxzZSxcbiAgc2F2ZURpc2FibGVkOiB0cnVlLFxuICBnb0Rpc2FibGVkOiB0cnVlLFxuICBjb250ZW50OiAnJyxcbiAgZnBhdGg6ICcnLFxuICBwYXRoOiAnJ1xufSlcbiIsIjxzY3JpcHQ+XG5leHBvcnQgbGV0IHRvcDtcblxuZnVuY3Rpb24gcmVzaXplKCkge1xuICByZXR1cm4gdG9wID8gYGhlaWdodDogY2FsYygxMDB2aCAtICR7dG9wfXB4KTtgIDogJyc7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInZib3ggbGVmdFwiPlxuICA8ZGl2IGNsYXNzPVwidGFibGUtY29udGFpbmVyXCIgc3R5bGU9XCJ7cmVzaXplKCl9XCI+XG4gICAgPHNsb3Q+PC9zbG90PlxuICA8L2Rpdj5cbjwvZGl2PlxuXG48c3R5bGU+XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbi52Ym94LmxlZnQge1xuICB3aWR0aDogMTAwJTtcbn1cbi50YWJsZS1jb250YWluZXIge1xuICBvdmVyZmxvdzogYXV0bztcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmV4cG9ydCBsZXQgdG9wO1xuXG5pbXBvcnQge3NwcmluZ30gZnJvbSAnc3ZlbHRlL21vdGlvbidcbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSc7XG5cbmNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XG4gIFxubGV0IGRyb3BUYXJnZXQ7XG5mdW5jdGlvbiBkcmFnZ2FibGUobm9kZSwgcGFyYW1zKSB7XG4gIFxuICBsZXQgbGFzdFg7XG4gIGxldCBwYXJlbnRYO1xuICBsZXQgb2Zmc2V0WCA9IDBcbiAgY29uc3Qgb2Zmc2V0ID0gc3ByaW5nKHt4OiBvZmZzZXRYLCB5OiAwfSwge1xuXHRcdHN0aWZmbmVzczogMC4yLFxuXHRcdGRhbXBpbmc6IDAuNFxuXHR9KTtcblxuICBvZmZzZXQuc3Vic2NyaWJlKG9mZnNldCA9PiB7XG4gICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgIGNvbnN0IGxlZnQgPSBwYXJlbnRYICsgb2Zmc2V0LnhcbiAgICAgIHBhcmVudC5zdHlsZS5sZWZ0ID0gYCR7bGVmdH1weGA7XG4gICAgICBwYXJlbnQuc3R5bGUud2lkdGggPSBgY2FsYygxMDB2dyAtICR7bGVmdH1weGA7XG4gICAgfVxuICB9KVxuXG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duKTtcblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZWRvd24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0bGFzdFggPSBldmVudC5jbGllbnRYO1xuICAgIHBhcmVudFggPSBub2RlLnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcbiAgICBub2RlLmNsYXNzTGlzdC5hZGQoJ2RyYWdnZWQnKVxuXG4gICAgZGlzcGF0Y2goJ2RyYWdzdGFydCcsIHt0YXJnZXQ6bm9kZSwgbGFzdFh9KTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2V1cCk7XG5cdH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZW1vdmUoZSkge1xuICAgIG9mZnNldFggKz0gZS5jbGllbnRYIC0gbGFzdFg7XG4gICAgb2Zmc2V0LnNldCh7eDogb2Zmc2V0WCwgeTogMH0pO1xuICAgIFxuXHRcdGxhc3RYID0gZS5jbGllbnRYO1xuICAgIGRpc3BhdGNoKCdkcmFnJywge3RhcmdldDpub2RlLCBsZWZ0OiBub2RlLnBhcmVudE5vZGUub2Zmc2V0TGVmdH0pO1xuXHR9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2V1cChldmVudCkge1xuICAgIG9mZnNldFggPSAwO1xuICAgIGRyb3BUYXJnZXQgPSBudWxsO1xuICAgIGxhc3RYID0gdW5kZWZpbmVkO1xuICAgIHBhcmVudFggPSB1bmRlZmluZWQ7XG5cbiAgICBub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWdnZWQnKTtcbiAgICBvZmZzZXQuc2V0KHt4OiBub2RlLm9mZnNldExlZnQsIHk6IDB9KTtcbiAgICBkaXNwYXRjaCgnZHJhZ2VuZCcsIHt0YXJnZXQ6IG5vZGUsIGxlZnQ6IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0fSk7XG4gICAgXG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSk7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVNb3VzZXVwKTtcblx0fVxuICBcbiAgcmV0dXJuIHtcblx0XHRkZXN0cm95KCkge1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24pO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZXNpemUoKSB7XG4gIHJldHVybiB0b3AgPyBgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gJHt0b3B9cHgpO2AgOiAnJztcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwicmVzaXplXCIgdXNlOmRyYWdnYWJsZSBzdHlsZT1cIntyZXNpemUoKX1cIj4gPC9kaXY+XG5cbjxzdHlsZT5cbi5yZXNpemUge1xuICB3aWR0aDogMnB4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjNjNDlkO1xuICBjdXJzb3I6IGNvbC1yZXNpemU7XG4gIHotaW5kZXg6IDU7XG59XG48L3N0eWxlPiIsIjxzY3JpcHQ+XG5leHBvcnQgbGV0IHRvcDtcbmV4cG9ydCBsZXQgbGVmdDtcblxuaW1wb3J0IHtjcmVhdGVFdmVudERpc3BhdGNoZXJ9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgU3BsaXR0ZXIgZnJvbSAnLi9TcGxpdHRlci5zdmVsdGUnO1xuXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG5mdW5jdGlvbiByZXNpemUoKSB7XG4gIGxldCBjc3MgPSBgbGVmdDogJHtsZWZ0fXB4O3dpZHRoOiBjYWxjKDEwMHZ3IC0gJHtsZWZ0fXB4KTtgXG4gIGlmICh0b3ApIHtcbiAgICBjc3MgKz0gYGhlaWdodDogY2FsYygxMDB2aCAtICR7dG9wfXB4KTtgO1xuICB9XG4gIHJldHVybiBjc3M7XG59XG5cbmZ1bmN0aW9uIGRyYWdnZWQoZSkge1xuICBkaXNwYXRjaCgnZHJhZycsICBlLmRldGFpbCk7XG59XG5cbmZ1bmN0aW9uIGRyYWdlbmQoZSkge1xuICBkaXNwYXRjaCgnZHJhZ2VuZCcsICBlLmRldGFpbCk7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInZib3ggcmlnaHRcIiBzdHlsZT1cIntyZXNpemUobGVmdCl9XCI+XG4gIDxTcGxpdHRlciBvbjpkcmFnPXtkcmFnZ2VkfSBvbjpkcmFnZW5kPXtkcmFnZW5kfSB7dG9wfS8+XG4gIDxzbG90Pjwvc2xvdD5cbjwvZGl2PlxuXG48c3R5bGU+XG4udmJveCB7XG4gIGZsZXg6IGF1dG87XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbi52Ym94LnJpZ2h0IHtcbiAgcmlnaHQ6IDA7XG4gIGxlZnQ6IDE2M3B4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJhY2tncm91bmQ6ICNmMWY3ZjdlMztcbiAgd2lkdGg6IGNhbGMoMTAwdncgLSAxNjNweCk7XG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xuICBvdmVyZmxvdzogaGlkZGVuO1xufVxuXG5cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmV4cG9ydCBsZXQgTGlzdDtcbmV4cG9ydCBsZXQgbGVmdDtcbmV4cG9ydCBsZXQgdGl0bGU7XG5leHBvcnQgbGV0IGRyYWdlbmQ7XG5leHBvcnQgbGV0IHNob3cgPSAxO1xuZXhwb3J0IGxldCBwcm9wcyA9IHt9O1xuZXhwb3J0IGxldCBib3ggPSB0cnVlO1xuZXhwb3J0IGxldCB0b3AgPSBcIjBcIjtcblxuaW1wb3J0IFZCb3ggZnJvbSAnLi4vYm94L1ZCb3guc3ZlbHRlJztcbmltcG9ydCBCU3RhdGljIGZyb20gJy4uL2JveC9CU3RhdGljLnN2ZWx0ZSc7XG5pbXBvcnQgQlJlc2l6ZSBmcm9tICcuLi9ib3gvQlJlc2l6ZS5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuPC9zY3JpcHQ+XG5cbjxWQm94PlxuICA8QlN0YXRpYyB7dG9wfT5cbiAgICA8QkhlYWRlcj5cbiAgICAgIHsjaWYgdHlwZW9mIHRpdGxlID09PSAnc3RyaW5nJ31cbiAgICAgICAge3RpdGxlfVxuICAgICAgezplbHNlfVxuICAgICAgICA8c3ZlbHRlOmNvbXBvbmVudCB0aGlzPXt0aXRsZX0vPlxuICAgICAgey9pZn1cbiAgICA8L0JIZWFkZXI+XG4gICAgeyNpZiBib3h9XG4gICAgICA8QlRhYmxlPjxzdmVsdGU6Y29tcG9uZW50IHRoaXM9e0xpc3R9IHsuLi5wcm9wc30vPjwvQlRhYmxlPlxuICAgIHs6ZWxzZX1cbiAgICAgIDxkaXYgY2xhc3M9XCJkZXRhaWxzLWxpc3RcIj48c3ZlbHRlOmNvbXBvbmVudCB0aGlzPXtMaXN0fSB7Li4ucHJvcHN9Lz48L2Rpdj5cbiAgICB7L2lmfVxuICA8L0JTdGF0aWM+XG4gIHsjaWYgc2hvd31cbiAgPEJSZXNpemUge2xlZnR9IG9uOmRyYWdlbmQ9e2RyYWdlbmR9IHt0b3B9PlxuICAgIDxzbG90Pjwvc2xvdD5cbiAgPC9CUmVzaXplPlxuICB7L2lmfVxuPC9WQm94PlxuXG48c3R5bGU+XG4gIC5kZXRhaWxzLWxpc3Qge1xuICAgIG1hcmdpbi10b3A6IDE5cHg7XG4gICAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcbiAgICBmb250LXNpemU6IDEycHg7XG4gIH1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gYnRuTWluKCkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcm91dGUgfX0gPSB3aW5kb3cubWl0bTtcbiAgX3JvdXRlICYmIF9yb3V0ZS50cmlnZ2VyKCdmb2xkJywgJ2VkaXRvci5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blBsdXMoKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9yb3V0ZSB9fSA9IHdpbmRvdy5taXRtO1xuICBfcm91dGUgJiYgX3JvdXRlLnRyaWdnZXIoJ3VuZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcm91dGUgfX0gPSB3aW5kb3cubWl0bTtcbiAgaWYgKF9yb3V0ZSkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBfcm91dGUuZ2V0VmFsdWUoKVxuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBjb250ZW50LFxuICAgICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXG4gICAgICAgIGVkaXRidWZmZXI6IGNvbnRlbnRcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xuICAgIHdzX19zZW5kKCdzYXZlUm91dGUnLCAkc291cmNlLCBkYXRhID0+IHtcbiAgICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHsuLi5uLCBzYXZlRGlzYWJsZWQ6IHRydWV9fSk7XG4gICAgICBjb25zb2xlLmxvZygnRG9uZSBTYXZlIScpO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XG4gIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xuICB3c19fc2VuZCgnb3BlbkZvbGRlcicsICRzb3VyY2UsIGRhdGEgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdEb25lIE9wZW4hJyk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBidG5zKGlkKSB7XG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbaWRdO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhyb3V0ZS51cmxzKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZnVuY3Rpb24gYnRuVXJsKGlkKSB7XG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybHMpIHtcbiAgICByZXR1cm4gcm91dGUudXJsc1tpZF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ0blRhZyhlKSB7XG4gIGNocm9tZS50YWJzLnVwZGF0ZSh7dXJsOiBlLnRhcmdldC5kYXRhc2V0LnVybH0pO1xufVxuXG5mdW5jdGlvbiBidG5HbyhlKSB7XG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybCkge1xuICAgIGNocm9tZS50YWJzLnVwZGF0ZSh7dXJsOiByb3V0ZS51cmx9KTtcbiAgfVxufVxuPC9zY3JpcHQ+XG5cbnsjaWYgJHNvdXJjZS5wYXRofVxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICB7I2VhY2ggYnRucygkc291cmNlLml0ZW0pIGFzIGl0ZW19XG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLWdvXCIgb246Y2xpY2s9XCJ7YnRuVGFnfVwiXG4gIGRhdGEtdXJsPVwie2J0blVybChpdGVtKX1cIj57aXRlbX08L2J1dHRvbj4gLSBcbiAgey9lYWNofVxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIGRpc2FibGVkPXskc291cmNlLmdvRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bkdvfVwiPkdvPC9idXR0b24+LlxuICA8L2Rpdj5cbnsvaWZ9XG48ZGl2IGNsYXNzPVwiZmlsZS1wYXRoXCI+XG5QYXRoOnskc291cmNlLnBhdGh9XG57I2lmICRzb3VyY2UucGF0aH1cblx0PGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tbWluXCIgIG9uOmNsaWNrPVwie2J0bk1pbn1cIiA+Wy0tXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXBsdXNcIiBvbjpjbGljaz1cIntidG5QbHVzfVwiPlsrK108L2J1dHRvbj4gLVxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1zYXZlXCIgZGlzYWJsZWQ9eyRzb3VyY2Uuc2F2ZURpc2FibGVkfSBvbjpjbGljaz1cIntidG5TYXZlfVwiPlNhdmU8L2J1dHRvbj4gLVxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1vcGVuXCIgZGlzYWJsZWQ9eyRzb3VyY2Uub3BlbkRpc2FibGVkfSBvbjpjbGljaz1cIntidG5PcGVufVwiPk9wZW48L2J1dHRvbj5cbiAgPC9kaXY+XG57L2lmfVxuPC9kaXY+XG5cbjxzdHlsZT5cbi5maWxlLXBhdGgge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGZvbnQtZmFtaWx5OiBhdXRvO1xuICBmb250LXNpemU6IDAuOWVtO1xuICBjb2xvcjogYmx1ZTtcbn1cbi5idG4tY29udGFpbmVyIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBtYXJnaW4tdG9wOiAtMXB4O1xuICBwYWRkaW5nLXJpZ2h0OiA0cHg7XG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XG4gIHJpZ2h0OiAwO1xuICB6LWluZGV4OiA1O1xuICB0b3A6IC0ycHg7XG59XG4uYnRuLWNvbnRhaW5lciBidXR0b24ge1xuICBmb250LXNpemU6IDEwcHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbjpkaXNhYmxlZCB7XG4gIGN1cnNvcjogYXV0bztcbn1cbi50bGIge1xuICBib3JkZXI6IG5vbmU7XG59XG48L3N0eWxlPiIsImV4cG9ydCBjb25zdCBjZmcgPSAge1xuICBsYW5ndWFnZTogJ2phdmFzY3JpcHQnLFxuICAvLyB0aGVtZTogXCJ2cy1kYXJrXCIsXG4gIG1pbmltYXA6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgfSxcbiAgdmFsdWU6ICcnLFxuICBmb250RmFtaWx5OiBbJ0Nhc2NhZGlhIENvZGUnLCAnQ29uc29sYXMnLCAnQ291cmllciBOZXcnLCAnbW9ub3NwYWNlJ10sXG4gIGZvbnRMaWdhdHVyZXM6IHRydWUsXG4gIGZvbnRTaXplOiAxMVxufVxuXG5leHBvcnQgY29uc3QgcmVzaXplID0gZWRpdG9yID0+IHtcbiAgcmV0dXJuIGVudHJpZXMgPT4ge1xuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGVudHJpZXNbMF0uY29udGVudFJlY3RcbiAgICBlZGl0b3IubGF5b3V0KHt3aWR0aCwgaGVpZ2h0fSlcbiAgfSAgXG59XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbiAgaW1wb3J0IHsgY2ZnLCByZXNpemUgfSBmcm9tICcuLi9tb25hY28vaW5pdCc7XG5cbiAgZXhwb3J0IGxldCBvbkNoYW5nZTtcblxuICBvbk1vdW50KGFzeW5jICgpID0+IHtcbiAgICBmdW5jdGlvbiBpbml0Q29kZUVkaXRvcihzcmMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkIG1vbmFjbzogcm91dGUnKVxuICAgICAgY29uc3QgZWxlbWVudCA9IHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9uYWNvJyk7XG4gICAgICBjb25zdCBfcm91dGUgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKGVsZW1lbnQsIGNmZyk7XG4gICAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoX3JvdXRlKSlcbiAgICAgIHJvLm9ic2VydmUoZWxlbWVudCk7XG5cbiAgICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcm91dGUgPSBfcm91dGU7XG4gICAgICB3aW5kb3cubWl0bS5lZGl0b3IuX3JvdXRlRWwgPSBlbGVtZW50O1xuXG4gICAgICBfcm91dGUub25EaWRDaGFuZ2VNb2RlbENvbnRlbnQob25DaGFuZ2UpO1xuICAgICAgX3JvdXRlLnNldFZhbHVlKHNyYyk7XG4gICAgfVxuICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcm91dGVFZGl0ID0gaW5pdENvZGVFZGl0b3I7XG4gIH0pO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJlZGl0LWNvbnRhaW5lclwiPlxuICA8ZGl2IGlkPVwibW9uYWNvXCI+XG4gIDwvZGl2PlxuPC9kaXY+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5leHBvcnQgbGV0IGl0ZW07XG5leHBvcnQgbGV0IG9uQ2hhbmdlO1xuXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xuICBsZXQge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlLCBfcm91dGVFZGl0IH0sIGZpbGVzIH0gPSBtaXRtO1xuICBjb25zdCB1cmwgPSBtaXRtLnJvdXRlc1tpdGVtXS51cmw7XG4gIGNvbnN0IG9iaiA9IGZpbGVzLnJvdXRlW2l0ZW1dO1xuICBjb25zb2xlLmxvZyhpdGVtLCBvYmopO1xuXG4gIGlmIChfcm91dGU9PT11bmRlZmluZWQpIHtcbiAgICBfcm91dGVFZGl0KG9iai5jb250ZW50KVxuICB9IGVsc2Uge1xuICAgIF9yb3V0ZS5zZXRWYWx1ZShvYmouY29udGVudCB8fCAnJyk7XG4gICAgX3JvdXRlLnJldmVhbExpbmUoMSk7XG4gIH1cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgb25DaGFuZ2UoZmFsc2UpO1xuXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLm4sXG4gICAgICAgIGdvRGlzYWJsZWQ6ICh1cmw9PT11bmRlZmluZWQpLFxuICAgICAgICBjb250ZW50OiBvYmouY29udGVudCxcbiAgICAgICAgZnBhdGg6IG9iai5mcGF0aCxcbiAgICAgICAgcGF0aDogb2JqLnBhdGgsXG4gICAgICAgIGl0ZW0sXG4gICAgICB9XG4gICAgfSwgMSk7XG4gIH0pXG59XG48L3NjcmlwdD5cblxuPHRyIGNsYXNzPVwidHJcIj5cbiAgPHRkPlxuICAgIDxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskc291cmNlLnBhdGg9PT1pdGVtLnBhdGh9XCJcbiAgICAgIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxuICAgICAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXG4gICAgPntpdGVtLnRpdGxlfTwvZGl2PlxuICA8L3RkPlxuPC90cj5cblxuPHN0eWxlPlxuLnRkLWl0ZW06aG92ZXIge1xuICBjb2xvcjogYmx1ZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbn1cbnRkIHtcbiAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICNjMGQ4Y2NhMTtcbn1cbi50ZC1pdGVtLFxuLnRkLXNob3cge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDAuMXJlbTtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIHBhZGRpbmctbGVmdDogNXB4OyAgXG59XG4udGQtaXRlbS50cnVlIHtcbiAgY29sb3I6IGJsdWU7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5leHBvcnQgbGV0IG9uQ2hhbmdlO1xuXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xuXG5sZXQgcmVyZW5kZXIgPSAwO1xubGV0IGRhdGEgPSBbXTtcblxuJDogX2RhdGEgPSBkYXRhO1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc29sZS53YXJuKCdvbk1vdW50IHJvdXRlJyk7XG4gIF93c19jb25uZWN0LnJvdXRlT25Nb3VudCA9ICgpID0+IHdzX19zZW5kKCdnZXRSb3V0ZScsICcnLCByb3V0ZUhhbmRsZXIpO1xufSk7XG5cbmNvbnN0IHJvdXRlSGFuZGxlciA9IG9iaiA9PiB7XG4gIGNvbnNvbGUud2Fybignd3NfX3NlbmQoZ2V0Um91dGUpJywgb2JqKTtcbiAgaWYgKG9iai5fdGFnc18pIHtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzEgPSBvYmouX3RhZ3NfLl9fdGFnMTtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzIgPSBvYmouX3RhZ3NfLl9fdGFnMjtcbiAgICB3aW5kb3cubWl0bS5fX3RhZzMgPSBvYmouX3RhZ3NfLl9fdGFnMztcbiAgICB3aW5kb3cubWl0bS5fX3RhZzQgPSBvYmouX3RhZ3NfLl9fdGFnNDtcbiAgfVxuICBpZiAod2luZG93Lm1pdG0uZmlsZXMucm91dGU9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG9iai5yb3V0ZXM7XG4gICAgZGF0YSA9IG9iai5yb3V0ZXM7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qge3JvdXRlfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld1JvdXRlID0ge307XG4gICAgY29uc3Qge3JvdXRlc30gPSBvYmo7XG4gICAgZm9yIChsZXQgayBpbiByb3V0ZXMpIHtcbiAgICAgIG5ld1JvdXRlW2tdID0gcm91dGVba10gPyByb3V0ZVtrXSA6IHJvdXRlc1trXTtcbiAgICAgIG5ld1JvdXRlW2tdLmNvbnRlbnQgPSByb3V0ZXNba10uY29udGVudDtcbiAgICB9XG4gICAgZGF0YSA9IG5ld1JvdXRlO1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlID0gbmV3Um91dGVcbiAgfVxuICAvKipcbiAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRSb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XG4gICAqL1xuICBjb25zdCB7Z2V0Um91dGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICBmb3IgKGxldCBrZXkgaW4gZ2V0Um91dGVfZXZlbnRzKSB7XG4gICAgZ2V0Um91dGVfZXZlbnRzW2tleV0oZGF0YSk7XG4gIH1cbiAgcmVyZW5kZXIgPSByZXJlbmRlciArIDE7XG59XG5cbndpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cy5yb3V0ZVRhYmxlID0gKCkgPT4ge1xuICBjb25zb2xlLmxvZygncm91dGVUYWJsZSBnZXR0aW5nIGNhbGxlZCEhIScpO1xuICB3aW5kb3cud3NfX3NlbmQoJ2dldFJvdXRlJywgJycsIHJvdXRlSGFuZGxlcik7XG59XG48L3NjcmlwdD5cblxueyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSB7b25DaGFuZ2V9Lz5cbnsvZWFjaH1cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuaW1wb3J0IFZCb3gyIGZyb20gJy4uL2JveC9WQm94Mi5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IEVkaXRvciBmcm9tICcuL0VkaXRvci5zdmVsdGUnO1xuaW1wb3J0IExpc3QgZnJvbSAnLi9MaXN0LnN2ZWx0ZSc7XG5cbmxldCBsZWZ0ID0gMTY1O1xuY29uc3QgdG9wID0gJzQ3JztcbmNvbnN0IHRpdGxlID0gJy1Sb3V0ZShzKS0nIFxuY29uc3QgaWQgPSAncm91dGVMZWZ0Jztcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XG4gICAgb3B0W2lkXSAmJiAobGVmdCA9IG9wdFtpZF0pXG4gIH0pO1xufSk7XG5cbmZ1bmN0aW9uIGRyYWdlbmQoe2RldGFpbH0pIHtcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XG4gIGNvbnN0IGRhdGEgPSB7fVxuICBkYXRhW2lkXSA9IGxlZnRcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXG59XG5cbmxldCBfdGltZW91dCA9IG51bGw7XG5mdW5jdGlvbiBvbkNoYW5nZShlKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9yb3V0ZSB9fSA9IHdpbmRvdy5taXRtO1xuICBsZXQgc2F2ZURpc2FibGVkO1xuICBpZiAoZT09PWZhbHNlKSB7XG4gICAgc2F2ZURpc2FibGVkID0gdHJ1ZTtcbiAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7XG4gICAgICAuLi5uLFxuICAgICAgc2F2ZURpc2FibGVkOiB0cnVlLFxuICAgICAgZWRpdGJ1ZmZlcjogX3JvdXRlLmdldFZhbHVlKClcbiAgICB9fSlcbiAgfVxuICBfdGltZW91dCAmJiBjbGVhclRpbWVvdXQoX3RpbWVvdXQpO1xuICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmIChfcm91dGUpe1xuICAgICAgc2F2ZURpc2FibGVkID0gKF9yb3V0ZS5nZXRWYWx1ZSgpPT09JHNvdXJjZS5lZGl0YnVmZmVyKVxuICAgICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBzYXZlRGlzYWJsZWRcbiAgICAgIH19KTtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH1cbiAgfSwgNTAwKSAgXG59XG48L3NjcmlwdD5cblxuPEJ1dHRvbi8+XG48VkJveDIge3RpdGxlfSB7dG9wfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fSBwcm9wcz17e29uQ2hhbmdlfX0+XG4gIDxFZGl0b3Ige29uQ2hhbmdlfS8+XG48L1ZCb3gyPlxuIiwiLy8gZmVhdDogcHJvZmlsZVxuaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG5cbmV4cG9ydCBjb25zdCBzb3VyY2UgPSB3cml0YWJsZSh7XG4gIG9wZW5EaXNhYmxlZDogZmFsc2UsXG4gIHNhdmVEaXNhYmxlZDogdHJ1ZSxcbiAgZ29EaXNhYmxlZDogdHJ1ZSxcbiAgY29udGVudDogJycsXG4gIGZwYXRoOiAnJyxcbiAgcGF0aDogJydcbn0pXG4iLCI8c2NyaXB0Pi8vIGZlYXQ6IHByb2ZpbGVcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gYnRuTWluKCkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xuICBfcHJvZmlsZSAmJiBfcHJvZmlsZS50cmlnZ2VyKCdmb2xkJywgJ2VkaXRvci5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blBsdXMoKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlIH19ID0gd2luZG93Lm1pdG07XG4gIF9wcm9maWxlICYmIF9wcm9maWxlLnRyaWdnZXIoJ3VuZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xuICBpZiAoX3Byb2ZpbGUpIHtcbiAgICBjb25zdCBjb250ZW50ID0gX3Byb2ZpbGUuZ2V0VmFsdWUoKVxuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBjb250ZW50LFxuICAgICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXG4gICAgICAgIGVkaXRidWZmZXI6IGNvbnRlbnRcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xuICAgIHdzX19zZW5kKCdzYXZlUHJvZmlsZScsICRzb3VyY2UsIGRhdGEgPT4ge1xuICAgICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4gey4uLm4sIHNhdmVEaXNhYmxlZDogdHJ1ZX19KTtcbiAgICAgIGNvbnNvbGUubG9nKCdEb25lIFNhdmUhJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnRuT3BlbigpIHtcbiAgY29uc29sZS5sb2coJHNvdXJjZSk7XG4gIHdzX19zZW5kKCdvcGVuRm9sZGVyJywgJHNvdXJjZSwgZGF0YSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0RvbmUgT3BlbiEnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bnMoaWQpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1tpZF07XG4gIGlmIChyb3V0ZSAmJiByb3V0ZS51cmxzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJvdXRlLnVybHMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidG5VcmwoaWQpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xuICAgIHJldHVybiByb3V0ZS51cmxzW2lkXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnRuVGFnKGUpIHtcbiAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IGUudGFyZ2V0LmRhdGFzZXQudXJsfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bkdvKGUpIHtcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xuICBpZiAocm91dGUgJiYgcm91dGUudXJsKSB7XG4gICAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IHJvdXRlLnVybH0pO1xuICB9XG59XG48L3NjcmlwdD5cblxueyNpZiAkc291cmNlLnBhdGh9XG5cdDxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIHsjZWFjaCBidG5zKCRzb3VyY2UuaXRlbSkgYXMgaXRlbX1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5UYWd9XCJcbiAgZGF0YS11cmw9XCJ7YnRuVXJsKGl0ZW0pfVwiPntpdGVtfTwvYnV0dG9uPlxuICB7L2VhY2h9XG4gIDwhLS0gPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBkaXNhYmxlZD17JHNvdXJjZS5nb0Rpc2FibGVkfSBvbjpjbGljaz1cIntidG5Hb31cIj5HbzwvYnV0dG9uPi4gLS0+XG4gIDwvZGl2Plxuey9pZn1cbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cblBhdGg6eyRzb3VyY2UucGF0aH1cbnsjaWYgJHNvdXJjZS5wYXRofVxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tcGx1c1wiIG9uOmNsaWNrPVwie2J0blBsdXN9XCI+WysrXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXNhdmVcIiBkaXNhYmxlZD17JHNvdXJjZS5zYXZlRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0blNhdmV9XCI+U2F2ZTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLW9wZW5cIiBkaXNhYmxlZD17JHNvdXJjZS5vcGVuRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bk9wZW59XCI+T3BlbjwvYnV0dG9uPlxuICA8L2Rpdj5cbnsvaWZ9XG48L2Rpdj5cblxuPHN0eWxlPlxuLmZpbGUtcGF0aCB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgZm9udC1mYW1pbHk6IGF1dG87XG4gIGZvbnQtc2l6ZTogMC45ZW07XG4gIGNvbG9yOiBibHVlO1xufVxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG4gIGltcG9ydCB7IGNmZywgcmVzaXplIH0gZnJvbSAnLi4vbW9uYWNvL2luaXQnO1xuXG4gIGV4cG9ydCBsZXQgb25DaGFuZ2U7XG5cbiAgb25Nb3VudChhc3luYyAoKSA9PiB7XG4gICAgZnVuY3Rpb24gaW5pdENvZGVFZGl0b3Ioc3JjKSB7XG4gICAgICBjb25zb2xlLmxvZygnbG9hZCBtb25hY286IHByb2ZpbGUnKVxuICAgICAgY29uc3QgZWxlbWVudCA9IHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZmlsZScpO1xuICAgICAgY29uc3QgX3Byb2ZpbGUgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKGVsZW1lbnQsIGNmZyk7XG4gICAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoX3Byb2ZpbGUpKVxuICAgICAgcm8ub2JzZXJ2ZShlbGVtZW50KTtcblxuICAgICAgd2luZG93Lm1pdG0uZWRpdG9yLl9wcm9maWxlID0gX3Byb2ZpbGU7XG4gICAgICB3aW5kb3cubWl0bS5lZGl0b3IuX3Byb2ZpbGVFbCA9IGVsZW1lbnQ7XG5cbiAgICAgIF9wcm9maWxlLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KG9uQ2hhbmdlKTtcbiAgICAgIF9wcm9maWxlLnNldFZhbHVlKHNyYyk7XG4gICAgfVxuICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVkaXQgPSBpbml0Q29kZUVkaXRvcjtcbiAgfSk7XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImVkaXQtY29udGFpbmVyXCI+XG4gIDxkaXYgaWQ9XCJwcm9maWxlXCI+XG4gIDwvZGl2PlxuPC9kaXY+XG4iLCI8c2NyaXB0PiAvLyBmZWF0OiBwcm9maWxlXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5cbmV4cG9ydCBsZXQgaXRlbTtcbmV4cG9ydCBsZXQgb25DaGFuZ2U7XG5cbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XG4gIGxldCB7aXRlbX0gPSBlLnRhcmdldC5kYXRhc2V0O1xuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSwgX3Byb2ZpbGVFZGl0IH0sIGZpbGVzIH0gPSBtaXRtO1xuICBjb25zdCBvYmogPSBmaWxlcy5wcm9maWxlW2l0ZW1dO1xuICBjb25zdCB1cmwgPSBpdGVtO1xuICBjb25zb2xlLmxvZyhpdGVtLCBvYmopO1xuXG4gIGlmIChfcHJvZmlsZT09PXVuZGVmaW5lZCkge1xuICAgIF9wcm9maWxlRWRpdChvYmouY29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgX3Byb2ZpbGUuc2V0VmFsdWUob2JqLmNvbnRlbnQgfHwgJycpO1xuICAgIF9wcm9maWxlLnJldmVhbExpbmUoMSk7XG4gIH1cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgb25DaGFuZ2UoZmFsc2UpO1xuXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLm4sXG4gICAgICAgIGdvRGlzYWJsZWQ6ICh1cmw9PT11bmRlZmluZWQpLFxuICAgICAgICBjb250ZW50OiBvYmouY29udGVudCxcbiAgICAgICAgZnBhdGg6IG9iai5mcGF0aCxcbiAgICAgICAgcGF0aDogb2JqLnBhdGgsXG4gICAgICAgIGl0ZW0sXG4gICAgICB9XG4gICAgfSk7XG4gIH0sIDEpO1xufVxuPC9zY3JpcHQ+XG5cbjx0ciBjbGFzcz1cInRyXCI+XG4gIDx0ZD5cbiAgICA8ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5mcGF0aD09PWl0ZW0uZnBhdGh9XCJcbiAgICAgIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxuICAgICAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXG4gICAgPntpdGVtLnRpdGxlfTwvZGl2PlxuICA8L3RkPlxuPC90cj5cblxuPHN0eWxlPlxuLnRkLWl0ZW06aG92ZXIge1xuICBjb2xvcjogYmx1ZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbn1cbnRkIHtcbiAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICNjMGQ4Y2NhMTtcbn1cbi50ZC1pdGVtLFxuLnRkLXNob3cge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDAuMXJlbTtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIHBhZGRpbmctbGVmdDogNXB4OyAgXG59XG4udGQtaXRlbS50cnVlIHtcbiAgY29sb3I6IGJsdWU7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5leHBvcnQgbGV0IG9uQ2hhbmdlO1xuXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xuXG5sZXQgcmVyZW5kZXIgPSAwO1xubGV0IGRhdGEgPSBbXTtcblxuJDogX2RhdGEgPSBkYXRhO1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY29uc29sZS53YXJuKCdvbk1vdW50IHByb2ZpbGUnKTtcbiAgX3dzX2Nvbm5lY3QucHJvZmlsZU9uTW91bnQgPSAoKSA9PiB3c19fc2VuZCgnZ2V0UHJvZmlsZScsICcnLCBwcm9maWxlSGFuZGxlcik7XG59KTtcblxuY29uc3QgcHJvZmlsZUhhbmRsZXIgPSBvYmogPT4ge1xuICBjb25zb2xlLndhcm4oJ3dzX19zZW5kKGdldFByb2ZpbGUpJywgb2JqKTtcbiAgaWYgKHdpbmRvdy5taXRtLmZpbGVzLnByb2ZpbGU9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlID0gb2JqO1xuICAgIGRhdGEgPSBvYmo7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qge3Byb2ZpbGV9ID0gd2luZG93Lm1pdG0uZmlsZXM7XG4gICAgY29uc3QgbmV3cHJvZmlsZSA9IHt9O1xuICAgIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgICBuZXdwcm9maWxlW2tdID0gcHJvZmlsZVtrXSA/IHByb2ZpbGVba10gOiBvYmpba107XG4gICAgICBuZXdwcm9maWxlW2tdLmNvbnRlbnQgPSBvYmpba10uY29udGVudDtcbiAgICB9XG4gICAgZGF0YSA9IG5ld3Byb2ZpbGU7XG4gICAgd2luZG93Lm1pdG0uZmlsZXMucHJvZmlsZSA9IG5ld3Byb2ZpbGVcbiAgfVxuICAvKipcbiAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRQcm9maWxlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cbiAgICovXG4gIGNvbnN0IHtnZXRQcm9maWxlX2V2ZW50c30gPSB3aW5kb3cubWl0bS5maWxlcztcbiAgZm9yIChsZXQga2V5IGluIGdldFByb2ZpbGVfZXZlbnRzKSB7XG4gICAgZ2V0UHJvZmlsZV9ldmVudHNba2V5XShkYXRhKTtcbiAgfVxuICByZXJlbmRlciA9IHJlcmVuZGVyICsgMTtcbn1cblxud2luZG93Lm1pdG0uZmlsZXMucHJvZmlsZV9ldmVudHMucHJvZmlsZVRhYmxlID0gKCkgPT4ge1xuICBjb25zb2xlLmxvZygncHJvZmlsZVRhYmxlIGdldHRpbmcgY2FsbGVkISEhJyk7XG4gIHdpbmRvdy53c19fc2VuZCgnZ2V0UHJvZmlsZScsICcnLCBwcm9maWxlSGFuZGxlcik7XG59XG48L3NjcmlwdD5cblxueyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxuICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSB7b25DaGFuZ2V9Lz5cbnsvZWFjaH1cbiIsIjxzY3JpcHQ+IC8vIGZlYXQ6IHByb2ZpbGVcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XG5pbXBvcnQgQnV0dG9uIGZyb20gJy4vQnV0dG9uLnN2ZWx0ZSc7XG5pbXBvcnQgRWRpdG9yIGZyb20gJy4vRWRpdG9yLnN2ZWx0ZSc7XG5pbXBvcnQgTGlzdCBmcm9tICcuL0xpc3Quc3ZlbHRlJztcblxubGV0IGxlZnQgPSAxNjU7XG5jb25zdCB0b3AgPSAnNDcnO1xuY29uc3QgdGl0bGUgPSAnLVByb2ZpbGUocyktJyBcbmNvbnN0IGlkID0gJ3Byb2ZpbGVMZWZ0Jztcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XG4gICAgb3B0W2lkXSAmJiAobGVmdCA9IG9wdFtpZF0pXG4gIH0pO1xufSk7XG5cbmZ1bmN0aW9uIGRyYWdlbmQoe2RldGFpbH0pIHtcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XG4gIGNvbnN0IGRhdGEgPSB7fVxuICBkYXRhW2lkXSA9IGxlZnRcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXG59XG5cbmxldCBfdGltZW91dCA9IG51bGw7XG5mdW5jdGlvbiBvbkNoYW5nZShlKSB7XG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlIH19ID0gd2luZG93Lm1pdG07XG4gIGxldCBzYXZlRGlzYWJsZWQ7XG4gIGlmIChlPT09ZmFsc2UpIHtcbiAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7XG4gICAgICAuLi5uLFxuICAgICAgc2F2ZURpc2FibGVkOiB0cnVlLFxuICAgICAgZWRpdGJ1ZmZlcjogX3Byb2ZpbGUuZ2V0VmFsdWUoKVxuICAgIH19KVxuICAgIFxuICB9XG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XG4gIF90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKF9wcm9maWxlKXtcbiAgICAgIHNhdmVEaXNhYmxlZCA9IChfcHJvZmlsZS5nZXRWYWx1ZSgpPT09JHNvdXJjZS5lZGl0YnVmZmVyKVxuICAgICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBzYXZlRGlzYWJsZWRcbiAgICAgIH19KTtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH1cbiAgfSwgNTAwKSAgXG59XG48L3NjcmlwdD5cblxuPEJ1dHRvbi8+XG48VkJveDIge3RpdGxlfSB7dG9wfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fSBwcm9wcz17e29uQ2hhbmdlfX0+XG4gIDxFZGl0b3Ige29uQ2hhbmdlfS8+XG48L1ZCb3gyPlxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG5cbmV4cG9ydCBjb25zdCBsb2dzdG9yZSA9IHdyaXRhYmxlKHtcbiAgcmVzcEhlYWRlcjoge30sXG4gIHJlc3BvbnNlOiAnJyxcbiAgaGVhZGVyczogJycsXG4gIGxvZ2lkOiAnJyxcbiAgdGl0bGU6ICcnLFxuICBwYXRoOiAnJyxcbiAgdXJsOiAnJyxcbiAgZXh0OiAnJ1xufSlcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuXG5leHBvcnQgY29uc3QgY2xpZW50ID0gd3JpdGFibGUoe1xuICAuLi53aW5kb3cubWl0bS5jbGllbnRcbn0pXG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSAnLi4vb3RoZXIvc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gYnRuQ2xlYXIoZSkge1xuICB3c19fc2VuZCgnY2xlYXJMb2dzJywge2Jyb3dzZXJOYW1lOiAnY2hyb21pdW0nfSwgZGF0YSA9PiB7XG4gICAgLy8gbG9ncyB2aWV3IHdpbGwgYmUgY2xvc2Ugd2hlbiAubG9nX2V2ZW50cy5Mb2dzVGFibGVcbiAgICAvLyBsb2dzdG9yZS5zZXQoKSB0byBlbXB0eSBvbiBUYWJsZS5zdmVsdGUgXG4gICAgd2luZG93Lm1pdG0uY2xpZW50LmNsZWFyID0gdHJ1ZTtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBDbGVhciEnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvb2dsZShwcm9wKSB7XG4gIGNsaWVudC51cGRhdGUobiA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLiRjbGllbnQsXG4gICAgICAuLi5wcm9wLFxuICAgIH1cbiAgfSk7XG4gIGNvbnNvbGUubG9nKCRjbGllbnQpO1xuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywgey4uLnByb3B9LCBkYXRhID0+IHtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBjaGFuZ2Ugc3RhdGUnLCBkYXRhKTtcbiAgICB3aW5kb3cubWl0bS5jbGllbnQgPSBkYXRhO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gYnRuSG9zdHN3Y2goZSkge1xuICB0b29nbGUoe25vaG9zdGxvZ3M6ICFlLnRhcmdldC5jaGVja2VkfSk7XG59XG5cbmZ1bmN0aW9uIGJ0bkFyZ3N3Y2goZSkge1xuICB0b29nbGUoe25vYXJnbG9nczogIWUudGFyZ2V0LmNoZWNrZWR9KTtcbn1cblxuZnVuY3Rpb24gaG9zdGZsYWcoKSB7XG4gIHJldHVybiAhd2luZG93Lm1pdG0uY2xpZW50Lm5vaG9zdGxvZ3M7XG59XG5mdW5jdGlvbiBhcmdzZmxhZygpIHtcbiAgcmV0dXJuICF3aW5kb3cubWl0bS5jbGllbnQubm9hcmdsb2dzO1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCIgc3R5bGU9XCJ0b3A6IDFweDtcIj5cbiAgPGJ1dHRvbiBvbjpjbGljaz1cIntidG5DbGVhcn1cIj5cbiAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgdmlld0JveD1cIjAgMCA1MTIgNTEyXCI+XG4gICAgICA8cGF0aCBzdHlsZT1cImZpbGw6cmVkXCIgZD1cIk0yNTYgOEMxMTkuMDM0IDggOCAxMTkuMDMzIDggMjU2czExMS4wMzQgMjQ4IDI0OCAyNDggMjQ4LTExMS4wMzQgMjQ4LTI0OFMzOTIuOTY3IDggMjU2IDh6bTEzMC4xMDggMTE3Ljg5MmM2NS40NDggNjUuNDQ4IDcwIDE2NS40ODEgMjAuNjc3IDIzNS42MzdMMTUwLjQ3IDEwNS4yMTZjNzAuMjA0LTQ5LjM1NiAxNzAuMjI2LTQ0LjczNSAyMzUuNjM4IDIwLjY3NnpNMTI1Ljg5MiAzODYuMTA4Yy02NS40NDgtNjUuNDQ4LTcwLTE2NS40ODEtMjAuNjc3LTIzNS42MzdMMzYxLjUzIDQwNi43ODRjLTcwLjIwMyA0OS4zNTYtMTcwLjIyNiA0NC43MzYtMjM1LjYzOC0yMC42NzZ6XCIvPlxuICAgIDwvc3ZnPlxuICA8L2J1dHRvbj4gIFxuICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiPlxuICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuSG9zdHN3Y2h9IGNoZWNrZWQ9e2hvc3RmbGFnKCl9Pmhvc3RcbiAgPC9sYWJlbD5cbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0bkFyZ3N3Y2h9IGNoZWNrZWQ9e2FyZ3NmbGFnKCl9PmFyZ3NcbiAgPC9sYWJlbD5cbjwvZGl2PlxuXG48c3R5bGU+XG4uYnRuLWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbWFyZ2luLXRvcDogLTFweDtcbiAgbGVmdDogNDhweDtcbiAgdG9wOiAtM3B4O1xufVxuYnV0dG9uIHtcbiAgYm9yZGVyOiAwO1xuICB3aWR0aDogMjRweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuZXhwb3J0IGxldCBpdGVtO1xuXG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XG5cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICBsb2dzdG9yZS5zZXQoe1xuICAgIHJlc3BIZWFkZXI6IHt9LFxuICAgIHJlc3BvbnNlOiAnJyxcbiAgICBoZWFkZXJzOiAnJyxcbiAgICBsb2dpZDogJycsXG4gICAgdGl0bGU6ICcnLFxuICAgIHBhdGg6ICcnLFxuICAgIHVybDogJycsXG4gICAgZXh0OiAnJyxcbiAgfSlcbn1cblxuZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcbiAgbGV0IHtsb2dpZH0gPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldDtcbiAgaWYgKGxvZ2lkPT09JGxvZ3N0b3JlLmxvZ2lkKSB7XG4gICAgZW1wdHkoKTtcbiAgfSBlbHNlIHtcbiAgICBlbXB0eSgpO1xuICAgIGNvbnN0IG8gPSB3aW5kb3cubWl0bS5maWxlcy5sb2dbaXRlbS5rZXldW2xvZ2lkXTtcbiAgICBjb25zdCBzcmMgPSB7XG4gICAgICByZXNwSGVhZGVyOiBvLnJlc3BIZWFkZXIsXG4gICAgICByZXNwb25zZTogJzxlbXB0eT4nLFxuICAgICAgaGVhZGVyczogJzxlbXB0eT4nLFxuICAgICAgbG9naWQ6IGxvZ2lkLFxuICAgICAgdGl0bGU6IG8udGl0bGUsXG4gICAgICBwYXRoOiBvLnBhdGgsXG4gICAgICB1cmw6IGxvZ2lkLnJlcGxhY2UoL14uK1xcLm1pdG0tcGxheS8sJ2h0dHBzOi8vbG9jYWxob3N0OjMwMDEnKSxcbiAgICAgIGV4dDogby5leHQsXG4gICAgfVxuICAgIGlmIChvLnRpdGxlLm1hdGNoKCcucG5nJykpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBsb2dzdG9yZS51cGRhdGUobiA9PiBzcmMpXG4gICAgICB9LCAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd3NfX3NlbmQoJ2dldENvbnRlbnQnLCB7ZnBhdGg6IGxvZ2lkfSwgKHtoZWFkZXJzLCByZXNwb25zZSwgZXh0fSkgPT4ge1xuICAgICAgICBsb2dzdG9yZS51cGRhdGUobiA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLnNyYyxcbiAgICAgICAgICAgIHJlc3BvbnNlLFxuICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgIGV4dCxcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzdGF0dXMoe2dlbmVyYWw6Z30pIHtcbiAgcmV0dXJuIGBfJHtNYXRoLnRydW5jKGcuc3RhdHVzLzEwMCl9YDtcbn1cblxuZnVuY3Rpb24gbWV0aG9kKHtnZW5lcmFsOmd9KSB7XG4gIHJldHVybiBgJHtnLm1ldGhvZC50b0xvd2VyQ2FzZSgpfWA7XG59XG5mdW5jdGlvbiBtZXRob2QyKHtnZW5lcmFsOmd9KSB7XG4gIHJldHVybiBnLm1ldGhvZC50b0xvd2VyQ2FzZSgpICsgKGcuZXh0ID8gYDwke2cuZXh0fT4gYCA6ICcnKTtcbn1cbmZ1bmN0aW9uIHVybCh7Z2VuZXJhbDpnfSkge1xuICBsZXQgbXNnXG4gIGlmIChnLnVybC5tYXRjaCgnL2xvZy8nKSkge1xuICAgIG1zZyA9IGcudXJsLnNwbGl0KCdAJylbMV07XG4gIH0gZWxzZSBpZiAoJGNsaWVudC5ub2hvc3Rsb2dzKSB7XG4gICAgbXNnID0gZy5wYXRoO1xuICB9IGVsc2Uge1xuICAgIG1zZyA9IGAke2cudXJsLnNwbGl0KCc/JylbMF19YDtcbiAgfVxuICBpZiAoJGNsaWVudC5ub2hvc3Rsb2dzICYmIGcuZXh0PT09JycpIHtcbiAgICBjb25zdCBbYTEsYTJdID0gbXNnLnNwbGl0KCctLScpO1xuICAgIG1zZyA9IGEyIHx8IGExO1xuICB9XG4gIHJldHVybiBtc2c7XG59XG5mdW5jdGlvbiBwdGgoe2dlbmVyYWw6Z30pIHtcbiAgaWYgKCRjbGllbnQubm9hcmdsb2dzIHx8IGcudXJsLm1hdGNoKCcvbG9nLycpKSB7XG4gICAgcmV0dXJuICcnO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHBhcm1zID0gZy51cmwuc3BsaXQoJz8nKVsxXTtcbiAgICByZXR1cm4gcGFybXMgPyBgPyR7cGFybXN9YCA6ICcnO1xuICB9XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInRkLWl0ZW0geyRsb2dzdG9yZS5sb2dpZD09PWl0ZW0ubG9naWR9XCJcbmRhdGEtbG9naWQ9e2l0ZW0ubG9naWR9XG5vbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcbj5cbiAgPHNwYW4gY2xhc3M9XCJzdGF0dXMge3N0YXR1cyhpdGVtKX1cIj57aXRlbS5nZW5lcmFsLnN0YXR1c308L3NwYW4+IFxuICA8c3BhbiBjbGFzcz1cIm1ldGhvZCB7bWV0aG9kKGl0ZW0pfVwiPnttZXRob2QyKGl0ZW0pfTwvc3Bhbj4gXG4gIDxzcGFuIGNsYXNzPVwidXJsXCI+e3VybChpdGVtKX08L3NwYW4+IFxuICA8c3BhbiBjbGFzcz1cInBybVwiPntwdGgoaXRlbSl9PC9zcGFuPiBcbjwvZGl2PlxuXG48c3R5bGU+XG4udGQtaXRlbTpob3ZlciB7XG4gIGNvbG9yOiBibHVlO1xuICBiYWNrZ3JvdW5kOiB5ZWxsb3dcbiAgLyogZm9udC13ZWlnaHQ6IGJvbGRlcjsgKi9cbn1cbnRkIHtcbiAgYm9yZGVyLWJvdHRvbTogM3B4IHNvbGlkICNjMGQ4Y2NhMTtcbiAgZm9udC1mYW1pbHk6ICdHaWxsIFNhbnMnLCAnR2lsbCBTYW5zIE1UJywgQ2FsaWJyaSwgJ1RyZWJ1Y2hldCBNUycsIHNhbnMtc2VyaWY7XG59XG4udGQtaXRlbSxcbi50ZC1zaG93IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAwLjFyZW07XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBwYWRkaW5nLWxlZnQ6IDVweDtcbn1cbi50ZC1pdGVtLnRydWUge1xuICBjb2xvcjogYmx1ZTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xufVxuLnN0YXR1cyB7XG4gIGNvbG9yOiBncmVlbjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG4uc3RhdHVzLl80LFxuLnN0YXR1cy5fNSB7XG4gIGNvbG9yOiByZWQ7XG59XG4ubWV0aG9kIHtcbiAgY29sb3I6IGdyZWVuO1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cbi5tZXRob2QucHV0IHtcbiAgY29sb3I6ICM3ZTI2YTc7XG59XG4ubWV0aG9kLnBvc3Qge1xuICBjb2xvcjogI2E3MjY3Zjtcbn1cbi5tZXRob2QuZGVsZXRlIHtcbiAgY29sb3I6IHJlZDtcbn1cbi5wcm0ge1xuICBjb2xvcjogI2NjYjdiNztcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XG5cbmxldCByZXJlbmRlciA9IDA7XG5sZXQgZGF0YSA9IFtdO1xuXG4kOiBfZGF0YSA9IGRhdGE7XG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncycpO1xuICBfd3NfY29ubmVjdC5sb2dPbk1vdW50ID0gKCkgPT4gd3NfX3NlbmQoJ2dldExvZycsICcnLCBsb2dIYW5kbGVyKTtcbn0pO1xuXG5jb25zdCBsb2dIYW5kbGVyID0gb2JqID0+IHtcbiAgY29uc29sZS53YXJuKCd3c19fc2VuZChnZXRMb2cpJywgb2JqKTtcbiAgaWYgKCB3aW5kb3cubWl0bS5jbGllbnQuY2xlYXIpIHtcbiAgICBkZWxldGUgd2luZG93Lm1pdG0uY2xpZW50LmNsZWFyO1xuICAgIGxvZ3N0b3JlLnNldCh7XG4gICAgICByZXNwSGVhZGVyOiB7fSxcbiAgICAgIHJlc3BvbnNlOiAnJyxcbiAgICAgIGhlYWRlcnM6ICcnLFxuICAgICAgbG9naWQ6ICcnLFxuICAgICAgdGl0bGU6ICcnLFxuICAgICAgcGF0aDogJycsXG4gICAgICB1cmw6ICcnLFxuICAgICAgZXh0OiAnJyxcbiAgICB9KVxuICB9XG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5sb2c9PT11bmRlZmluZWQpIHtcbiAgICB3aW5kb3cubWl0bS5maWxlcy5sb2cgPSBvYmo7XG4gICAgZGF0YSA9IG9iajtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB7bG9nfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld0xvZyA9IHt9O1xuICAgIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgICBuZXdMb2dba10gPSBvYmpba107XG4gICAgfVxuICAgIGRhdGEgPSBuZXdMb2c7XG4gICAgd2luZG93Lm1pdG0uZmlsZXMubG9nID0gbmV3TG9nXG4gIH1cbn1cblxud2luZG93Lm1pdG0uZmlsZXMubG9nX2V2ZW50cy5Mb2dzVGFibGUgPSAoKSA9PiB7XG4gIHdzX19zZW5kKCdnZXRMb2cnLCAnJywgbG9nSGFuZGxlcilcbn1cblxuZnVuY3Rpb24gbm9ob3N0bG9ncyhmbGFnKSB7XG4gIGNvbnNvbGUubG9nKCdub2hvc3Rsb2dzJywgZmxhZyk7XG59XG5cbi8vIGZ1bmN0aW9uIHRpdGxlKGtleSwgaSkge1xuLy8gICBjb25zdCBicm93c2VyID0ga2V5LnNwbGl0KCd+JylbMF1cbi8vICAgY29uc3QgY291bnQgPSBgJHtpfWAucGFkU3RhcnQoMiwgJzAnKVxuLy8gICByZXR1cm4gYCR7YnJvd3Nlcn1+JHtjb3VudH1gXG4vLyB9XG48L3NjcmlwdD5cblxueyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBrZXksIGl9XG4gIDxkZXRhaWxzPjxzdW1tYXJ5PntAaHRtbCBrZXl9PC9zdW1tYXJ5PlxuICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGFba2V5XSkgYXMgbG9naWR9XG4gIDxJdGVtIGl0ZW09e3tcbiAgICBrZXksXG4gICAgbG9naWQsXG4gICAgLi4uX2RhdGFba2V5XVtsb2dpZF0sXG4gICAgbm9ob3N0bG9nczogJGNsaWVudC5ub2hvc3Rsb2dzLFxuICAgIH19Lz5cbiAgey9lYWNofVxuPC9kZXRhaWxzPiAgXG57L2VhY2h9XG5cbjxzdHlsZT5cbiAgc3VtbWFyeTpob3ZlciB7XG4gICAgYmFja2dyb3VuZDogI2VhZTRmMTtcbiAgfVxuPC9zdHlsZT4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcblxuZXhwb3J0IGNvbnN0IHRhYnN0b3JlID0gd3JpdGFibGUoe1xuICBlZGl0b3I6IHt9LFxuICB0YWI6IDBcbn0pXG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZnVuY3Rpb24gYnRuTWluKCkge1xuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xuICBjb25zdCBpZCA9IGBlZGl0b3Ike3RhYisxfWA7XG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IuZm9sZEFsbCcpO1xufVxuXG5mdW5jdGlvbiBidG5QbHVzKCkge1xuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xuICBjb25zdCBpZCA9IGBlZGl0b3Ike3RhYisxfWA7XG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XG59XG5cbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XG4gIGxldCBhcnIgPSAkbG9nc3RvcmUucGF0aC5zcGxpdCgnLycpXG4gIGFyci5wb3AoKTtcbiAgY29uc3QgcGF0aCA9IGFyci5qb2luKCcvJyk7XG4gIGNvbnNvbGUubG9nKHtwYXRofSk7XG4gIHdzX19zZW5kKCdvcGVuRm9sZGVyJywge3BhdGh9LCBkYXRhID0+IHtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBPcGVuIScpO1xuICB9KTtcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tcGx1c1wiIG9uOmNsaWNrPVwie2J0blBsdXN9XCI+WysrXTwvYnV0dG9uPiAtXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLW9wZW5cIiBvbjpjbGljaz1cIntidG5PcGVufVwiPk9wZW48L2J1dHRvbj5cbjwvZGl2PlxuXG48c3R5bGU+XG4uYnRuLWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbWFyZ2luLXRvcDogLTFweDtcbiAgcGFkZGluZy1yaWdodDogNHB4O1xuICBwYWRkaW5nLWJvdHRvbTogM3B4O1xuICByaWdodDogMDtcbiAgei1pbmRleDogNTtcbiAgdG9wOiAtMnB4O1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcbiAgZm9udC1zaXplOiAxMHB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG4uYnRuLWNvbnRhaW5lciBidXR0b246ZGlzYWJsZWQge1xuICBjdXJzb3I6IGF1dG87XG59XG4udGxiIHtcbiAgYm9yZGVyOiBub25lO1xufVxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgY2ZnLCByZXNpemUgfSBmcm9tICcuLi9tb25hY28vaW5pdCc7XG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBUYWIgfSBmcm9tICdzdmVsbWEnO1xuXG5jb25zdCBvcHRpb24gPSB7XG4gIC4uLmNmZyxcbiAgcmVhZE9ubHk6IHRydWUsXG4gIGNvbnRleHRtZW51OiBmYWxzZSxcbn1cblxubGV0IG5vZGUxO1xubGV0IG5vZGUyO1xubGV0IG5vZGUzO1xuXG5sZXQgZWRpdDE7XG5sZXQgZWRpdDI7XG5sZXQgZWRpdDM7XG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncyAtIEJhc2VUYWIuc3ZlbHRlJyk7XG4gIGNvbnNvbGUubG9nKCRsb2dzdG9yZSlcbiAgY29uc3QgZXh0ID0gJGxvZ3N0b3JlLmV4dD09PSdqcycgPyAnamF2YXNjcmlwdCcgOiAkbG9nc3RvcmUuZXh0XG4gIGNvbnN0IGhkcnMgPSBKU09OLnBhcnNlKCRsb2dzdG9yZS5oZWFkZXJzKTtcbiAgY29uc3QgY3NwMyA9IGhkcnMuQ1NQIHx8IHt9O1xuICBjb25zdCB2YWwxID0ge1xuICAgIC4uLm9wdGlvbixcbiAgICBsYW5ndWFnZTogJ2pzb24nLFxuICAgIHZhbHVlOiAkbG9nc3RvcmUuaGVhZGVycyxcbiAgfTtcbiAgY29uc3QgdmFsMiA9IHtcbiAgICAuLi5vcHRpb24sXG4gICAgbGFuZ3VhZ2U6IGV4dCxcbiAgICB2YWx1ZTogJGxvZ3N0b3JlLnJlc3BvbnNlLFxuICB9O1xuICBjb25zdCB2YWwzID0ge1xuICAgIC4uLm9wdGlvbixcbiAgICBsYW5ndWFnZTogJ2pzb24nLFxuICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeShjc3AzLCBudWxsLCAyKSxcbiAgfTtcbiAgY29uc3QgY3R5cGUgPSAkbG9nc3RvcmUucmVzcEhlYWRlcltcImNvbnRlbnQtdHlwZVwiXSB8fCAndGV4dC9wbGFpbic7XG4gIGlmIChjdHlwZS5tYXRjaCgnaHRtbCcpKSB7XG4gICAgdmFsMi52YWx1ZSA9IHZhbDIudmFsdWUuXG4gICAgcmVwbGFjZSgvXFxcXG5cXFxcbi9nLCAnJykuXG4gICAgcmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpLlxuICAgIHJlcGxhY2UoL1xcXFx0L2csICdcXHQnKS5cbiAgICByZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykuXG4gICAgcmVwbGFjZSgvXlwiLywgJycpLlxuICAgIHJlcGxhY2UoL1wiJC8sICcnKTtcbiAgICB2YWwyLmxhbmd1YWdlID0gJ2h0bWwnO1xuICB9XG5cbiAgbm9kZTEgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbzEnKTtcbiAgbm9kZTIgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbzInKTtcbiAgbm9kZTMgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbzMnKTtcblxuICBlZGl0MSA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUobm9kZTEsIHZhbDEpO1xuICBlZGl0MiA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUobm9kZTIsIHZhbDIpO1xuICBlZGl0MyA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUobm9kZTMsIHZhbDMpO1xuXG4gIGNvbnNvbGUubG9nKCdsb2FkIG1vbmFjbzogbG9ncyAxLDIsMycpXG4gIGNvbnN0IHJvMSA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoZWRpdDEpKTtcbiAgY29uc3Qgcm8yID0gbmV3IFJlc2l6ZU9ic2VydmVyKHJlc2l6ZShlZGl0MikpO1xuICBjb25zdCBybzMgPSBuZXcgUmVzaXplT2JzZXJ2ZXIocmVzaXplKGVkaXQzKSk7XG5cbiAgcm8xLm9ic2VydmUobm9kZTEpO1xuICBybzIub2JzZXJ2ZShub2RlMik7XG4gIHJvMy5vYnNlcnZlKG5vZGUzKTtcblxuICB0YWJzdG9yZS5zZXQoe1xuICAgIC4uLiR0YWJzdG9yZSxcbiAgICAgIGVkaXRvcjoge1xuICAgICAgICBlZGl0MSxcbiAgICAgICAgZWRpdDIsXG4gICAgICAgIGVkaXQzLFxuICAgICAgfSxcbiAgfSlcbn0pO1xuZnVuY3Rpb24gaXNDU1AoKSB7XG4gIGNvbnN0IGggPSAkbG9nc3RvcmUucmVzcEhlYWRlcjtcbiAgY29uc3QgY3NwID0gaFsnY29udGVudC1zZWN1cml0eS1wb2xpY3knXSB8fCBoWydjb250ZW50LXNlY3VyaXR5LXBvbGljeS1yZXBvcnQtb25seSddO1xuICByZXR1cm4gY3NwO1xufVxuPC9zY3JpcHQ+XG5cbjxUYWIgbGFiZWw9XCJIZWFkZXJzXCI+XG4gIDxkaXYgY2xhc3M9XCJ2aWV3LWNvbnRhaW5lclwiPlxuICAgIDxkaXYgaWQ9XCJtb25hY28xXCI+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9UYWI+XG48VGFiIGxhYmVsPVwiUmVzcG9uc2VcIj5cbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XG4gICAgPGRpdiBpZD1cIm1vbmFjbzJcIj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L1RhYj5cbjxUYWIgbGFiZWw9XCJDU1BcIj5cbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XG4gICAgPGRpdiBpZD1cIm1vbmFjbzNcIj5cbiAgPC9kaXY+XG48L1RhYj5cblxuPHN0eWxlPlxuLnZpZXctY29udGFpbmVyIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA1MHB4KTtcbn1cbiNtb25hY28xLFxuI21vbmFjbzIsXG4jbW9uYWNvMyB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICBib3R0b206IDA7XG4gIHJpZ2h0OiAwO1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XG5cbm9uTW91bnQoKCkgPT4ge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWpzb24gYScpO1xuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0YWJzdG9yZS5zZXQoe1xuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcbiAgICAgICAgICB0YWI6IGksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgNTAwKTtcbn0pO1xuPC9zY3JpcHQ+XG5cbjxCdXR0b24yLz5cbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi1qc29uXCIgc2l6ZT1cImlzLXNtYWxsXCI+XG4gIDxCYXNlVGFiLz5cbjwvVGFicz5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XG5cbm9uTW91bnQoKCkgPT4ge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWh0bWwgYScpO1xuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0YWJzdG9yZS5zZXQoe1xuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcbiAgICAgICAgICB0YWI6IGksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgNTAwKTtcbn0pO1xuPC9zY3JpcHQ+XG5cbjxCdXR0b24yLz5cbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi1odG1sXCIgc2l6ZT1cImlzLXNtYWxsXCI+XG4gIDxCYXNlVGFiLz5cbjwvVGFicz5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XG5cbm9uTW91bnQoKCkgPT4ge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLXRleHQgYScpO1xuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0YWJzdG9yZS5zZXQoe1xuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcbiAgICAgICAgICB0YWI6IGksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgNTAwKTtcbn0pO1xuPC9zY3JpcHQ+XG5cbjxCdXR0b24yLz5cbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi10ZXh0XCIgc2l6ZT1cImlzLXNtYWxsXCI+XG4gIDxCYXNlVGFiLz5cbjwvVGFicz5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XG5cbm9uTW91bnQoKCkgPT4ge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWNzcyBhJyk7XG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRhYnN0b3JlLnNldCh7XG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxuICAgICAgICAgIHRhYjogaSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCA1MDApO1xufSk7XG48L3NjcmlwdD5cblxuPEJ1dHRvbjIvPlxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWNzc1wiIHNpemU9XCJpcy1zbWFsbFwiPlxuICA8QmFzZVRhYi8+XG48L1RhYnM+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1qcyBhJyk7XG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRhYnN0b3JlLnNldCh7XG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxuICAgICAgICAgIHRhYjogaSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCA1MDApO1xufSk7XG48L3NjcmlwdD5cblxuPEJ1dHRvbjIvPlxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWpzXCIgc2l6ZT1cImlzLXNtYWxsXCI+XG4gIDxCYXNlVGFiLz5cbjwvVGFicz5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcbmltcG9ydCBKc29uIGZyb20gJy4vSnNvbi5zdmVsdGUnO1xuaW1wb3J0IEh0bWwgZnJvbSAnLi9IdG1sLnN2ZWx0ZSc7XG5pbXBvcnQgVGV4dCBmcm9tICcuL1RleHQuc3ZlbHRlJztcbmltcG9ydCBDc3MgZnJvbSAnLi9Dc3Muc3ZlbHRlJztcbmltcG9ydCBKcyBmcm9tICcuL0pzLnN2ZWx0ZSc7XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cIml0ZW0tc2hvd1wiPlxuICB7I2lmICRsb2dzdG9yZS50aXRsZS5tYXRjaCgnLnBuZycpfVxuICAgIDxpbWcgc3JjPVwieyRsb2dzdG9yZS51cmx9XCIgYWx0PVwiaW1hZ2VcIi8+XG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2pzb24nfVxuICAgIDxKc29uLz5cbiAgezplbHNlIGlmICRsb2dzdG9yZS5leHQ9PT0naHRtbCd9XG4gICAgPEh0bWwvPlxuICB7OmVsc2UgaWYgJGxvZ3N0b3JlLmV4dD09PSd0eHQnfVxuICAgIDxUZXh0Lz5cbiAgezplbHNlIGlmICRsb2dzdG9yZS5leHQ9PT0nY3NzJ31cbiAgICA8Q3NzLz5cbiAgezplbHNlIGlmICRsb2dzdG9yZS5leHQ9PT0nanMnfVxuICAgIDxKcy8+XG4gIHs6ZWxzZX1cbiAgICA8cHJlPnskbG9nc3RvcmUucmVzcG9uc2V9PC9wcmU+XG4gIHsvaWZ9XG48L2Rpdj5cblxuPHN0eWxlPlxuLml0ZW0tc2hvdyB7XG4gIG1hcmdpbi1sZWZ0OiAycHg7XG59XG4uaXRlbS1zaG93IHByZXtcbiAgcGFkZGluZzogMCAwIDAgNXB4O1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XG5pbXBvcnQgdGl0bGUgZnJvbSAnLi9UaXRsZS5zdmVsdGUnO1xuaW1wb3J0IExpc3QgZnJvbSAnLi9MaXN0LnN2ZWx0ZSc7XG5pbXBvcnQgU2hvdyBmcm9tICcuL1Nob3cuc3ZlbHRlJztcblxubGV0IGJveCA9IGZhbHNlXG5sZXQgbGVmdCA9IDE2MztcbmNvbnN0IHRvcCA9ICc0Nyc7XG5jb25zdCBpZCA9ICdsb2dzTGVmdCc7XG5cbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoaWQsIGZ1bmN0aW9uKG9wdCkge1xuICAgIG9wdFtpZF0gJiYgKGxlZnQgPSBvcHRbaWRdKVxuICB9KTtcbn0pO1xuXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XG4gIGxlZnQgPSBkZXRhaWwubGVmdFxuICBjb25zdCBkYXRhID0ge31cbiAgZGF0YVtpZF0gPSBsZWZ0XG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldChkYXRhKVxufVxuPC9zY3JpcHQ+XG5cbjxWQm94MiB7dGl0bGV9IHt0b3B9IHtsZWZ0fSB7ZHJhZ2VuZH0ge2JveH0ge0xpc3R9IHNob3c9eyRsb2dzdG9yZS5sb2dpZH0+XG4gIDxTaG93Lz5cbjwvVkJveDI+XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcblxuZXhwb3J0IGNvbnN0IHRhZ3MgPSB3cml0YWJsZSh7XG4gIGZpbHRlclVybDogdHJ1ZSxcbiAgX190YWcxOiB7fSxcbiAgX190YWcyOiB7fSxcbiAgX190YWczOiB7fVxufSlcbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5sZXQgYXV0b1NhdmUgPSB0cnVlO1xubGV0IF90YWdzID0gJHRhZ3M7XG5cbmZ1bmN0aW9uIGJ0blJlc2V0KGUpIHtcbiAgd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzLnJvdXRlVGFibGUoKTtcbn1cblxuZnVuY3Rpb24gYnRuU2F2ZShlKSB7XG4gIGNvbnN0IHtfX3RhZzEsIF9fdGFnMiwgX190YWczfSA9IHdpbmRvdy5taXRtO1xuICBjb25zdCB0YWdzID0ge1xuICAgIF9fdGFnMSxcbiAgICBfX3RhZzIsXG4gICAgX190YWczLFxuICB9O1xuICB3c19fc2VuZCgnc2F2ZVRhZ3MnLCB0YWdzKTtcbn1cblxub25Nb3VudCgoKSA9PiB7XG4gIGxldCBkZWJvdW5jZSA9IGZhbHNlO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2V0LXRhZ3MnKS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgIGNvbnN0IHt0eXBlfSA9IGUudGFyZ2V0LmF0dHJpYnV0ZXM7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGNvbnN0IHt2YWx1ZX0gPSB0eXBlO1xuICAgICAgaWYgKGF1dG9TYXZlICYmIHZhbHVlPT09J2NoZWNrYm94Jykge1xuICAgICAgICBpZiAoZGVib3VuY2UpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGRlYm91bmNlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgZGVib3VuY2UgPSBmYWxzZTtcbiAgICAgICAgICBidG5TYXZlKGUpO1xuICAgICAgICB9LDUwKVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJ2NsaWNrZWQnLCBlLnRhcmdldCk7XG4gICAgfVxuICB9O1xuXG4gIHdpbmRvdy5taXRtLmJyb3dzZXIuY2hnVXJsX2V2ZW50cy50YWdzRXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnVXBkYXRlIHRhZ3MhJyk7XG4gICAgdGFncy5zZXQoey4uLiR0YWdzfSk7XG4gIH1cbn0pO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcbiAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLmZpbHRlclVybH0vPlxuICAgIEFjdGl2ZXVybFxuICA8L2xhYmVsPlxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blJlc2V0fVwiIGRpc2FibGVkPXthdXRvU2F2ZX0+UmVzZXQ8L2J1dHRvbj5cbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5TYXZlfVwiICBkaXNhYmxlZD17YXV0b1NhdmV9PlNhdmU8L2J1dHRvbj5cbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxuICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgIGJpbmQ6Y2hlY2tlZD17YXV0b1NhdmV9Lz5cbiAgICBBdXRvc2F2ZVxuICA8L2xhYmVsPlxuICAuXG48L2Rpdj5cblxuPHN0eWxlPlxuLmJ0bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIG1hcmdpbi10b3A6IC0xcHg7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbiAgcGFkZGluZy1ib3R0b206IDNweDtcbiAgcmlnaHQ6IDA7XG4gIHotaW5kZXg6IDU7XG4gIHRvcDogLTJweDtcbn1cbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcbiAgY3Vyc29yOiBhdXRvO1xufVxuLnRsYiB7XG4gIGJvcmRlcjogbm9uZTtcbn1cbi5jaGVja2VyIHtcbiAgY29sb3I6IGNob2NvbGF0ZTtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG4vKioqXG4qIGV4OlxuKiBfX3RhZzFbcmVtb3ZlLWFkc34xXSA9IHRydWVcbiogX190YWcxW3JlbW92ZS1hZHN+Ml0gPSBmYWxzZVxuKioqL1xuXG5mdW5jdGlvbiBjbGlja2VkKGUpIHtcbiAgY29uc3Qge19fdGFnMTogey4uLnRhZ3h9fSA9ICR0YWdzO1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qge19fdGFnMSxfX3RhZzIsX190YWczfSA9ICR0YWdzO1xuICAgIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7IC8vIGl0ZW0gPSByZW1vdmUtYWRzfjJcbiAgICBjb25zdCBmbGFnID0gX190YWcxW2l0ZW1dOyAgICAgICAvLyBmbGFnID0gdHJ1ZSB+PiBhbHJlYWR5IGNoYW5nZWRcbiAgICBjb25zb2xlLmxvZygnZScsICR0YWdzKTtcblxuICAgIGNvbnN0IFtncm91cDEsIGlkMV0gPSBpdGVtLnNwbGl0KCd+Jyk7XG4gICAgaWYgKGlkMSkge1xuICAgICAgZm9yIChsZXQgbnMgaW4gX190YWcxKSB7XG4gICAgICAgIGNvbnN0IFtncm91cDIsIGlkMl0gPSBucy5zcGxpdCgnficpO1xuICAgICAgICBpZiAoIXRhZ3hbaXRlbV0gJiYgZ3JvdXAxPT09Z3JvdXAyICYmIGlkMSE9PWlkMikge1xuICAgICAgICAgIGlmIChfX3RhZzFbZ3JvdXAxXSE9PXVuZGVmaW5lZCkge1xuICAgICAgICAgICAgX190YWcxW2dyb3VwMV0gPSBmbGFnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfX3RhZzFbbnNdID0gIWZsYWc7XG4gICAgICAgIH0gZWxzZSBpZiAoX190YWcxW2dyb3VwMV0hPT11bmRlZmluZWQpIHtcbiAgICAgICAgICBfX3RhZzFbZ3JvdXAxXSA9IGZsYWc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBucyBpbiBfX3RhZzIpIHtcbiAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IF9fdGFnMltuc107XG4gICAgICBmb3IgKGxldCBpdG0gaW4gbmFtZXNwYWNlKSB7XG4gICAgICAgIGNvbnN0IHR5cDIgPSBpdG0uc3BsaXQoJzonKVsxXSB8fCBpdG07XG4gICAgICAgIGlmIChpdGVtPT09dHlwMikge1xuICAgICAgICAgIG5hbWVzcGFjZVtpdG1dID0gZmxhZztcbiAgICAgICAgfSBcbiAgICAgICAgaWYgKGdyb3VwMT09PXR5cDIuc3BsaXQoJ34nKVswXSkge1xuICAgICAgICAgIG5hbWVzcGFjZVtpdG1dID0gX190YWcxW3R5cDJdIHx8IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgbnMgaW4gX190YWczKSB7XG4gICAgICBjb25zdCB1cmxzID0gX190YWczW25zXTtcbiAgICAgIGZvciAobGV0IHVybCBpbiB1cmxzKSB7XG4gICAgICAgIGNvbnN0IHR5cHMgPSB1cmxzW3VybF07XG4gICAgICAgIGZvciAobGV0IHR5cCBpbiB0eXBzKSB7XG4gICAgICAgICAgY29uc3QgbmFtZXNwYWNlID0gdHlwc1t0eXBdO1xuICAgICAgICAgIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIGlmIChpdGVtPT09aXRtKSB7XG4gICAgICAgICAgICAgIG5hbWVzcGFjZVtpdG1dID0gZmxhZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChncm91cDE9PT1pdG0uc3BsaXQoJ34nKVswXSkge1xuICAgICAgICAgICAgICBuYW1lc3BhY2VbaXRtXSA9IF9fdGFnMVtpdG1dIHx8IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB7ZmlsdGVyVXJsLCB0Z3JvdXB9ID0gJHRhZ3M7XG4gICAgdGFncy5zZXQoe1xuICAgICAgZmlsdGVyVXJsLFxuICAgICAgX190YWcxLFxuICAgICAgX190YWcyLFxuICAgICAgX190YWczLFxuICAgICAgdGdyb3VwLFxuICAgIH0pXG4gIH0sIDEwKTtcbn1cblxuZnVuY3Rpb24gcm91dGV0YWcoaXRlbSkge1xuICBjb25zdCBzbGMgPSAkdGFncy5fX3RhZzFbaXRlbV0gPyAnc2xjJyA6ICcnO1xuICBjb25zdCBncnAgPSAkdGFncy50Z3JvdXBbaXRlbV0gPyAnZ3JwJyA6ICcnO1xuICByZXR1cm4gYHJ0YWcgJHtncnB9ICR7c2xjfWA7XG59XG5cbmZ1bmN0aW9uIGxpc3RUYWdzKHRhZ3MpIHtcbiAgY29uc3Qge3RvUmVnZXh9ID0gd2luZG93Lm1pdG0uZm47XG4gIGNvbnN0IGxpc3QgPSB7fTtcblxuICBmdW5jdGlvbiBhZGQobnMpIHtcbiAgICBmb3IgKGxldCBpZCBpbiB0YWdzLl9fdGFnMltuc10pIHtcbiAgICAgIGNvbnN0IFtrLHZdID0gaWQuc3BsaXQoJzonKTtcbiAgICAgIGxpc3Rbdnx8a10gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGxldCB0Z3M7XG4gIGlmICh0YWdzLmZpbHRlclVybCkge1xuICAgIGZvciAobGV0IG5zIGluIHRhZ3MuX190YWcyKSB7XG4gICAgICBjb25zdCByZ3ggPSB0b1JlZ2V4KG5zLnJlcGxhY2UoL34vLCdbXi5dKicpKTtcbiAgICAgIGlmIChtaXRtLmJyb3dzZXIuYWN0aXZlVXJsLm1hdGNoKHJneCkpIHtcbiAgICAgICAgYWRkKG5zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYWRkKCdfZ2xvYmFsXycpO1xuICAgIHRncyA9IE9iamVjdC5rZXlzKGxpc3QpLnNvcnQoKTtcbiAgfSBlbHNlIHtcbiAgICB0Z3MgPSBPYmplY3Qua2V5cyh0YWdzLl9fdGFnMSk7XG4gIH1cbiAgcmV0dXJuIHRncztcbn1cbjwvc2NyaXB0PlxuXG48dGQ+XG4gIDxkaXYgY2xhc3M9XCJib3JkZXJcIj5cbiAgICB7I2VhY2ggbGlzdFRhZ3MoJHRhZ3MpIGFzIGl0ZW19XG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMCB7cm91dGV0YWcoaXRlbSl9XCI+XG4gICAgICA8bGFiZWw+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XG4gICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfVxuICAgICAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLl9fdGFnMVtpdGVtXX0vPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImJpZ1wiPntpdGVtfTwvc3Bhbj5cbiAgICAgIDwvbGFiZWw+XG4gICAgPC9kaXY+XG4gICAgey9lYWNofVxuICA8L2Rpdj5cbjwvdGQ+XG5cbjxzdHlsZT5cbi5ib3JkZXIge1xuICBib3JkZXI6IDFweCBkb3R0ZWQ7XG59XG4uc3BhY2UwIHtcbiAgZm9udC1zaXplOiBtZWRpdW07XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG4gIGNvbG9yOiBkYXJrYmx1ZTtcbiAgLyogYmFja2dyb3VuZDogZGVlcHNreWJsdWU7ICovXG59XG4uc3BhY2UwIC5iaWcge1xuICBtYXJnaW4tbGVmdDogLTRweDtcbn1cbi5zcGFjZTA+bGFiZWwge1xuICBwYWRkaW5nLWxlZnQ6IDZweDtcbn1cbi5ydGFnIHtcbiAgY29sb3I6IGdyZXk7XG4gIGZvbnQtc3R5bGU6IGl0YWxpYztcbiAgLyogYmFja2dyb3VuZC1jb2xvcjogYmVpZ2U7ICovXG59XG4ucnRhZy5zbGMge1xuICBjb2xvcjogZ3JlZW47XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG4ucnRhZy5ncnAge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTtcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZXhwb3J0IGxldCBpdGVtcztcbmV4cG9ydCBsZXQgbnM7XG5cbmZ1bmN0aW9uIGNsaWNrZWQoZSkge1xuICBjb25zdCB7X190YWcxLF9fdGFnMixfX3RhZzN9ID0gJHRhZ3M7XG4gIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XG4gIGNvbnN0IHR5cDEgPSBpdGVtLnNwbGl0KCc6JylbMV0gfHwgaXRlbTtcbiAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IHR5cDEuc3BsaXQoJ34nKTtcbiAgY29uc3QgbmFtZXNwYWNlID0gX190YWcyW25zXTtcbiAgY29uc3QgdGFneCA9IHt9O1xuICBmb3IgKGxldCBpdG0gaW4gbmFtZXNwYWNlKSB7XG4gICAgdGFneFtpdG1dID0gbmFtZXNwYWNlW2l0bV1cbiAgfVxuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3QgZmxhZyA9bmFtZXNwYWNlW2l0ZW1dO1xuICAgIGNvbnNvbGUubG9nKCdlJywge19fdGFnMixfX3RhZzN9KTtcblxuICAgIGlmIChpZDEpIHtcbiAgICAgIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcbiAgICAgICAgY29uc3QgdHlwMiA9IGl0bS5zcGxpdCgnOicpWzFdIHx8IGl0bTtcbiAgICAgICAgY29uc3QgW2dyb3VwMiwgaWQyXSA9IHR5cDIuc3BsaXQoJ34nKTtcbiAgICAgICAgaWYgKCEodGFneCAmJiB0YWd4W2l0ZW1dKSkge1xuICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIgJiYgaWQxIT09aWQyKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2VbaXRtXSA9ICFmbGFnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHVybHMgPSBfX3RhZzNbbnNdO1xuICAgIGZvciAobGV0IHVybCBpbiB1cmxzKSB7XG4gICAgICBjb25zdCB0eXBzID0gdXJsc1t1cmxdO1xuICAgICAgZm9yIChsZXQgdHlwIGluIHR5cHMpIHtcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlMyA9IHR5cHNbdHlwXTtcbiAgICAgICAgZm9yIChsZXQgaXRtIGluIG5hbWVzcGFjZTMpIHtcbiAgICAgICAgICBpZiAoaXRlbT09PWl0bSkge1xuICAgICAgICAgICAgbmFtZXNwYWNlM1tpdG1dID0gZmxhZztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGdyb3VwMT09PWl0bS5zcGxpdCgnficpWzBdKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2UzW2l0bV0gPSBuYW1lc3BhY2VbaXRtXSB8fCBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qge2ZpbHRlclVybCwgdGdyb3VwfSA9ICR0YWdzO1xuICAgIHRhZ3Muc2V0KHtcbiAgICAgIGZpbHRlclVybCxcbiAgICAgIF9fdGFnMSxcbiAgICAgIF9fdGFnMixcbiAgICAgIF9fdGFnMyxcbiAgICAgIHRncm91cCxcbiAgICB9KVxuICB9LCAxMCk7XG59XG5cbmZ1bmN0aW9uIHJvdXRldGFnKGl0ZW0pIHtcbiAgaWYgKGl0ZW0ubWF0Y2goJzonKSkge1xuICAgIHJldHVybiBpdGVtc1tpdGVtXSA/ICdydGFnIHNsYycgOiAncnRhZyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGl0ZW1zW2l0ZW1dID8gJ3N0YWcgc2xjJyA6ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGl0ZW1saXN0KGl0ZW1zKSB7XG4gIGNvbnN0IGFyciA9IE9iamVjdC5rZXlzKGl0ZW1zKS5zb3J0KChhLGIpID0+IHtcbiAgICBjb25zdCBbazEsdjFdID0gYS5zcGxpdCgnOicpO1xuICAgIGNvbnN0IFtrMix2Ml0gPSBiLnNwbGl0KCc6Jyk7XG4gICAgYSA9IHYxIHx8IGsxO1xuICAgIGIgPSB2MiB8fCBrMjtcbiAgICBpZiAoYTxiKSByZXR1cm4gLTE7XG4gICAgaWYgKGE+YikgcmV0dXJuIDE7XG4gICAgcmV0dXJuIDA7XG4gIH0pO1xuICByZXR1cm4gYXJyO1xufVxuXG5mdW5jdGlvbiBzaG93KGl0ZW0pIHtcbiAgY29uc3QgW2ssdl0gPSBpdGVtLnNwbGl0KCc6Jyk7XG4gIGlmICh2PT09dW5kZWZpbmVkKSByZXR1cm4gaztcbiAgcmV0dXJuIGAke3Z9eyR7a319YDtcbn1cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwiYm9yZGVyXCI+XG4gIDxkaXYgY2xhc3M9XCJzcGFjZTBcIj5be25zPT09J19nbG9iYWxfJyA/ICcgKiAnIDogbnN9XTwvZGl2PlxuICB7I2VhY2ggaXRlbWxpc3QoaXRlbXMpIGFzIGl0ZW19XG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMSB7cm91dGV0YWcoaXRlbSl9XCI+XG4gICAgICA8bGFiZWw+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XG4gICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfSBcbiAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtc1tpdGVtXX0vPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIntpdGVtLm1hdGNoKCc6JykgPyAnYmlnJyA6ICcnfVwiPntzaG93KGl0ZW0pfTwvc3Bhbj5cbiAgICAgIDwvbGFiZWw+XG4gICAgPC9kaXY+XG4gIHsvZWFjaH1cbjwvZGl2PlxuXG48c3R5bGU+XG4uYm9yZGVyIHtcbiAgYm9yZGVyOiAxcHggZ3JleSBzb2xpZDtcbn1cbi5zcGFjZTAge1xuICBsaW5lLWhlaWdodDogMS41O1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgY29sb3I6IGRhcmtibHVlO1xuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XG59XG4uc3BhY2UxIHtcbiAgY29sb3I6IGdyZXk7XG4gIHBhZGRpbmctbGVmdDogMTBweDtcbn1cbi5zcGFjZTEgLmJpZyB7XG4gIG1hcmdpbi1sZWZ0OiAtNHB4O1xufVxuLnJ0YWcge1xuICBjb2xvcjogY2FkZXRibHVlO1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC1zdHlsZTogaXRhbGljO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTtcbn1cbi5ydGFnLnNsYyB7XG4gIGNvbG9yOiByZWQ7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG4uc3RhZy5zbGMge1xuICBjb2xvcjogZ3JlZW47XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgVGFnczIxIGZyb20gJy4vVGFnczJfMS5zdmVsdGUnO1xuXG5mdW5jdGlvbiBvbmVTaXRlKG5zKSB7XG4gIGNvbnN0IHt0b1JlZ2V4fSA9IHdpbmRvdy5taXRtLmZuO1xuICBpZiAoJHRhZ3MuZmlsdGVyVXJsKSB7XG4gICAgY29uc3Qgcmd4ID0gdG9SZWdleChucy5yZXBsYWNlKC9+LywnW14uXSonKSk7XG4gICAgcmV0dXJuIG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSB8fCBucz09PSdfZ2xvYmFsXyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbjwvc2NyaXB0PlxuXG48dGQ+XG57I2VhY2ggT2JqZWN0LmtleXMoJHRhZ3MuX190YWcyKSBhcyBuc31cbiAgeyNpZiBvbmVTaXRlKG5zKX1cbiAgICA8VGFnczIxIGl0ZW1zPXskdGFncy5fX3RhZzJbbnNdfSBucz17bnN9Lz5cbiAgey9pZn1cbnsvZWFjaH1cbjwvdGQ+XG5cbjxzdHlsZT5cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxuZXhwb3J0IGxldCBpdGVtcztcbmV4cG9ydCBsZXQgaXRlbTtcbmV4cG9ydCBsZXQgcGF0aDtcbmV4cG9ydCBsZXQgbnM7XG5cbmZ1bmN0aW9uIGNsaWNrZWQoZSkge1xuICBzZXRUaW1lb3V0KCgpPT57XG4gICAgY29uc3Qge19fdGFnM30gPSAkdGFncztcbiAgICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzNbbnNdO1xuICAgIGNvbnN0IHtpdGVtOiBpfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XG4gICAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IGkuc3BsaXQoJ34nKTtcbiAgICBjb25zb2xlLmxvZygnZScsIHtfX3RhZzN9KTtcblxuICAgIGZvciAobGV0IHB0aCBpbiBuYW1lc3BhY2UpIHtcbiAgICAgIGNvbnN0IHR5cHMgPSBuYW1lc3BhY2VbcHRoXTtcbiAgICAgIGZvciAobGV0IHRzayBpbiB0eXBzKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zMiA9IHR5cHNbdHNrXTtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtczIhPT0nc3RyaW5nJykge1xuICAgICAgICAgIGZvciAobGV0IGl0bSBpbiBpdGVtczIpIHtcbiAgICAgICAgICAgIGNvbnN0IFtncm91cDIsIGlkMl0gPSBpdG0uc3BsaXQoJ34nKTtcbiAgICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIgJiYgaWQxIT09aWQyKSB7XG4gICAgICAgICAgICAgIGl0ZW1zMltpdG1dID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRhZ3Muc2V0KHtcbiAgICAgICAgICAgICAgICAuLi4kdGFncyxcbiAgICAgICAgICAgICAgICBfX3RhZzMsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCA1MCk7XG59XG5cbmZ1bmN0aW9uIHJvdXRldGFnKGl0ZW0pIHtcbiAgcmV0dXJuIGl0ZW1zW2l0ZW1dID8gJ3J0YWcgc2xjJyA6ICdydGFnJztcbn1cblxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcbiAgY29uc3Qge19fdGFnM30gPSB0YWdzO1xuICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzNbbnNdO1xuICBjb25zdCB0eXBzID0gbmFtZXNwYWNlW3BhdGhdO1xuICBjb25zdCBpdG1zID0gdHlwc1tpdGVtXTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGl0bXMpLnNvcnQoKTtcbn1cbjwvc2NyaXB0PlxuXG57I2VhY2ggeGl0ZW1zKCR0YWdzKSBhcyBpdGVtfVxuICA8ZGl2IGNsYXNzPVwic3BhY2UzIHtyb3V0ZXRhZyhpdGVtKX1cIj5cbiAgICA8bGFiZWw+XG4gICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgIGRhdGEtaXRlbT17aXRlbX1cbiAgICAgIG9uOmNsaWNrPXtjbGlja2VkfSBcbiAgICAgIGJpbmQ6Y2hlY2tlZD17aXRlbXNbaXRlbV19Lz5cbiAgICAgIDxzcGFuPntpdGVtfTwvc3Bhbj5cbiAgICA8L2xhYmVsPlxuICA8L2Rpdj5cbnsvZWFjaH1cblxuPHN0eWxlPlxuLnNwYWNlMyB7XG4gIHBhZGRpbmctbGVmdDogMjBweDtcbn1cblxuLnJ0YWcge1xuICBjb2xvcjogY2FkZXRibHVlO1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC1zdHlsZTogaXRhbGljO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBiZWlnZTtcbn1cbi5ydGFnLnNsYyB7XG4gIGNvbG9yOiByZWQ7XG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XG5pbXBvcnQgVGFnczMzIGZyb20gJy4vVGFnczNfMy5zdmVsdGUnO1xuXG5leHBvcnQgbGV0IGl0ZW1zO1xuZXhwb3J0IGxldCBwYXRoO1xuZXhwb3J0IGxldCBucztcblxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcbiAgY29uc3Qge19fdGFnM30gPSB0YWdzO1xuICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzNbbnNdO1xuICBjb25zdCB0eXBzID0gbmFtZXNwYWNlW3BhdGhdO1xuICByZXR1cm4gT2JqZWN0LmtleXModHlwcyk7XG59XG48L3NjcmlwdD5cblxueyNlYWNoIHhpdGVtcygkdGFncykuZmlsdGVyKHg9PnhbMF0hPT0nOicpIGFzIGl0ZW19XG4gIDxkaXYgY2xhc3M9XCJzcGFjZTJcIj57aXRlbX06e2l0ZW1zW2A6JHtpdGVtfWBdfTwvZGl2PlxuICA8VGFnczMzIGl0ZW1zPXtpdGVtc1tpdGVtXX0ge2l0ZW19IHtwYXRofSB7bnN9Lz5cbnsvZWFjaH1cblxuPHN0eWxlPlxuLnNwYWNlMiB7XG4gIHBhZGRpbmctbGVmdDogMjBweDtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgY29sb3I6IGdyZWVuO1xufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IFRhZ3MzMiBmcm9tICcuL1RhZ3MzXzIuc3ZlbHRlJztcblxuZXhwb3J0IGxldCBpdGVtcztcbmV4cG9ydCBsZXQgbnM7XG5cbmZ1bmN0aW9uIHhpdGVtcyh0YWdzKSB7XG4gIGNvbnN0IHtfX3RhZzN9ID0gdGFncztcbiAgY29uc3QgbmFtZXNwYWNlID0gX190YWczW25zXTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG5hbWVzcGFjZSk7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImJvcmRlclwiPlxuICA8ZGl2IGNsYXNzPVwic3BhY2UwXCI+W3tucz09PSdfZ2xvYmFsXycgPyAnICogJyA6IG5zfV08L2Rpdj5cbiAgeyNlYWNoIHhpdGVtcygkdGFncykgYXMgcGF0aH1cbiAgICA8ZGl2IGNsYXNzPVwic3BhY2UxXCI+e3BhdGh9PC9kaXY+XG4gICAgPFRhZ3MzMiBpdGVtcz17aXRlbXNbcGF0aF19IHtwYXRofSB7bnN9Lz5cbiAgey9lYWNofVxuPC9kaXY+XG5cbjxzdHlsZT5cbi5ib3JkZXIge1xuICBib3JkZXI6IDFweCBzb2xpZDtcbn1cbi5zcGFjZTAge1xuICBsaW5lLWhlaWdodDogMS41O1xuICBmb250LXNpemU6IG1lZGl1bTtcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcbiAgY29sb3I6IGRhcmtibHVlO1xuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XG59XG4uc3BhY2UxIHtcbiAgcGFkZGluZy1sZWZ0OiAxMHB4O1xuICBmb250LXdlaWdodDogYm9sZGVyO1xuICBjb2xvcjogYmx1ZXZpb2xldFxufVxuPC9zdHlsZT5cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuaW1wb3J0IFRhZ3MzMSBmcm9tICcuL1RhZ3MzXzEuc3ZlbHRlJztcblxuZnVuY3Rpb24gaXN0YWcobnMpIHtcbiAgY29uc3Qge3RvUmVnZXh9ID0gd2luZG93Lm1pdG0uZm47XG4gIGNvbnN0IGFyciA9IE9iamVjdC5rZXlzKCR0YWdzLl9fdGFnMltuc10pO1xuICBjb25zdCBvayA9IGFyci5maWx0ZXIoeD0+IXgubWF0Y2goJzonKSkubGVuZ3RoO1xuICBpZiAoJHRhZ3MuZmlsdGVyVXJsKSB7XG4gICAgY29uc3Qgcmd4ID0gdG9SZWdleChucy5yZXBsYWNlKC9+LywnW14uXSonKSk7XG4gICAgcmV0dXJuIG9rICYmIG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSB8fCBucz09PSdfZ2xvYmFsXyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9rO1xuICB9XG59XG48L3NjcmlwdD5cblxuPHRkPlxueyNlYWNoIE9iamVjdC5rZXlzKCR0YWdzLl9fdGFnMykgYXMgbnN9XG4gIHsjaWYgaXN0YWcobnMpfVxuICAgIDxUYWdzMzEgaXRlbXM9eyR0YWdzLl9fdGFnM1tuc119IHtuc30vPlxuICB7L2lmfVxuey9lYWNofVxuPC90ZD5cblxuPHN0eWxlPlxuPC9zdHlsZT4iLCI8c2NyaXB0PlxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IFRhZ3MxIGZyb20gJy4vVGFnczFfLnN2ZWx0ZSc7IFxuaW1wb3J0IFRhZ3MyIGZyb20gJy4vVGFnczJfLnN2ZWx0ZSc7IFxuaW1wb3J0IFRhZ3MzIGZyb20gJy4vVGFnczNfLnN2ZWx0ZSc7IFxuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcblxufSk7XG5cbndpbmRvdy5taXRtLmZpbGVzLmdldFJvdXRlX2V2ZW50cy50YWdzVGFibGUgPSAoKSA9PiB7XG4gIC8vIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcbiAgY29uc29sZS5sb2coJ3RhZ3NUYWJsZSBnZXR0aW5nIGNhbGxlZCEhIScpO1xuICBjb25zdCB7X190YWcxLCBfX3RhZzIsIF9fdGFnM30gPSB3aW5kb3cubWl0bTtcbiAgY29uc3Qge2ZpbHRlclVybH0gPSAkdGFncztcbiAgY29uc3QgdGdyb3VwID0ge307XG4gIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xuICAgIGNvbnN0IHRza3MgPSBfX3RhZzJbbnNdXG4gICAgZm9yIChsZXQgdGFzayBpbiB0c2tzKSB7XG4gICAgICBjb25zdCBbLHZdID0gdGFzay5zcGxpdCgnOicpO1xuICAgICAgdiAmJiAodGdyb3VwW3ZdID0gdHJ1ZSlcbiAgICB9XG4gIH0gIFxuICB0YWdzLnNldCh7XG4gICAgZmlsdGVyVXJsLFxuICAgIF9fdGFnMSxcbiAgICBfX3RhZzIsXG4gICAgX190YWczLFxuICAgIHRncm91cCxcbiAgfSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxkaXYgY2xhc3M9XCJ2Ym94XCI+XG4gIDxCU3RhdGljIGhlaWdodD1cIjBcIj5cbiAgICA8QkhlYWRlcj4tVGFncy08L0JIZWFkZXI+XG4gICAgPEJUYWJsZT5cbiAgICAgIDx0ciBjbGFzcz1cInNldC10YWdzXCI+XG4gICAgICAgIDxUYWdzMS8+XG4gICAgICAgIDxUYWdzMi8+XG4gICAgICAgIDxUYWdzMy8+XG4gICAgICA8L3RyPlxuICAgIDwvQlRhYmxlPlxuICA8L0JTdGF0aWM+XG48L2Rpdj5cblxuPHN0eWxlPlxuLnZib3gge1xuICBmbGV4OiBhdXRvO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG48L3N0eWxlPlxuIiwiPHNjcmlwdD5cbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XG4gIHdzX19zZW5kKCdvcGVuSG9tZScsICcnLCBkYXRhID0+IHtcbiAgICBjb25zb2xlLmxvZygnRG9uZSBvcGVuIGhvbWUgZm9sZGVyIScpO1xuICB9KTtcbn1cbjwvc2NyaXB0PlxuXG48YnV0dG9uIG9uOmNsaWNrPXtidG5PcGVufT5PcGVuIEhvbWU8L2J1dHRvbj5cbiIsIjxzY3JpcHQ+XG5mdW5jdGlvbiBidG5Db2RlKCkge1xuICB3c19fc2VuZCgnY29kZUhvbWUnLCAnJywgZGF0YSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0RvbmUgY29kZSBob21lIGZvbGRlciEnKTtcbiAgfSk7XG59XG48L3NjcmlwdD5cblxuPGJ1dHRvbiBvbjpjbGljaz17YnRuQ29kZX0+Q29kZSBIb21lPC9idXR0b24+XG4iLCI8c2NyaXB0PlxuZnVuY3Rpb24gYnRuUG9zdG1lc3NhZ2UoZSkge1xuICBjb25zdCBwb3N0bWVzc2FnZSA9IGUudGFyZ2V0LmNoZWNrZWQ7XG4gIHdzX19zZW5kKCdzZXRDbGllbnQnLCB7cG9zdG1lc3NhZ2V9LCBkYXRhID0+IHtcbiAgICB3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UgPSBkYXRhLnBvc3RtZXNzYWdlO1xuICAgIGNvbnNvbGUubG9nKCdEb25lIGNoYW5nZSBzdGF0ZSBwb3N0bWVzc2FnZScsIGRhdGEpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmxhZygpIHtcbiAgcmV0dXJuIHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZTtcbn1cbjwvc2NyaXB0PlxuXG48bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiPlxuICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0blBvc3RtZXNzYWdlfSBjaGVja2VkPXtmbGFnKCl9PlxuICBQb3N0IE1lc3NhZ2VzXG48L2xhYmVsPlxuIiwiPHNjcmlwdD5cbmZ1bmN0aW9uIGJ0bkNzcChlKSB7XG4gIGNvbnN0IGNzcCA9IGUudGFyZ2V0LmNoZWNrZWQ7XG4gIHdzX19zZW5kKCdzZXRDbGllbnQnLCB7Y3NwfSwgZGF0YSA9PiB7XG4gICAgd2luZG93Lm1pdG0uY2xpZW50LmNzcCA9IGRhdGEuY3NwO1xuICAgIGNvbnNvbGUubG9nKCdEb25lIGNoYW5nZSBzdGF0ZSBjc3AnLCBkYXRhKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZsYWcoKSB7XG4gIHJldHVybiB3aW5kb3cubWl0bS5jbGllbnQuY3NwO1xufVxuPC9zY3JpcHQ+XG5cbjxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XG4gIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuQ3NwfSBjaGVja2VkPXtmbGFnKCl9PlxuICBDb250ZW50IFNlYy4gUG9saWN5XG48L2xhYmVsPlxuIiwiLy8gZmVhdDogbWFya2Rvd25cbmltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuXG5leHBvcnQgY29uc3Qgc291cmNlID0gd3JpdGFibGUoe1xuICBvcGVuRGlzYWJsZWQ6IGZhbHNlLFxuICBzYXZlRGlzYWJsZWQ6IHRydWUsXG4gIGdvRGlzYWJsZWQ6IHRydWUsXG4gIGNvbnRlbnQ6ICdIaSEnLFxuICBmcGF0aDogJycsXG4gIHBhdGg6ICcnXG59KVxuIiwiPHNjcmlwdD5cbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcblxubGV0IHZhbHVlID0gNjE7XG5mdW5jdGlvbiBwbG90VmFsdWUoZSkge1xuICB2YWx1ZSA9ICtlLnRhcmdldC52YWx1ZVxuICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NjYWxlLW1lcm1haWQnKVxuICBub2RlLmlubmVySFRNTCA9IGAubWVybWFpZCB7aGVpZ2h0OiAke3ZhbHVlfXZoO31gXG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cbiAgPHNwYW4+e3BhcnNlSW50KHZhbHVlKX08L3NwYW4+XG4gIDxpbnB1dCBuYW1lPVwid2VpZ2h0XCIgdHlwZT1cInJhbmdlXCIgbWluPVwiMTBcIiBtYXg9XCIxMDBcIiBzdGVwPVwiMVwiIHt2YWx1ZX0gb246aW5wdXQ9e3Bsb3RWYWx1ZX0gLz5cbjwvZGl2PlxuXG48c3R5bGU+XG4uYnRuLWNvbnRhaW5lciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbWFyZ2luLXRvcDogNXB4O1xuICBwYWRkaW5nLXJpZ2h0OiA0cHg7XG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XG4gIHJpZ2h0OiAwO1xuICB6LWluZGV4OiA1O1xuICB0b3A6IC0ycHg7XG59XG5zcGFuIHtcbiAgZm9udC1zaXplOiAwLjhlbTtcbiAgdmVydGljYWwtYWxpZ246IHRvcDtcbn1cbjwvc3R5bGU+IiwiPHNjcmlwdD5cbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5vbk1vdW50KCgpID0+IHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcmtkb3duJykub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICBjb25zdCB7IGhhc2ggfSA9IGUudGFyZ2V0O1xuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgaGFzaCk7XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAvLyBsb2NhdGlvbi5oYXNoID0gaGFzaDtcbiAgICAgIGNvbnN0IGJlaGF2aW9yID0gJ2F1dG8nO1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaGFzaCk7XG4gICAgICBjb25zdCB0b3AgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIDQwO1xuICAgICAgY29uc3QgX3dpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaG93LWNvbnRhaW5lcicpO1xuICAgICAgX3dpbmRvdy5zY3JvbGwoe3RvcCwgYmVoYXZpb3J9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG5vZGUgPSBlLnRhcmdldFxuICAgICAgd2hpbGUgKG5vZGUuaWQhPT0nbWFya2Rvd24nKSB7XG4gICAgICAgIGlmIChub2RlLm5vZGVOYW1lPT09J0EnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2FuY2hvcicpO1xuICAgICAgICAgIGlmIChub2RlLmhyZWYubWF0Y2goL2h0dHBzPzpcXC8vKSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybDogbm9kZS5ocmVmIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pO1xuXG5sZXQgbWVybWFpZDtcbmNvbnN0IHIgPSAvKCUuezJ9fFt+Ll0pL2c7XG5mdW5jdGlvbiBjb250ZW50KHNyYykge1xuICAhbWVybWFpZCAmJiAobWVybWFpZCA9IHdpbmRvdy5tZXJtYWlkKTtcbiAgY29uc29sZS5sb2coJ3Bsb3QgdGhlIGNvbnRlbnQuLi4nKTtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXJrZG93biAubWVybWFpZCcpKSB7XG4gICAgICBtZXJtYWlkLmluaXQoKTtcbiAgICAgIGNvbnN0IGFyciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdi5kZXRhaWxzJylcbiAgICAgIGZvciAobGV0IG5vZGUgb2YgYXJyKSB7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ3RpdGxlJylcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKVxuICAgICAgICBkZXRhaWxzLmlubmVySFRNTCA9IGA8c3VtbWFyeT4ke3RpdGxlfTwvc3VtbWFyeT5gXG4gICAgICAgIGNvbnN0IGNoaWxkcyA9IFtdXG4gICAgICAgIGZvciAobGV0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICBjaGlsZHMucHVzaChjaGlsZClcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBjaGlsZCBvZiBjaGlsZHMpIHtcbiAgICAgICAgICBkZXRhaWxzLmFwcGVuZENoaWxkKGNoaWxkKVxuICAgICAgICB9XG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZGV0YWlscylcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFya2Rvd24gYS51cCcpKSB7XG4gICAgICBsZXQgX3RvcDtcbiAgICAgIGNvbnN0IGgxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDEnKTtcbiAgICAgIGNvbnN0IGFyciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2gxLGgyLGgzLGg0LGg1Jyk7XG4gICAgICBoMSAmJiAoX3RvcCA9IGAgPGEgY2xhc3M9XCJ1cFwiIGhyZWY9XCIjJHtoMS5pZH1cIj57dXB9PC9hPmApOyBcbiAgICAgIGZvciAobGV0IFtpLCBub2RlXSBvZiBhcnIuZW50cmllcygpKSB7XG4gICAgICAgIGlmIChfdG9wICYmIGkgPiAwKSB7XG4gICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSBgJHtub2RlLmlubmVySFRNTH0ke190b3B9YFxuICAgICAgICB9XG4gICAgICAgIG5vZGUuaWQgPSBub2RlLmlkLnJlcGxhY2UociwgJycpO1xuICAgICAgICBjb25zb2xlLmxvZyhub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDEpO1xuICByZXR1cm4gc3JjLmNvbnRlbnQ7XG59XG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cInNob3ctY29udGFpbmVyXCI+XG4gIDxkaXYgaWQ9XCJtYXJrZG93blwiPlxuICAgIHtAaHRtbCBjb250ZW50KCRzb3VyY2UpfVxuICA8L2Rpdj5cbjwvZGl2PlxuXG48c3R5bGU+XG4gIC5zaG93LWNvbnRhaW5lciB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGhlaWdodDogY2FsYygxMDB2aCAtIDI1cHgpOyAgXG4gICAgb3ZlcmZsb3c6IGF1dG87XG4gIH1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PiAvLyBmZWF0OiBtYXJrZG93blxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xuXG5leHBvcnQgbGV0IGl0ZW07XG5cbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XG4gIGNvbnNvbGUubG9nKGl0ZW0pO1xuICBjb25zdCB7ZnBhdGh9ID0gaXRlbTtcbiAgd3NfX3NlbmQoJ2dldE1Db250ZW50Jywge2ZwYXRofSwgKHtjb250ZW50fSkgPT4ge1xuICAgIHNvdXJjZS51cGRhdGUobiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5uLFxuICAgICAgICBjb250ZW50LFxuICAgICAgICBmcGF0aDogaXRlbS5mcGF0aFxuICAgICAgfVxuICAgIH0pXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0aXRsZSh0KSB7XG4gIGNvbnNvbGUubG9nKHQudGl0bGUpXG4gIGNvbnN0IHN0cmluZyA9IHQudGl0bGUucmVwbGFjZSgvXFwubWQkLywnJylcbiAgY29uc3QgcHJlID0gc3RyaW5nLm1hdGNoKC9eKFteYS16QS1aXSsufC4pLylbMF1cbiAgY29uc3QgcG9zdCA9IHN0cmluZy5yZXBsYWNlKHByZSwnJykudG9Mb3dlckNhc2UoKVxuICByZXR1cm4gcHJlLnRvVXBwZXJDYXNlKCkgKyBwb3N0O1xufVxuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskc291cmNlLmZwYXRoPT09aXRlbS5mcGF0aH1cIlxuICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cbiAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXG4+e3RpdGxlKGl0ZW0pfTwvZGl2PlxuXG48c3R5bGU+XG4udGQtaXRlbTpob3ZlciB7XG4gIGNvbG9yOiBibHVlO1xuICBmb250LXdlaWdodDogYm9sZGVyO1xufVxuLnRkLWl0ZW0sXG4udGQtc2hvdyB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcGFkZGluZzogMC4xcmVtO1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgcGFkZGluZy1sZWZ0OiAxMnB4O1xufVxuLnRkLWl0ZW0udHJ1ZSB7XG4gIGNvbG9yOiBibHVlO1xuICBmb250LXdlaWdodDogYm9sZGVyO1xuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcbn1cbjwvc3R5bGU+XG4iLCI8c2NyaXB0PlxuZXhwb3J0IGxldCBvbkNoYW5nZTtcblxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcblxubGV0IHJlcmVuZGVyID0gMDtcbmxldCBkYXRhID0gW107XG5cbiQ6IF9kYXRhID0gZGF0YTtcblxub25Nb3VudChhc3luYyAoKSA9PiB7XG4gIGNvbnNvbGUud2Fybignb25Nb3VudCBtYXJrZG93bicpO1xuICBfd3NfY29ubmVjdC5tYXJrZG93bk9uTW91bnQgPSAoKSA9PiB3c19fc2VuZCgnZ2V0TWFya2Rvd24nLCAnJywgbWFya2Rvd25IYW5kbGVyKTtcbn0pO1xuXG5jb25zdCBtYXJrZG93bkhhbmRsZXIgPSBvYmogPT4ge1xuICBjb25zb2xlLndhcm4oJ3dzX19zZW5kKGdldE1hcmtkb3duKScsIG9iaik7XG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5tYXJrZG93bj09PXVuZGVmaW5lZCkge1xuICAgIHdpbmRvdy5taXRtLmZpbGVzLm1hcmtkb3duID0gb2JqO1xuICAgIGRhdGEgPSBvYmo7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qge21hcmtkb3dufSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICAgIGNvbnN0IG5ld21hcmtkb3duID0ge307XG4gICAgZm9yIChsZXQgayBpbiBvYmopIHtcbiAgICAgIG5ld21hcmtkb3duW2tdID0gb2JqW2tdO1xuICAgIH1cbiAgICBkYXRhID0gbmV3bWFya2Rvd247XG4gICAgd2luZG93Lm1pdG0uZmlsZXMubWFya2Rvd24gPSBuZXdtYXJrZG93blxuICB9XG4gIC8qKlxuICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcbiAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLmdldFByb2ZpbGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxuICAgKi9cbiAgY29uc3Qge2dldFByb2ZpbGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xuICBmb3IgKGxldCBrZXkgaW4gZ2V0UHJvZmlsZV9ldmVudHMpIHtcbiAgICBnZXRQcm9maWxlX2V2ZW50c1trZXldKGRhdGEpO1xuICB9XG4gIHJlcmVuZGVyID0gcmVyZW5kZXIgKyAxO1xufVxuXG53aW5kb3cubWl0bS5maWxlcy5tYXJrZG93bl9ldmVudHMubWFya2Rvd25UYWJsZSA9ICgpID0+IHtcbiAgY29uc29sZS5sb2coJ21hcmtkb3duVGFibGUgZ2V0dGluZyBjYWxsZWQhISEnKTtcbiAgd2luZG93LndzX19zZW5kKCdnZXRNYXJrZG93bicsICcnLCBtYXJrZG93bkhhbmRsZXIpO1xufVxuPC9zY3JpcHQ+XG5cbnsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YSkgYXMga2V5LCBpfVxuICB7I2lmIGtleT09PSdfcmVhZG1lXyd9XG4gICAgPGRpdiBjbGFzcz1cInJlYWRtZVwiPlxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhW2tleV0pIGFzIGl0ZW19XG4gICAgICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtLCAuLi5fZGF0YVtrZXldW2l0ZW1dfX0ge29uQ2hhbmdlfS8+XG4gICAgICB7L2VhY2h9ICAgIFxuICAgIDwvZGl2PlxuICB7OmVsc2V9XG4gICAgPGRldGFpbHM+PHN1bW1hcnk+e0BodG1sIGtleX08L3N1bW1hcnk+XG4gICAgICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGFba2V5XSkgYXMgaXRlbX1cbiAgICAgICAgPEl0ZW0gaXRlbT17e2VsZW1lbnQ6IGl0ZW0sIC4uLl9kYXRhW2tleV1baXRlbV19fSB7b25DaGFuZ2V9Lz5cbiAgICAgIHsvZWFjaH1cbiAgICA8L2RldGFpbHM+ICBcbiAgey9pZn1cbnsvZWFjaH1cbiIsIjxzY3JpcHQ+XG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcblxuaW1wb3J0IEJ1dHRvbiBmcm9tICcuL0J1dHRvbi5zdmVsdGUnO1xuaW1wb3J0IFZCb3gyIGZyb20gJy4uL2JveC9WQm94Mi5zdmVsdGUnO1xuaW1wb3J0IFZpZXcgZnJvbSAnLi9WaWV3LnN2ZWx0ZSc7XG5pbXBvcnQgTGlzdCBmcm9tICcuL0xpc3Quc3ZlbHRlJztcblxubGV0IGJveCA9IGZhbHNlXG5sZXQgbGVmdCA9IDE1MDtcbmNvbnN0IHRpdGxlID0gJy1IZWxwLSc7XG5jb25zdCBpZCAgPSAnaGVscExlZnQnO1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KGlkLCBmdW5jdGlvbihvcHQpIHtcbiAgICBvcHRbaWRdICYmIChsZWZ0ID0gb3B0W2lkXSlcbiAgfSk7XG59KTtcblxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xuICBsZWZ0ID0gZGV0YWlsLmxlZnRcbiAgY29uc3QgZGF0YSA9IHt9XG4gIGRhdGFbaWRdID0gbGVmdFxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoZGF0YSlcbn1cbjwvc2NyaXB0PlxuXG48QnV0dG9uLz5cbjxWQm94MiB7dGl0bGV9IHtsZWZ0fSB7ZHJhZ2VuZH0ge2JveH0ge0xpc3R9PlxuICA8Vmlldy8+XG48L1ZCb3gyPlxuIiwiPHNjcmlwdD5cbi8vaHR0cHM6Ly9jMGJyYS5naXRodWIuaW8vc3ZlbG1hL2luc3RhbGxcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xuaW1wb3J0IFJvdXRlIGZyb20gJy4vY29tcG9uZW50cy9yb3V0ZS9JbmRleC5zdmVsdGUnO1xuaW1wb3J0IFByb2ZpbGUgZnJvbSAnLi9jb21wb25lbnRzL3Byb2ZpbGUvSW5kZXguc3ZlbHRlJzsgLy8gZmVhdDogcHJvZmlsZVxuaW1wb3J0IExvZ3NUYWIgZnJvbSAnLi9jb21wb25lbnRzL2xvZ3MvSW5kZXguc3ZlbHRlJztcbmltcG9ydCBUYWdzVGFiIGZyb20gJy4vY29tcG9uZW50cy90YWdzL0luZGV4LnN2ZWx0ZSc7XG5pbXBvcnQgT3RoZXIgZnJvbSAnLi9jb21wb25lbnRzL290aGVyL0luZGV4LnN2ZWx0ZSc7XG5pbXBvcnQgSGVscCBmcm9tICcuL2NvbXBvbmVudHMvaGVscC9JbmRleC5zdmVsdGUnO1xuXG5vbk1vdW50KGFzeW5jICgpID0+IHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCduYXYudGFicz51bCcpO1xuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnTEknKTtcbiAgICBsaS5pbm5lckhUTUwgPSAndicrd2luZG93Lm1pdG0udmVyc2lvbjtcbiAgICBsaS5jbGFzc0xpc3QuYWRkKCd2ZXJzaW9uJyk7XG4gICAgbm9kZS5hcHBlbmRDaGlsZChsaSk7XG4gIH0sIDEwKTtcbn0pXG48L3NjcmlwdD5cblxuPG1haW4gY2xhc3M9XCJtYWluXCI+XG48VGFicyBzdHlsZT1cImlzLWJveGVkXCIgc2l6ZT1cImlzLXNtYWxsXCI+XG4gIDxUYWIgbGFiZWw9XCJSb3V0ZVwiPjxSb3V0ZS8+PC9UYWI+XG4gIDxUYWIgbGFiZWw9XCJQcm9maWxlXCI+PFByb2ZpbGUvPjwvVGFiPlxuICA8VGFiIGxhYmVsPVwiTG9nc1wiPjxMb2dzVGFiLz48L1RhYj5cbiAgPFRhYiBsYWJlbD1cIlRhZ3NcIj48VGFnc1RhYi8+PC9UYWI+XG4gIDxUYWIgbGFiZWw9XCJPdGhlclwiPjxPdGhlci8+PC9UYWI+XG4gIDxUYWIgbGFiZWw9XCJIZWxwXCI+PEhlbHAvPjwvVGFiPlxuPC9UYWJzPlxuPC9tYWluPlxuIiwiLyogZ2xvYmFsIGNocm9tZSAqL1xuaW1wb3J0IEFwcCBmcm9tICcuL0FwcC5zdmVsdGUnXG5cbmNvbnNvbGUubG9nKCdMb2FkIE1JVE0gcGx1Z2luJylcblxuZnVuY3Rpb24gdG9SZWdleCAoc3RyLCBmbGFncyA9ICcnKSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKHN0clxuICAgIC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwvJylcbiAgICAucmVwbGFjZSgvXFwuL2csICdcXFxcLicpXG4gICAgLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKSwgZmxhZ3MpXG59XG5cbndpbmRvdy5taXRtLmZuLnRvUmVnZXggPSB0b1JlZ2V4XG53aW5kb3cubWl0bS5lZGl0b3IgPSB7fTtcbndpbmRvdy5taXRtLmJyb3dzZXIgPSB7XG4gIGNoZ1VybF9ldmVudHM6IHt9LFxuICBhY3RpdmVVcmw6ICcnLFxuICBwYWdlOiB7fVxufVxuXG5mdW5jdGlvbiBjaGdVcmwgKHVybCkge1xuICBpZiAoIXVybCkge1xuICAgIHJldHVyblxuICB9XG4gIGNvbnNvbGUubG9nKCdDaGcgdXJsOicsIHVybClcbiAgY29uc3QgeyBicm93c2VyIH0gPSB3aW5kb3cubWl0bVxuICBicm93c2VyLmFjdGl2ZVVybCA9IHVybFxuICBmb3IgKGNvbnN0IGUgaW4gYnJvd3Nlci5jaGdVcmxfZXZlbnRzKSB7XG4gICAgYnJvd3Nlci5jaGdVcmxfZXZlbnRzW2VdKClcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRVcmwgKCkge1xuICBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgd2luZG93SWQ6IGNocm9tZS53aW5kb3dzLldJTkRPV19JRF9DVVJSRU5UIH0sXG4gICAgZnVuY3Rpb24gKHRhYnMpIHtcbiAgICAgIGNvbnN0IHVybCA9IHRhYnNbMF0udXJsXG4gICAgICBjaGdVcmwodXJsKVxuICAgIH1cbiAgKVxufTtcblxubGV0IGRlYm91bmNlXG5sZXQgZmlyc3RSdW5UYWJzT25VcGRhdGVkID0gMVxuY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uICh0YWJJZCwgY2hhbmdlSW5mbywgdGFiKSB7XG4gIGlmIChmaXJzdFJ1blRhYnNPblVwZGF0ZWQpIHtcbiAgICBjb25zb2xlLmxvZygnZmlyc3QgcnVuIGNocm9tZS50YWJzLm9uVXBkYXRlZCcpXG4gICAgZmlyc3RSdW5UYWJzT25VcGRhdGVkID0gMFxuICB9XG4gIGlmICghdGFiLmFjdGl2ZSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3QgeyBicm93c2VyIH0gPSB3aW5kb3cubWl0bVxuICBicm93c2VyLnBhZ2UgPSB7XG4gICAgLi4uYnJvd3Nlci5wYWdlLFxuICAgIC4uLmNoYW5nZUluZm8sXG4gICAgLi4udGFiXG4gIH1cblxuICBpZiAoY2hhbmdlSW5mby5zdGF0dXMgPT09ICdsb2FkaW5nJykge1xuICAgIGJyb3dzZXIucGFnZS50aXRsZSA9ICcnXG4gIH0gZWxzZSBpZiAoYnJvd3Nlci5wYWdlLnN0YXR1cyA9PT0gJ2NvbXBsZXRlJyAmJiBicm93c2VyLnBhZ2UudGl0bGUpIHtcbiAgICBpZiAoZGVib3VuY2UpIHtcbiAgICAgIGNsZWFyVGltZW91dChkZWJvdW5jZSlcbiAgICAgIGRlYm91bmNlID0gdW5kZWZpbmVkXG4gICAgfVxuICAgIGRlYm91bmNlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnVGFiIFVwZGF0ZSEhIScsIHRhYi51cmwpO1xuICAgICAgZGVib3VuY2UgPSB1bmRlZmluZWRcbiAgICAgIGNoZ1VybCh0YWIudXJsKVxuICAgIH0sIDEwMDApXG4gIH1cbn0pXG5cbmxldCBmaXJzdFJ1blRhYnNPbkFjdGl2YXRlZCA9IDFcbmNocm9tZS50YWJzLm9uQWN0aXZhdGVkLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChhY3RpdmVJbmZvKSB7XG4gIGlmIChmaXJzdFJ1blRhYnNPbkFjdGl2YXRlZCkge1xuICAgIGNvbnNvbGUubG9nKCdmaXJzdCBydW4gY2hyb21lLnRhYnMub25BY3RpdmF0ZWQnKVxuICAgIGZpcnN0UnVuVGFic09uQWN0aXZhdGVkID0gMFxuICB9XG4gIC8vIGNvbnNvbGUubG9nKCdUYWIgQ2hhbmdlISEhJywgYWN0aXZlSW5mbyk7XG4gIGdldFVybCgpXG59KVxuXG5jb25zdCBhcHAgPSBuZXcgQXBwKHsgdGFyZ2V0OiBkb2N1bWVudC5ib2R5IH0pXG5jb25zb2xlLmxvZygnU3RhcnQgcGx1Z2luJylcbmdldFVybCgpXG5cbmV4cG9ydCBkZWZhdWx0IGFwcFxuXG4vLyBsZXQgaW5wcm9jZXNzID0gZmFsc2U7XG4vLyBjb25zdCByZXBsYXkgPSAoKT0+e1xuLy8gICBzZXRUaW1lb3V0KCgpID0+IHtcbi8vICAgICBpbnByb2Nlc3MgPSBmYWxzZTtcbi8vICAgfSw1MDApO1xuLy8gfVxuLy8gZnVuY3Rpb24gcmVwb3J0V2luZG93U2l6ZSgpIHtcbi8vICAgaWYgKCFpbnByb2Nlc3MpIHtcbi8vICAgICBpbnByb2Nlc3MgPSB0cnVlO1xuLy8gICAgIGNvbnN0IHtpbm5lcldpZHRoLCBpbm5lckhlaWdodDogaGVpZ2h0LCB3c19fc2VuZH0gPSB3aW5kb3c7XG4vLyAgICAgY2hyb21lLndpbmRvd3MuZ2V0KC0yLCB7fSwgZGF0YSA9PiB7XG4vLyAgICAgICBjb25zdCB7d2lkdGg6X3d9ID0gZGF0YTtcbi8vICAgICAgIGNvbnN0IHdpZHRoID0gX3cgLSBpbm5lcldpZHRoO1xuLy8gICAgICAgY29uc29sZS5sb2coe3dpZHRoLCBoZWlnaHQsIF93fSk7XG4vLyAgICAgICB3c19fc2VuZCgnc2V0Vmlld3BvcnQnLCB7d2lkdGgsIGhlaWdodCwgX3d9LCByZXBsYXkpO1xuLy8gICAgIH0pXG4vLyAgIH1cbi8vIH1cbi8vIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlcG9ydFdpbmRvd1NpemUpO1xuLy8gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBldmVudCA9PiB7XG4vLyAgIGNvbnNvbGUubG9nKHtldmVudH0pO1xuLy8gfSk7XG4iXSwibmFtZXMiOlsiZ2V0Iiwic291cmNlIiwiYnRucyIsImJ0blRhZyIsImJ0bk1pbiIsImJ0blBsdXMiLCJ0b3AiLCJ0aXRsZSIsImlkIiwiZmxhZyJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsU0FBUyxJQUFJLEdBQUcsR0FBRztJQUVuQixTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO0lBQzFCO0lBQ0EsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUc7SUFDdkIsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLElBQUksT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBSUQsU0FBUyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtJQUN6RCxJQUFJLE9BQU8sQ0FBQyxhQUFhLEdBQUc7SUFDNUIsUUFBUSxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7SUFDekMsS0FBSyxDQUFDO0lBQ04sQ0FBQztJQUNELFNBQVMsR0FBRyxDQUFDLEVBQUUsRUFBRTtJQUNqQixJQUFJLE9BQU8sRUFBRSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUNELFNBQVMsWUFBWSxHQUFHO0lBQ3hCLElBQUksT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFDRCxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUU7SUFDdEIsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFDRCxTQUFTLFdBQVcsQ0FBQyxLQUFLLEVBQUU7SUFDNUIsSUFBSSxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsU0FBUyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUM5QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxLQUFLLE9BQU8sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7SUFJRCxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUU7SUFDdkIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtJQUNyQyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFO0lBQ2hFLFFBQVEsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBQzlFLEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsU0FBUyxFQUFFO0lBQ3hDLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO0lBQ3ZCLFFBQVEsT0FBTyxJQUFJLENBQUM7SUFDcEIsS0FBSztJQUNMLElBQUksTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELElBQUksT0FBTyxLQUFLLENBQUMsV0FBVyxHQUFHLE1BQU0sS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUNqRSxDQUFDO0lBQ0QsU0FBUyxlQUFlLENBQUMsS0FBSyxFQUFFO0lBQ2hDLElBQUksSUFBSSxLQUFLLENBQUM7SUFDZCxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLElBQUksT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUNELFNBQVMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7SUFDekQsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFDRCxTQUFTLFdBQVcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7SUFDbkQsSUFBSSxJQUFJLFVBQVUsRUFBRTtJQUNwQixRQUFRLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3hFLFFBQVEsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsS0FBSztJQUNMLENBQUM7SUFDRCxTQUFTLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtJQUN4RCxJQUFJLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7SUFDOUIsVUFBVSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDN0QsVUFBVSxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxTQUFTLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtJQUMxRCxJQUFJLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUM3QixRQUFRLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM5QyxRQUFRLElBQUksT0FBTyxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7SUFDekMsWUFBWSxPQUFPLElBQUksQ0FBQztJQUN4QixTQUFTO0lBQ1QsUUFBUSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtJQUN0QyxZQUFZLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUM5QixZQUFZLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BFLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQzdDLGdCQUFnQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsYUFBYTtJQUNiLFlBQVksT0FBTyxNQUFNLENBQUM7SUFDMUIsU0FBUztJQUNULFFBQVEsT0FBTyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQyxLQUFLO0lBQ0wsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQUNELFNBQVMsV0FBVyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUU7SUFDM0csSUFBSSxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2hHLElBQUksSUFBSSxZQUFZLEVBQUU7SUFDdEIsUUFBUSxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2xHLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDM0MsS0FBSztJQUNMLENBQUM7SUFnQ0QsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFO0lBQzlCLElBQUksT0FBTyxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUM7SUFDdEMsQ0FBQztJQU1ELFNBQVMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFO0lBQ3pDLElBQUksT0FBTyxhQUFhLElBQUksV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxhQUFhLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztJQUM5RixDQUFDO0FBQ0Q7SUFDQSxNQUFNLFNBQVMsR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUM7SUFDaEQsSUFBSSxHQUFHLEdBQUcsU0FBUztJQUNuQixNQUFNLE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7SUFDcEMsTUFBTSxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN2QixJQUFJLEdBQUcsR0FBRyxTQUFTLEdBQUcsRUFBRSxJQUFJLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztBQVE3RDtJQUNBLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDeEIsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0lBQ3hCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUk7SUFDMUIsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtJQUMxQixZQUFZLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0IsWUFBWSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDckIsU0FBUztJQUNULEtBQUssQ0FBQyxDQUFDO0lBQ1AsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztJQUN4QixRQUFRLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBT0Q7SUFDQTtJQUNBO0lBQ0E7SUFDQSxTQUFTLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDeEIsSUFBSSxJQUFJLElBQUksQ0FBQztJQUNiLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUM7SUFDeEIsUUFBUSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkIsSUFBSSxPQUFPO0lBQ1gsUUFBUSxPQUFPLEVBQUUsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJO0lBQ3hDLFlBQVksS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzFELFNBQVMsQ0FBQztJQUNWLFFBQVEsS0FBSyxHQUFHO0lBQ2hCLFlBQVksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixTQUFTO0lBQ1QsS0FBSyxDQUFDO0lBQ04sQ0FBQztBQUNEO0lBQ0EsU0FBUyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRTtJQUM5QixJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNELFNBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0lBQ3RDLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFDRCxTQUFTLE1BQU0sQ0FBQyxJQUFJLEVBQUU7SUFDdEIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsU0FBUyxZQUFZLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRTtJQUM3QyxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDbkQsUUFBUSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDekIsWUFBWSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFO0lBQ3ZCLElBQUksT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFnQkQsU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFO0lBQzNCLElBQUksT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFDRCxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDcEIsSUFBSSxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUNELFNBQVMsS0FBSyxHQUFHO0lBQ2pCLElBQUksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUNELFNBQVMsS0FBSyxHQUFHO0lBQ2pCLElBQUksT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUNELFNBQVMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUMvQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELElBQUksT0FBTyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFDRCxTQUFTLGVBQWUsQ0FBQyxFQUFFLEVBQUU7SUFDN0IsSUFBSSxPQUFPLFVBQVUsS0FBSyxFQUFFO0lBQzVCLFFBQVEsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQy9CO0lBQ0EsUUFBUSxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLEtBQUssQ0FBQztJQUNOLENBQUM7SUFlRCxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRTtJQUN0QyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUk7SUFDckIsUUFBUSxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLFNBQVMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUs7SUFDbkQsUUFBUSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBMkRELFNBQVMsUUFBUSxDQUFDLE9BQU8sRUFBRTtJQUMzQixJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQWtERCxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7SUFDaEQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQTZFRCxTQUFTLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtJQUM3QyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQ0QsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtJQUNwQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDbEQsSUFBSSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELElBQUksT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0FBbUxEO0lBQ0EsSUFBSSxpQkFBaUIsQ0FBQztJQUN0QixTQUFTLHFCQUFxQixDQUFDLFNBQVMsRUFBRTtJQUMxQyxJQUFJLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztJQUNsQyxDQUFDO0lBQ0QsU0FBUyxxQkFBcUIsR0FBRztJQUNqQyxJQUFJLElBQUksQ0FBQyxpQkFBaUI7SUFDMUIsUUFBUSxNQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7SUFDNUUsSUFBSSxPQUFPLGlCQUFpQixDQUFDO0lBQzdCLENBQUM7SUFDRCxTQUFTLFlBQVksQ0FBQyxFQUFFLEVBQUU7SUFDMUIsSUFBSSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFDRCxTQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7SUFDckIsSUFBSSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFJRCxTQUFTLFNBQVMsQ0FBQyxFQUFFLEVBQUU7SUFDdkIsSUFBSSxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFDRCxTQUFTLHFCQUFxQixHQUFHO0lBQ2pDLElBQUksTUFBTSxTQUFTLEdBQUcscUJBQXFCLEVBQUUsQ0FBQztJQUM5QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxLQUFLO0lBQzdCLFFBQVEsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkQsUUFBUSxJQUFJLFNBQVMsRUFBRTtJQUN2QjtJQUNBO0lBQ0EsWUFBWSxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3JELFlBQVksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUk7SUFDNUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2YsU0FBUztJQUNULEtBQUssQ0FBQztJQUNOLENBQUM7SUFDRCxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFO0lBQ2xDLElBQUkscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUNELFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUN6QixJQUFJLE9BQU8scUJBQXFCLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQ0Q7SUFDQTtJQUNBO0lBQ0EsU0FBUyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRTtJQUNsQyxJQUFJLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6RCxJQUFJLElBQUksU0FBUyxFQUFFO0lBQ25CLFFBQVEsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDbkQsS0FBSztJQUNMLENBQUM7QUFDRDtJQUNBLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0lBRTVCLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDO0lBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0lBQzVCLE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUMzQixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQyxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztJQUM3QixTQUFTLGVBQWUsR0FBRztJQUMzQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtJQUMzQixRQUFRLGdCQUFnQixHQUFHLElBQUksQ0FBQztJQUNoQyxRQUFRLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxLQUFLO0lBQ0wsQ0FBQztJQUNELFNBQVMsSUFBSSxHQUFHO0lBQ2hCLElBQUksZUFBZSxFQUFFLENBQUM7SUFDdEIsSUFBSSxPQUFPLGdCQUFnQixDQUFDO0lBQzVCLENBQUM7SUFDRCxTQUFTLG1CQUFtQixDQUFDLEVBQUUsRUFBRTtJQUNqQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBSUQsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakMsU0FBUyxLQUFLLEdBQUc7SUFDakIsSUFBSSxJQUFJLFFBQVE7SUFDaEIsUUFBUSxPQUFPO0lBQ2YsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLElBQUksR0FBRztJQUNQO0lBQ0E7SUFDQSxRQUFRLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUM3RCxZQUFZLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELFlBQVkscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDN0MsWUFBWSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLFNBQVM7SUFDVCxRQUFRLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLFFBQVEsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNwQyxRQUFRLE9BQU8saUJBQWlCLENBQUMsTUFBTTtJQUN2QyxZQUFZLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7SUFDdEM7SUFDQTtJQUNBO0lBQ0EsUUFBUSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDN0QsWUFBWSxNQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqRCxZQUFZLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0lBQy9DO0lBQ0EsZ0JBQWdCLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0MsZ0JBQWdCLFFBQVEsRUFBRSxDQUFDO0lBQzNCLGFBQWE7SUFDYixTQUFTO0lBQ1QsUUFBUSxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLEtBQUssUUFBUSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7SUFDdEMsSUFBSSxPQUFPLGVBQWUsQ0FBQyxNQUFNLEVBQUU7SUFDbkMsUUFBUSxlQUFlLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztJQUNoQyxLQUFLO0lBQ0wsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7SUFDN0IsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRCxTQUFTLE1BQU0sQ0FBQyxFQUFFLEVBQUU7SUFDcEIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO0lBQzlCLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3BCLFFBQVEsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNsQyxRQUFRLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDL0IsUUFBUSxFQUFFLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixRQUFRLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRCxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDckQsS0FBSztJQUNMLENBQUM7SUFlRCxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQzNCLElBQUksTUFBTSxDQUFDO0lBQ1gsU0FBUyxZQUFZLEdBQUc7SUFDeEIsSUFBSSxNQUFNLEdBQUc7SUFDYixRQUFRLENBQUMsRUFBRSxDQUFDO0lBQ1osUUFBUSxDQUFDLEVBQUUsRUFBRTtJQUNiLFFBQVEsQ0FBQyxFQUFFLE1BQU07SUFDakIsS0FBSyxDQUFDO0lBQ04sQ0FBQztJQUNELFNBQVMsWUFBWSxHQUFHO0lBQ3hCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7SUFDbkIsUUFBUSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLEtBQUs7SUFDTCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxTQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO0lBQ3JDLElBQUksSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRTtJQUMxQixRQUFRLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZCLEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFO0lBQ3hELElBQUksSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRTtJQUMxQixRQUFRLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7SUFDL0IsWUFBWSxPQUFPO0lBQ25CLFFBQVEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixRQUFRLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU07SUFDNUIsWUFBWSxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLFlBQVksSUFBSSxRQUFRLEVBQUU7SUFDMUIsZ0JBQWdCLElBQUksTUFBTTtJQUMxQixvQkFBb0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixnQkFBZ0IsUUFBUSxFQUFFLENBQUM7SUFDM0IsYUFBYTtJQUNiLFNBQVMsQ0FBQyxDQUFDO0lBQ1gsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZCLEtBQUs7SUFDTCxDQUFDO0FBc1NEO0lBQ0EsTUFBTSxPQUFPLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVztJQUM5QyxNQUFNLE1BQU07SUFDWixNQUFNLE9BQU8sVUFBVSxLQUFLLFdBQVc7SUFDdkMsVUFBVSxVQUFVO0lBQ3BCLFVBQVUsTUFBTSxDQUFDLENBQUM7QUF3R2xCO0lBQ0EsU0FBUyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0lBQzVDLElBQUksTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLElBQUksTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBQzNCLElBQUksTUFBTSxhQUFhLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDekMsSUFBSSxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzFCLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRTtJQUNoQixRQUFRLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFRLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixRQUFRLElBQUksQ0FBQyxFQUFFO0lBQ2YsWUFBWSxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRTtJQUNqQyxnQkFBZ0IsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDL0Isb0JBQW9CLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsYUFBYTtJQUNiLFlBQVksS0FBSyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUU7SUFDakMsZ0JBQWdCLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDekMsb0JBQW9CLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsb0JBQW9CLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0MsaUJBQWlCO0lBQ2pCLGFBQWE7SUFDYixZQUFZLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsU0FBUztJQUNULGFBQWE7SUFDYixZQUFZLEtBQUssTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFO0lBQ2pDLGdCQUFnQixhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZDLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksS0FBSyxNQUFNLEdBQUcsSUFBSSxXQUFXLEVBQUU7SUFDbkMsUUFBUSxJQUFJLEVBQUUsR0FBRyxJQUFJLE1BQU0sQ0FBQztJQUM1QixZQUFZLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDcEMsS0FBSztJQUNMLElBQUksT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNELFNBQVMsaUJBQWlCLENBQUMsWUFBWSxFQUFFO0lBQ3pDLElBQUksT0FBTyxPQUFPLFlBQVksS0FBSyxRQUFRLElBQUksWUFBWSxLQUFLLElBQUksR0FBRyxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3pGLENBQUM7SUFpSkQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUU7SUFDakMsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFJRCxTQUFTLGVBQWUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRTtJQUNwRCxJQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDO0lBQzFFLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNDO0lBQ0EsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNO0lBQzlCLFFBQVEsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDckUsUUFBUSxJQUFJLFVBQVUsRUFBRTtJQUN4QixZQUFZLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQztJQUMvQyxTQUFTO0lBQ1QsYUFBYTtJQUNiO0lBQ0E7SUFDQSxZQUFZLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNwQyxTQUFTO0lBQ1QsUUFBUSxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDbkMsS0FBSyxDQUFDLENBQUM7SUFDUCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBQ0QsU0FBUyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFO0lBQ2pELElBQUksTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQztJQUM1QixJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUU7SUFDOUIsUUFBUSxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9CLFFBQVEsRUFBRSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRDtJQUNBO0lBQ0EsUUFBUSxFQUFFLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQzNDLFFBQVEsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDcEIsS0FBSztJQUNMLENBQUM7SUFDRCxTQUFTLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFO0lBQ2xDLElBQUksSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtJQUN0QyxRQUFRLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6QyxRQUFRLGVBQWUsRUFBRSxDQUFDO0lBQzFCLFFBQVEsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLEtBQUs7SUFDTCxJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNELFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0YsSUFBSSxNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDO0lBQy9DLElBQUkscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckMsSUFBSSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztJQUM1QyxJQUFJLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLEdBQUc7SUFDOUIsUUFBUSxRQUFRLEVBQUUsSUFBSTtJQUN0QixRQUFRLEdBQUcsRUFBRSxJQUFJO0lBQ2pCO0lBQ0EsUUFBUSxLQUFLO0lBQ2IsUUFBUSxNQUFNLEVBQUUsSUFBSTtJQUNwQixRQUFRLFNBQVM7SUFDakIsUUFBUSxLQUFLLEVBQUUsWUFBWSxFQUFFO0lBQzdCO0lBQ0EsUUFBUSxRQUFRLEVBQUUsRUFBRTtJQUNwQixRQUFRLFVBQVUsRUFBRSxFQUFFO0lBQ3RCLFFBQVEsYUFBYSxFQUFFLEVBQUU7SUFDekIsUUFBUSxZQUFZLEVBQUUsRUFBRTtJQUN4QixRQUFRLE9BQU8sRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUM3RTtJQUNBLFFBQVEsU0FBUyxFQUFFLFlBQVksRUFBRTtJQUNqQyxRQUFRLEtBQUs7SUFDYixRQUFRLFVBQVUsRUFBRSxLQUFLO0lBQ3pCLEtBQUssQ0FBQztJQUNOLElBQUksSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksRUFBRSxDQUFDLEdBQUcsR0FBRyxRQUFRO0lBQ3JCLFVBQVUsUUFBUSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxLQUFLO0lBQ2hFLFlBQVksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ3RELFlBQVksSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLEVBQUU7SUFDbkUsZ0JBQWdCLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2pELG9CQUFvQixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLGdCQUFnQixJQUFJLEtBQUs7SUFDekIsb0JBQW9CLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0MsYUFBYTtJQUNiLFlBQVksT0FBTyxHQUFHLENBQUM7SUFDdkIsU0FBUyxDQUFDO0lBQ1YsVUFBVSxFQUFFLENBQUM7SUFDYixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNoQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDakIsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzlCO0lBQ0EsSUFBSSxFQUFFLENBQUMsUUFBUSxHQUFHLGVBQWUsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNwRSxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtJQUN4QixRQUFRLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtJQUM3QixZQUFZLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkQ7SUFDQSxZQUFZLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsWUFBWSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLFNBQVM7SUFDVCxhQUFhO0lBQ2I7SUFDQSxZQUFZLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMzQyxTQUFTO0lBQ1QsUUFBUSxJQUFJLE9BQU8sQ0FBQyxLQUFLO0lBQ3pCLFlBQVksYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakQsUUFBUSxlQUFlLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25FLFFBQVEsS0FBSyxFQUFFLENBQUM7SUFDaEIsS0FBSztJQUNMLElBQUkscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBeUNELE1BQU0sZUFBZSxDQUFDO0lBQ3RCLElBQUksUUFBUSxHQUFHO0lBQ2YsUUFBUSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztJQUM3QixLQUFLO0lBQ0wsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtJQUN4QixRQUFRLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEYsUUFBUSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLFFBQVEsT0FBTyxNQUFNO0lBQ3JCLFlBQVksTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0RCxZQUFZLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQztJQUM1QixnQkFBZ0IsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDM0MsU0FBUyxDQUFDO0lBQ1YsS0FBSztJQUNMLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtJQUNsQixRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtJQUM5QyxZQUFZLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN0QyxZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsWUFBWSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDdkMsU0FBUztJQUNULEtBQUs7SUFDTCxDQUFDO0FBQ0Q7SUFDQSxTQUFTLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0lBQ3BDLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFDRCxTQUFTLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFO0lBQ2xDLElBQUksWUFBWSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdEQsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFDRCxTQUFTLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtJQUMxQyxJQUFJLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUM5RCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFDRCxTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUU7SUFDMUIsSUFBSSxZQUFZLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFnQkQsU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLG9CQUFvQixFQUFFO0lBQzlGLElBQUksTUFBTSxTQUFTLEdBQUcsT0FBTyxLQUFLLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDdkcsSUFBSSxJQUFJLG1CQUFtQjtJQUMzQixRQUFRLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN6QyxJQUFJLElBQUksb0JBQW9CO0lBQzVCLFFBQVEsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzFDLElBQUksWUFBWSxDQUFDLDJCQUEyQixFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUNuRixJQUFJLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxRCxJQUFJLE9BQU8sTUFBTTtJQUNqQixRQUFRLFlBQVksQ0FBQyw4QkFBOEIsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDMUYsUUFBUSxPQUFPLEVBQUUsQ0FBQztJQUNsQixLQUFLLENBQUM7SUFDTixDQUFDO0lBQ0QsU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUU7SUFDMUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNqQyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUk7SUFDckIsUUFBUSxZQUFZLENBQUMsMEJBQTBCLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUN0RTtJQUNBLFFBQVEsWUFBWSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFDRCxTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRTtJQUN6QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDM0IsSUFBSSxZQUFZLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUtELFNBQVMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7SUFDbEMsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztJQUNyQixJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJO0lBQy9CLFFBQVEsT0FBTztJQUNmLElBQUksWUFBWSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNELElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUNELFNBQVMsc0JBQXNCLENBQUMsR0FBRyxFQUFFO0lBQ3JDLElBQUksSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksRUFBRSxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLFFBQVEsSUFBSSxHQUFHLENBQUMsRUFBRTtJQUN6RixRQUFRLElBQUksR0FBRyxHQUFHLGdEQUFnRCxDQUFDO0lBQ25FLFFBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLElBQUksR0FBRyxFQUFFO0lBQzNFLFlBQVksR0FBRyxJQUFJLCtEQUErRCxDQUFDO0lBQ25GLFNBQVM7SUFDVCxRQUFRLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsS0FBSztJQUNMLENBQUM7SUFDRCxTQUFTLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtJQUMxQyxJQUFJLEtBQUssTUFBTSxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUM5QyxRQUFRLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7SUFDdEMsWUFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQywrQkFBK0IsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNqRixTQUFTO0lBQ1QsS0FBSztJQUNMLENBQUM7SUFDRCxNQUFNLGtCQUFrQixTQUFTLGVBQWUsQ0FBQztJQUNqRCxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUU7SUFDekIsUUFBUSxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtJQUNoRSxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztJQUM3RCxTQUFTO0lBQ1QsUUFBUSxLQUFLLEVBQUUsQ0FBQztJQUNoQixLQUFLO0lBQ0wsSUFBSSxRQUFRLEdBQUc7SUFDZixRQUFRLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN6QixRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTTtJQUM5QixZQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUM1RCxTQUFTLENBQUM7SUFDVixLQUFLO0lBQ0wsSUFBSSxjQUFjLEdBQUcsR0FBRztJQUN4QixJQUFJLGFBQWEsR0FBRyxHQUFHO0lBQ3ZCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OERDaGtEYSxHQUFPLHdCQUFNLEdBQUksNEJBQUcsR0FBVyw4QkFBRyxHQUFhOztxRUFEekMsR0FBSSx3QkFBRyxHQUFPLHdCQUFJLEdBQU0sT0FBSSxTQUFTLElBQUssRUFBRSx1QkFBSSxHQUFPLE9BQUksVUFBVSxJQUFLLEVBQUU7MERBQXVCLEdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7NkhBQ3BILEdBQU8sd0JBQU0sR0FBSSw0QkFBRyxHQUFXLDhCQUFHLEdBQWE7Ozs7eUhBRHpDLEdBQUksd0JBQUcsR0FBTyx3QkFBSSxHQUFNLE9BQUksU0FBUyxJQUFLLEVBQUUsdUJBQUksR0FBTyxPQUFJLFVBQVUsSUFBSyxFQUFFOzs7OzsyREFBdUIsR0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FuRHBILElBQUksR0FBRyxFQUFFO1dBQ1QsSUFBSSxHQUFHLEtBQUs7V0FDWixJQUFJO1dBQ0osSUFBSSxHQUFHLEVBQUU7V0FDVCxXQUFXLEdBQUcsRUFBRTtXQUNoQixVQUFVLEdBQUcsRUFBRTtXQUNmLFdBQVcsR0FBRyxLQUFLO1dBQ25CLE1BQU0sR0FBRyxLQUFLO1dBQ2QsT0FBTyxHQUFHLEtBQUs7U0FFdEIsYUFBYSxHQUFHLEVBQUU7U0FDbEIsT0FBTyxHQUFHLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFFYixPQUFPLEdBQUcsSUFBSSxJQUFJLEtBQUs7Ozs7O1lBR3BCLFVBQVUsa0JBQUUsYUFBYSxHQUFHLFVBQVU7aUJBRWhDLElBQUk7ZUFDTCxVQUFVOztlQUVWLFdBQVc7MkJBQ2QsYUFBYSxHQUFHLE9BQU87O2VBRXBCLFVBQVU7MkJBQ2IsYUFBYSxHQUFHLE9BQU87OzsyQkFHdkIsYUFBYSxHQUFHLEVBQUU7Ozs7Ozs7O2FBTW5CLElBQUksa0JBQUUsT0FBTyxHQUFHLEVBQUU7WUFDbkIsU0FBUzs7bUJBQ0YsSUFBSSxLQUFLLFFBQVE7U0FDMUIsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRzs7a0JBRWpCLEdBQUcsSUFBSSxJQUFJO2NBQ2QsSUFBSSxDQUFDLEdBQUc7V0FDVixTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHOzs7Ozs7WUFLM0IsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLGtCQUFFLE9BQU8sR0FBRyxFQUFFLHdCQUNsQyxPQUFPLGVBQWUsU0FBUyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQzdDMUMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFXNUI7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxFQUFFO0lBQ3ZDLElBQUksSUFBSSxJQUFJLENBQUM7SUFDYixJQUFJLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQztJQUMzQixJQUFJLFNBQVMsR0FBRyxDQUFDLFNBQVMsRUFBRTtJQUM1QixRQUFRLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRTtJQUM5QyxZQUFZLEtBQUssR0FBRyxTQUFTLENBQUM7SUFDOUIsWUFBWSxJQUFJLElBQUksRUFBRTtJQUN0QixnQkFBZ0IsTUFBTSxTQUFTLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7SUFDM0QsZ0JBQWdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDaEUsb0JBQW9CLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDM0Isb0JBQW9CLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEQsaUJBQWlCO0lBQ2pCLGdCQUFnQixJQUFJLFNBQVMsRUFBRTtJQUMvQixvQkFBb0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3pFLHdCQUF3QixnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxxQkFBcUI7SUFDckIsb0JBQW9CLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDaEQsaUJBQWlCO0lBQ2pCLGFBQWE7SUFDYixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksU0FBUyxNQUFNLENBQUMsRUFBRSxFQUFFO0lBQ3hCLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3ZCLEtBQUs7SUFDTCxJQUFJLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRSxVQUFVLEdBQUcsSUFBSSxFQUFFO0lBQy9DLFFBQVEsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDN0MsUUFBUSxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3JDLFFBQVEsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtJQUN0QyxZQUFZLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ3RDLFNBQVM7SUFDVCxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQixRQUFRLE9BQU8sTUFBTTtJQUNyQixZQUFZLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUQsWUFBWSxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtJQUM5QixnQkFBZ0IsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0MsYUFBYTtJQUNiLFlBQVksSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtJQUMxQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7SUFDdkIsZ0JBQWdCLElBQUksR0FBRyxJQUFJLENBQUM7SUFDNUIsYUFBYTtJQUNiLFNBQVMsQ0FBQztJQUNWLEtBQUs7SUFDTCxJQUFJLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ3RDOztJQzNEQSxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUU7SUFDdEIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxlQUFlLENBQUM7SUFDbkUsQ0FBQztBQUNEO0lBQ0EsU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFO0lBQ25FLElBQUksSUFBSSxPQUFPLGFBQWEsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO0lBQ3JFO0lBQ0EsUUFBUSxNQUFNLEtBQUssR0FBRyxZQUFZLEdBQUcsYUFBYSxDQUFDO0lBQ25EO0lBQ0EsUUFBUSxNQUFNLFFBQVEsR0FBRyxDQUFDLGFBQWEsR0FBRyxVQUFVLEtBQUssR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDM0UsUUFBUSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDbEQsUUFBUSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7SUFDbkQsUUFBUSxNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQztJQUM5RCxRQUFRLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLFlBQVksSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3JELFFBQVEsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7SUFDdEYsWUFBWSxPQUFPLFlBQVksQ0FBQztJQUNoQyxTQUFTO0lBQ1QsYUFBYTtJQUNiLFlBQVksR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDaEM7SUFDQSxZQUFZLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUN6QyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDMUUsU0FBUztJQUNULEtBQUs7SUFDTCxTQUFTLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUMzQztJQUNBLFFBQVEsT0FBTyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxXQUFXLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvRyxLQUFLO0lBQ0wsU0FBUyxJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRTtJQUNoRCxRQUFRLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUM5QixRQUFRLEtBQUssTUFBTSxDQUFDLElBQUksYUFBYSxFQUFFO0lBQ3ZDO0lBQ0EsWUFBWSxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9GLFNBQVM7SUFDVDtJQUNBLFFBQVEsT0FBTyxVQUFVLENBQUM7SUFDMUIsS0FBSztJQUNMLFNBQVM7SUFDVCxRQUFRLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxjQUFjLEVBQUUsT0FBTyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN4RSxLQUFLO0lBQ0wsQ0FBQztJQUNELFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFO0lBQ2xDLElBQUksTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLElBQUksTUFBTSxFQUFFLFNBQVMsR0FBRyxJQUFJLEVBQUUsT0FBTyxHQUFHLEdBQUcsRUFBRSxTQUFTLEdBQUcsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ3ZFLElBQUksSUFBSSxTQUFTLENBQUM7SUFDbEIsSUFBSSxJQUFJLElBQUksQ0FBQztJQUNiLElBQUksSUFBSSxhQUFhLENBQUM7SUFDdEIsSUFBSSxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDM0IsSUFBSSxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDN0IsSUFBSSxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDckIsSUFBSSxJQUFJLHNCQUFzQixHQUFHLENBQUMsQ0FBQztJQUNuQyxJQUFJLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztJQUM1QixJQUFJLFNBQVMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFO0lBQ3ZDLFFBQVEsWUFBWSxHQUFHLFNBQVMsQ0FBQztJQUNqQyxRQUFRLE1BQU0sS0FBSyxHQUFHLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFDekMsUUFBUSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxFQUFFO0lBQzFGLFlBQVksV0FBVyxHQUFHLElBQUksQ0FBQztJQUMvQixZQUFZLFNBQVMsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUM5QixZQUFZLFVBQVUsR0FBRyxTQUFTLENBQUM7SUFDbkMsWUFBWSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsQ0FBQztJQUM1QyxZQUFZLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3JDLFNBQVM7SUFDVCxhQUFhLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtJQUM1QixZQUFZLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDOUQsWUFBWSxzQkFBc0IsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3JELFlBQVksUUFBUSxHQUFHLENBQUMsQ0FBQztJQUN6QixTQUFTO0lBQ1QsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ25CLFlBQVksU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQzlCLFlBQVksV0FBVyxHQUFHLEtBQUssQ0FBQztJQUNoQyxZQUFZLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJO0lBQy9CLGdCQUFnQixJQUFJLFdBQVcsRUFBRTtJQUNqQyxvQkFBb0IsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUN4QyxvQkFBb0IsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNoQyxvQkFBb0IsT0FBTyxLQUFLLENBQUM7SUFDakMsaUJBQWlCO0lBQ2pCLGdCQUFnQixRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDMUUsZ0JBQWdCLE1BQU0sR0FBRyxHQUFHO0lBQzVCLG9CQUFvQixRQUFRO0lBQzVCLG9CQUFvQixJQUFJLEVBQUUsTUFBTTtJQUNoQyxvQkFBb0IsT0FBTyxFQUFFLElBQUk7SUFDakMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxTQUFTLElBQUksRUFBRSxHQUFHLElBQUk7SUFDckQsaUJBQWlCLENBQUM7SUFDbEIsZ0JBQWdCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNyRixnQkFBZ0IsU0FBUyxHQUFHLEdBQUcsQ0FBQztJQUNoQyxnQkFBZ0IsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUNuQyxnQkFBZ0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUM7SUFDOUMsZ0JBQWdCLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTtJQUNqQyxvQkFBb0IsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNoQyxpQkFBaUI7SUFDakIsZ0JBQWdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO0lBQ3BDLGFBQWEsQ0FBQyxDQUFDO0lBQ2YsU0FBUztJQUNULFFBQVEsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUk7SUFDckMsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNO0lBQ3BDLGdCQUFnQixJQUFJLEtBQUssS0FBSyxhQUFhO0lBQzNDLG9CQUFvQixNQUFNLEVBQUUsQ0FBQztJQUM3QixhQUFhLENBQUMsQ0FBQztJQUNmLFNBQVMsQ0FBQyxDQUFDO0lBQ1gsS0FBSztJQUNMLElBQUksTUFBTSxNQUFNLEdBQUc7SUFDbkIsUUFBUSxHQUFHO0lBQ1gsUUFBUSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQztJQUNoRSxRQUFRLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUztJQUNsQyxRQUFRLFNBQVM7SUFDakIsUUFBUSxPQUFPO0lBQ2YsUUFBUSxTQUFTO0lBQ2pCLEtBQUssQ0FBQztJQUNOLElBQUksT0FBTyxNQUFNLENBQUM7SUFDbEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JDMUIwQixHQUFHLEtBQUMsUUFBUTtzQkFBUSxHQUFHLEtBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7OzZEQUE1QixHQUFHLEtBQUMsUUFBUTs2REFBUSxHQUFHLEtBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFHbkMsR0FBRyxLQUFDLEtBQUs7Ozs7Ozs0QkFKWCxHQUFHLEtBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7OytDQUZJLEdBQUssdUJBQUssR0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O21CQUUvQixHQUFHLEtBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0ZBSU4sR0FBRyxLQUFDLEtBQUs7OztnREFOQyxHQUFLLHVCQUFLLEdBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztnQ0FEbkMsR0FBSzs7OztvQ0FBVixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O21FQUZRLEdBQUkseUJBQUcsR0FBUSxzQkFBRyxHQUFLOzs7OztzREFERyxHQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrQkFHekMsR0FBSzs7OzttQ0FBVixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7OzRCQUFKLE1BQUk7Ozs7Ozs7d0hBRlEsR0FBSSx5QkFBRyxHQUFRLHNCQUFHLEdBQUs7Ozs7Ozs7Ozs7O3VEQURHLEdBQVE7Ozs7OztzQ0FHOUMsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBOUVKLFFBQVEsR0FBRyxxQkFBcUI7V0FLM0IsS0FBSyxHQUFHLENBQUM7V0FNVCxJQUFJLEdBQUcsRUFBRTtXQU1ULFFBQVEsR0FBRyxFQUFFO1dBTWIsS0FBSyxHQUFHLEVBQUU7V0FFVixRQUFRLEdBQUcsS0FBSztTQUV2QixTQUFTLEdBQUcsQ0FBQztXQUdYLElBQUksR0FBRyxRQUFROzs7V0FFZixTQUFTLEtBQ2IsU0FBUyxFQUNULElBQUk7S0FHTixVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVM7OztXQUd0QixXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1VBQy9CLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsS0FBSyxHQUFHLENBQUM7T0FDeEMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVU7V0FDeEIsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVE7Ozs7Y0FJNUIsU0FBUyxDQUFDLFNBQVM7WUFDcEIsRUFBRSxHQUFHQSxlQUFHLENBQUMsSUFBSTs7O1VBRWYsRUFBRSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQVU7O1VBQ3ZDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFROzs7c0JBRXpDLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVM7O01BQzNDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTOzs7S0FHeEMsT0FBTztNQUNMLFNBQVMsQ0FBQyxTQUFTOzs7S0FHckIsU0FBUztNQUNQLFdBQVc7Ozs7Ozs7OztvQ0FrQmtDLFNBQVMsQ0FBQyxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBcEQzRCxTQUFTLENBQUMsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUVDaUVOLEdBQVM7d0VBR1AsR0FBTTtpREFGSCxHQUFNOzs7Ozs7Ozs7Ozs7Ozs7OztxRUFHTCxHQUFhOzs7Ozs7Ozs7OztpSEFKbkIsR0FBUzs7Ozs4R0FHUCxHQUFNOzs7OztrREFGSCxHQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQTVGWixLQUFLO1dBS0wsSUFBSSxHQUFHLEVBQUU7V0FNVCxRQUFRLEdBQUcsRUFBRTtTQUVwQixNQUFNLEdBQUcsS0FBSztTQUVkLEVBQUU7U0FDRixLQUFLO1NBQ0wsUUFBUSxHQUFHLEtBQUs7U0FDaEIsU0FBUyxHQUFHLEVBQUU7U0FDZCxJQUFJLEdBQUcsS0FBSztXQUVWLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTTs7b0JBRWIsU0FBUyxHQUFHLElBQUksRUFBRSxFQUFFO1VBQ3BDLElBQUksS0FBSyxFQUFFOzs7VUFHWCxJQUFJLEtBQUssS0FBSzs7dUJBRWhCLFNBQVMsR0FBRyxLQUFLLEdBQUcsRUFBRSxHQUFHLE1BQU0sR0FBRyxPQUFPO2lCQUNoQyxFQUFFLEtBQUssS0FBSzs7O3VCQUdyQixNQUFNLEdBQUcsSUFBSTs7dUJBQ2IsU0FBUyxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLE1BQU07O3NCQUd0QyxTQUFTLEdBQUcsRUFBRTs7O2NBR2QsV0FBVztXQUNiLEVBQUU7TUFDUCxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUU7OztvQkFHbEQsYUFBYSxDQUFDLEtBQUs7OztzQkFHaEMsTUFBTSxHQUFHLEtBQUssS0FBSyxTQUFTLENBQUMsU0FBUzs7WUFDaEMsSUFBSTtzQkFDVixTQUFTLEdBQUcsRUFBRTs7O0tBR2hCLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7TUFDM0IsV0FBVzs7O0tBR2IsT0FBTztNQUNMLFdBQVc7O01BRVgsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTtVQUNyQixJQUFJOztRQUVMLEtBQUs7UUFDTCxLQUFLO1FBQ0wsSUFBSTtRQUNKLFFBQVE7UUFDUixRQUFRLHdCQUFTLE1BQU0sR0FBRyxJQUFJO1FBQzlCLFVBQVUsd0JBQVMsTUFBTSxHQUFHLEtBQUs7UUFDakMsU0FBUzs7Ozs7S0FLZixZQUFZO1VBQ04sS0FBSyxLQUFLLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUzthQUN0QyxJQUFJOztPQUNWLFVBQVU7d0JBQ1IsU0FBUyxHQUFHLEVBQUU7Ozs7Ozs7Ozs7Ozs7T0FlVCxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDbEdSLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQztJQUMvQixFQUFFLFlBQVksRUFBRSxLQUFLO0lBQ3JCLEVBQUUsWUFBWSxFQUFFLElBQUk7SUFDcEIsRUFBRSxVQUFVLEVBQUUsSUFBSTtJQUNsQixFQUFFLE9BQU8sRUFBRSxFQUFFO0lBQ2IsRUFBRSxLQUFLLEVBQUUsRUFBRTtJQUNYLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDVixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZEQ0FzQyxHQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FSbEMsR0FBRzs7Y0FFTCxNQUFNO2FBQ04sR0FBRywyQkFBMkIsR0FBRyxTQUFTLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MkRDd0VYLEdBQU07Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBM0VyQyxHQUFHO1dBS1IsUUFBUSxHQUFHLHFCQUFxQjtTQUVsQyxVQUFVOztjQUNMLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTTtVQUV6QixLQUFLO1VBQ0wsT0FBTztVQUNQLE9BQU8sR0FBRyxDQUFDO1lBQ1QsTUFBTSxHQUFHLE1BQU0sR0FBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQ3ZDLFNBQVMsRUFBRSxHQUFHLEVBQ2QsT0FBTyxFQUFFLEdBQUc7O01BR1osTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNO2FBQ2YsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVOztXQUMxQixNQUFNO2NBQ0YsSUFBSSxHQUFHLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxJQUFJO1FBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxtQkFBbUIsSUFBSTs7OztNQUk3QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGVBQWU7O2VBRXpDLGVBQWUsQ0FBQyxLQUFLO09BQzVCLEtBQUssQ0FBQyxjQUFjO09BQ3RCLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTztPQUNuQixPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVO09BQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVM7T0FFNUIsUUFBUSxDQUFDLFdBQVcsSUFBRyxNQUFNLEVBQUMsSUFBSSxFQUFFLEtBQUs7T0FFM0MsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxlQUFlO09BQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYTs7O2VBR3ZDLGVBQWUsQ0FBQyxDQUFDO09BQ3hCLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUs7T0FDNUIsTUFBTSxDQUFDLEdBQUcsR0FBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDO09BRTlCLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTzs7T0FDZixRQUFRLENBQUMsTUFBTTtRQUFHLE1BQU0sRUFBQyxJQUFJO1FBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVTs7OztlQUd4RCxhQUFhLENBQUMsS0FBSztPQUMxQixPQUFPLEdBQUcsQ0FBQztPQUNYLFVBQVUsR0FBRyxJQUFJO09BQ2pCLEtBQUssR0FBRyxTQUFTO09BQ2pCLE9BQU8sR0FBRyxTQUFTO09BRW5CLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVM7T0FDL0IsTUFBTSxDQUFDLEdBQUcsR0FBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQzs7T0FDcEMsUUFBUSxDQUFDLFNBQVM7UUFBRyxNQUFNLEVBQUUsSUFBSTtRQUFFLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVU7OztPQUVyRSxNQUFNLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLGVBQWU7T0FDdkQsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxhQUFhOzs7O09BSW5ELE9BQU87UUFDTixJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLGVBQWU7Ozs7O2NBSy9DLE1BQU07YUFDTixHQUFHLDJCQUEyQixHQUFHLFNBQVMsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQ0M3Q2hDLEdBQU87eUNBQWMsR0FBTzs7Ozs7Ozs7Ozs7MkRBRGpCLEdBQU0sYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytGQUFYLEdBQU0sYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0F6QmhDLEdBQUc7V0FDSCxJQUFJO1dBS1QsUUFBUSxHQUFHLHFCQUFxQjs7Y0FFN0IsTUFBTTtVQUNULEdBQUcsWUFBWSxJQUFJLDBCQUEwQixJQUFJOztVQUNqRCxHQUFHO09BQ0wsR0FBRyw0QkFBNEIsR0FBRzs7O2FBRTdCLEdBQUc7OztjQUdILE9BQU8sQ0FBQyxDQUFDO01BQ2hCLFFBQVEsQ0FBQyxNQUFNLEVBQUcsQ0FBQyxDQUFDLE1BQU07OztjQUduQixPQUFPLENBQUMsQ0FBQztNQUNoQixRQUFRLENBQUMsU0FBUyxFQUFHLENBQUMsQ0FBQyxNQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0NDQ0MsR0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQUFMLEdBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzswQkFGNUIsR0FBSzs7Ozs7OzBEQUFMLEdBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsyQkFESSxHQUFLLFFBQUssUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQVM4QixHQUFLO2lDQUFmLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUZBQU0sR0FBSzs7O3FEQUFmLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQUZaLEdBQUs7aUNBQWYsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1RkFBTSxHQUFLOzs7cURBQWYsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBRGpDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQU9rQixHQUFPLGtCQUFQLEdBQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQUQ5QixHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFBSixHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQS9CQSxJQUFJO1dBQ0osSUFBSTtXQUNKLEtBQUs7V0FDTCxPQUFPO1dBQ1AsSUFBSSxHQUFHLENBQUM7V0FDUixLQUFLO1dBQ0wsR0FBRyxHQUFHLElBQUk7V0FDVixHQUFHLEdBQUcsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkNnRVgsSUFBSSxhQUFDLEdBQU8sSUFBQyxJQUFJOzs7O29DQUF0QixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs2REFJK0IsR0FBTyxJQUFDLFVBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3REFBYSxHQUFLOzs7Ozs7cUJBSmxFLElBQUksYUFBQyxHQUFPLElBQUMsSUFBSTs7OzttQ0FBdEIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0FBSixNQUFJOzs7bUdBSStCLEdBQU8sSUFBQyxVQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkFGNUIsR0FBSTs7Ozs7Ozs7Ozs7Ozt1RUFBcEIsR0FBTSxhQUFDLEdBQUk7Ozs7Ozs7Ozs4Q0FEZ0IsTUFBTTs7Ozs7c0VBQ2pCLEdBQUk7O2tHQUFwQixHQUFNLGFBQUMsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0RBV2lCLEdBQU8sSUFBQyxZQUFZOzs7K0RBQ3BCLEdBQU8sSUFBQyxZQUFZOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NDQUhuQixNQUFNO3NDQUNOLE9BQU87a0RBQ3lCLEdBQU87a0RBQ1AsR0FBTzs7Ozs7OztxR0FEeEMsR0FBTyxJQUFDLFlBQVk7Ozs7cUdBQ3BCLEdBQU8sSUFBQyxZQUFZOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztnQ0FOdkQsR0FBTyxJQUFDLElBQUk7OztpQ0FWYixHQUFPLElBQUMsSUFBSTtpQ0FXWixHQUFPLElBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQVhaLEdBQU8sSUFBQyxJQUFJOzs7Ozs7Ozs7Ozs7O3lFQVVYLEdBQU8sSUFBQyxJQUFJOzt1QkFDYixHQUFPLElBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQTlFUixNQUFNO2FBQ0wsTUFBTSxJQUFJLE1BQU0sT0FBTSxNQUFNLENBQUMsSUFBSTtLQUN6QyxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCOzs7YUFHMUMsT0FBTzthQUNOLE1BQU0sSUFBSSxNQUFNLE9BQU0sTUFBTSxDQUFDLElBQUk7S0FDekMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGtCQUFrQjs7O2FBOEI5QyxJQUFJLENBQUMsRUFBRTtXQUNSLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7O1NBQ3hCLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSTthQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7Ozs7OzthQWV4QixNQUFNLENBQUMsQ0FBQztLQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHOzs7Ozs7Ozs7O2NBOUN0QyxPQUFPLENBQUMsQ0FBQztjQUNSLE1BQU0sSUFBSSxNQUFNLE9BQU0sTUFBTSxDQUFDLElBQUk7O1VBQ3JDLE1BQU07YUFDRixPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQVE7O09BQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7WUFFUixDQUFDO1NBQ0osT0FBTztTQUNQLFlBQVksRUFBRSxJQUFJO1NBQ2xCLFVBQVUsRUFBRSxPQUFPOzs7O09BR3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTzs7T0FDbkIsUUFBUSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsSUFBSTtRQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQWdCLENBQUMsRUFBRSxZQUFZLEVBQUUsSUFBSTs7O1FBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTs7Ozs7Y0FLckIsT0FBTztNQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTzs7TUFDbkIsUUFBUSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsSUFBSTtPQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7Ozs7Y0FhbkIsTUFBTSxDQUFDLEVBQUU7WUFDVixLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSTs7VUFDbEMsS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJO2NBQ2QsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFOztjQUViLEVBQUU7Ozs7Y0FRSixLQUFLLENBQUMsQ0FBQztZQUNSLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJOztVQUNsQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUc7T0FDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDakUvQixNQUFNLEdBQUcsSUFBSTtJQUNwQixFQUFFLFFBQVEsRUFBRSxZQUFZO0lBQ3hCO0lBQ0EsRUFBRSxPQUFPLEVBQUU7SUFDWCxJQUFJLE9BQU8sRUFBRSxLQUFLO0lBQ2xCLEdBQUc7SUFDSCxFQUFFLEtBQUssRUFBRSxFQUFFO0lBQ1gsRUFBRSxVQUFVLEVBQUUsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUM7SUFDdkUsRUFBRSxhQUFhLEVBQUUsSUFBSTtJQUNyQixFQUFFLFFBQVEsRUFBRSxFQUFFO0lBQ2QsRUFBQztBQUNEO0lBQ08sTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJO0lBQ2hDLEVBQUUsT0FBTyxPQUFPLElBQUk7SUFDcEIsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFXO0lBQ2xELElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBQztJQUNsQyxHQUFHO0lBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0NiYSxRQUFROztLQUVuQixPQUFPO2VBQ0ksY0FBYyxDQUFDLEdBQUc7T0FDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7YUFDMUIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVE7YUFDakQsTUFBTSxHQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRzthQUNsRCxFQUFFLE9BQU8sY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNO09BQzNDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTztPQUVsQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTTtPQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsT0FBTztPQUVyQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsUUFBUTtPQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUc7OztNQUVyQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsY0FBYzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkNxQjVDLEdBQUksSUFBQyxLQUFLOzs7Ozs7Ozs7Ozs7OzBFQUhTLEdBQU8sSUFBQyxJQUFJLGNBQUcsR0FBSSxJQUFDLElBQUk7aUVBQ2hDLEdBQUksSUFBQyxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs0REFDWixHQUFZOzs7OztpRUFDdkIsR0FBSSxJQUFDLEtBQUs7OzJHQUhTLEdBQU8sSUFBQyxJQUFJLGNBQUcsR0FBSSxJQUFDLElBQUk7Ozs7eUZBQ2hDLEdBQUksSUFBQyxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FwQ2xCLElBQUk7V0FDSixRQUFROztjQUVWLFlBQVksQ0FBQyxDQUFDO1lBQ2hCLElBQUksS0FBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU87Y0FDckIsTUFBTSxJQUFJLE1BQU0sRUFBRSxVQUFVLElBQUksS0FBSyxLQUFLLElBQUk7WUFDaEQsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUc7WUFDM0IsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSTtNQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHOztVQUVqQixNQUFNLEtBQUcsU0FBUztPQUNwQixVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU87O09BRXRCLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFO09BQ2pDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7O01BRXJCLFVBQVU7T0FDUixRQUFRLENBQUMsS0FBSzs7T0FFZCxNQUFNLENBQUMsTUFBTTtRQUFDLENBQUM7O2FBRVIsQ0FBQztVQUNKLFVBQVUsRUFBRyxHQUFHLEtBQUcsU0FBUztVQUM1QixPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU87VUFDcEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1VBQ2hCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtVQUNkLElBQUk7OztRQUVMLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1NDeUJPLE9BQU8sV0FBRSxHQUFJO3NCQUFLLEdBQUssYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBQTVCLE9BQU8sV0FBRSxHQUFJO3FCQUFLLEdBQUssYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NCQURwQyxNQUFNLENBQUMsSUFBSSxXQUFDLEdBQUs7Ozs7b0NBQXRCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQUFDLE1BQU0sQ0FBQyxJQUFJLFdBQUMsR0FBSzs7OzttQ0FBdEIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFBSixNQUFJOzs7Ozs7Ozs7O3NDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBdERLLFFBQVE7U0FLZixRQUFRLEdBQUcsQ0FBQztTQUNaLElBQUk7O0tBSVIsT0FBTztNQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZTtNQUM1QixXQUFXLENBQUMsWUFBWSxTQUFTLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFlBQVk7OztXQUdsRSxZQUFZLEdBQUcsR0FBRztNQUN0QixPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUc7O1VBQ2xDLEdBQUcsQ0FBQyxNQUFNO09BQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNO09BQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTTtPQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU07T0FDdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNOzs7VUFFcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFHLFNBQVM7T0FDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNO3VCQUNwQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU07O2VBRVYsS0FBSyxLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSzthQUMzQixRQUFRO2VBQ1AsTUFBTSxLQUFJLEdBQUc7O2dCQUNYLENBQUMsSUFBSSxNQUFNO1FBQ2xCLFFBQVEsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsT0FBTzs7O3VCQUV6QyxJQUFJLEdBQUcsUUFBUTtPQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxRQUFROzs7Ozs7O2NBTTdCLGVBQWUsS0FBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUs7O2VBQ2xDLEdBQUcsSUFBSSxlQUFlO09BQzdCLGVBQWUsQ0FBQyxHQUFHLEVBQUUsSUFBSTs7O01BRTNCLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQzs7O0tBR3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVO01BQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCO01BQzFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxZQUFZOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkExQzNDLEtBQUssR0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQkM2Q3NDLFFBQVEsZUFBUixHQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBNUN2RCxHQUFHLEdBQUcsSUFBSTtVQUNWLEtBQUssR0FBRyxZQUFZO1VBQ3BCLEVBQUUsR0FBRyxXQUFXOzs7Ozs7OztTQUhsQixJQUFJLEdBQUcsR0FBRzs7S0FLZCxPQUFPO01BQ0wsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsWUFBVyxHQUFHO09BQ3ZDLEdBQUcsQ0FBQyxFQUFFLHFCQUFNLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRTs7OztjQUlwQixPQUFPLEdBQUUsTUFBTTtzQkFDdEIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJO1lBQ1osSUFBSTtNQUNWLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSTtNQUNmLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJOzs7U0FHM0IsUUFBUSxHQUFHLElBQUk7O2NBQ1YsUUFBUSxDQUFDLENBQUM7Y0FDVCxNQUFNLElBQUksTUFBTSxPQUFNLE1BQU0sQ0FBQyxJQUFJO1VBQ3JDLFlBQVk7O1VBQ1osQ0FBQyxLQUFHLEtBQUs7T0FDWCxZQUFZLEdBQUcsSUFBSTs7T0FDbkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztZQUNWLENBQUM7U0FDSixZQUFZLEVBQUUsSUFBSTtTQUNsQixVQUFVLEVBQUUsTUFBTSxDQUFDLFFBQVE7Ozs7O01BRy9CLFFBQVEsSUFBSSxZQUFZLENBQUMsUUFBUTs7TUFDakMsUUFBUSxHQUFHLFVBQVU7O1lBQ2YsTUFBTTtTQUNSLFlBQVksR0FBSSxNQUFNLENBQUMsUUFBUSxPQUFLLE9BQU8sQ0FBQyxVQUFVOztTQUN0RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7c0JBQ1YsQ0FBQyxFQUNKLFlBQVk7OztTQUVkLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O09BRWQsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNqRFI7QUFFQTtJQUNPLE1BQU1DLFFBQU0sR0FBRyxRQUFRLENBQUM7SUFDL0IsRUFBRSxZQUFZLEVBQUUsS0FBSztJQUNyQixFQUFFLFlBQVksRUFBRSxJQUFJO0lBQ3BCLEVBQUUsVUFBVSxFQUFFLElBQUk7SUFDbEIsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNiLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDWCxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ1YsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztzQkM4RFFDLE1BQUksYUFBQyxHQUFPLElBQUMsSUFBSTs7OztvQ0FBdEIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQUFDQSxNQUFJLGFBQUMsR0FBTyxJQUFDLElBQUk7Ozs7bUNBQXRCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7d0NBQUosTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NEJBRXFCLEdBQUk7Ozs7Ozs7Ozs7O3VFQUFwQixHQUFNLGFBQUMsR0FBSTs7Ozs7Ozs7OENBRGdCQyxRQUFNOzs7OztvRUFDakIsR0FBSTs7a0dBQXBCLEdBQU0sYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytEQVdpQixHQUFPLElBQUMsWUFBWTs7OytEQUNwQixHQUFPLElBQUMsWUFBWTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQ0FIbkJDLFFBQU07c0NBQ05DLFNBQU87a0RBQ3lCLEdBQU87a0RBQ1AsR0FBTzs7Ozs7OztxR0FEeEMsR0FBTyxJQUFDLFlBQVk7Ozs7cUdBQ3BCLEdBQU8sSUFBQyxZQUFZOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztnQ0FOdkQsR0FBTyxJQUFDLElBQUk7OztpQ0FWYixHQUFPLElBQUMsSUFBSTtpQ0FXWixHQUFPLElBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VCQVhaLEdBQU8sSUFBQyxJQUFJOzs7Ozs7Ozs7Ozs7O3lFQVVYLEdBQU8sSUFBQyxJQUFJOzt1QkFDYixHQUFPLElBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQTlFUkQsUUFBTTthQUNMLE1BQU0sSUFBSSxRQUFRLE9BQU0sTUFBTSxDQUFDLElBQUk7S0FDM0MsUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLGdCQUFnQjs7O2FBRzlDQyxTQUFPO2FBQ04sTUFBTSxJQUFJLFFBQVEsT0FBTSxNQUFNLENBQUMsSUFBSTtLQUMzQyxRQUFRLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsa0JBQWtCOzs7YUE4QmxESCxNQUFJLENBQUMsRUFBRTtXQUNSLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7O1NBQ3hCLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSTthQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7Ozs7OzthQWV4QkMsUUFBTSxDQUFDLENBQUM7S0FDZixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRzs7Ozs7Ozs7OztjQTlDdEMsT0FBTyxDQUFDLENBQUM7Y0FDUixNQUFNLElBQUksUUFBUSxPQUFNLE1BQU0sQ0FBQyxJQUFJOztVQUN2QyxRQUFRO2FBQ0osT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFROztPQUNqQ0YsUUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztZQUVSLENBQUM7U0FDSixPQUFPO1NBQ1AsWUFBWSxFQUFFLElBQUk7U0FDbEIsVUFBVSxFQUFFLE9BQU87Ozs7T0FHdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPOztPQUNuQixRQUFRLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxJQUFJO1FBQ25DQSxRQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQWdCLENBQUMsRUFBRSxZQUFZLEVBQUUsSUFBSTs7O1FBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTs7Ozs7Y0FLckIsT0FBTztNQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTzs7TUFDbkIsUUFBUSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsSUFBSTtPQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7Ozs7Y0FhbkIsTUFBTSxDQUFDLEVBQUU7WUFDVixLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSTs7VUFDbEMsS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJO2NBQ2QsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFOztjQUViLEVBQUU7Ozs7Y0FRSixLQUFLLENBQUMsQ0FBQztZQUNSLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJOztVQUNsQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUc7T0FDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0M3RHpCLFFBQVE7O0tBRW5CLE9BQU87ZUFDSSxjQUFjLENBQUMsR0FBRztPQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQjthQUM1QixPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUzthQUNsRCxRQUFRLEdBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHO2FBQ3BELEVBQUUsT0FBTyxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVE7T0FDN0MsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPO09BRWxCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRO09BQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxPQUFPO09BRXZDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRO09BQ3pDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRzs7O01BRXZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxjQUFjOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRCQ3FCOUMsR0FBSSxJQUFDLEtBQUs7Ozs7Ozs7Ozs7Ozs7MEVBSFMsR0FBTyxJQUFDLEtBQUssY0FBRyxHQUFJLElBQUMsS0FBSztpRUFDbEMsR0FBSSxJQUFDLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7OzREQUNaLEdBQVk7Ozs7O2lFQUN2QixHQUFJLElBQUMsS0FBSzs7MkdBSFMsR0FBTyxJQUFDLEtBQUssY0FBRyxHQUFJLElBQUMsS0FBSzs7Ozt5RkFDbEMsR0FBSSxJQUFDLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQXBDbEIsSUFBSTtXQUNKLFFBQVE7O2NBRVYsWUFBWSxDQUFDLENBQUM7WUFDaEIsSUFBSSxLQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTztjQUNyQixNQUFNLElBQUksUUFBUSxFQUFFLFlBQVksSUFBSSxLQUFLLEtBQUssSUFBSTtZQUNwRCxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJO1lBQ3hCLEdBQUcsR0FBRyxJQUFJO01BQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUc7O1VBRWpCLFFBQVEsS0FBRyxTQUFTO09BQ3RCLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTzs7T0FFeEIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUU7T0FDbkMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7TUFFdkIsVUFBVTs7UUFDUixRQUFRLENBQUMsS0FBSzs7UUFFZEEsUUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzthQUVSLENBQUM7VUFDSixVQUFVLEVBQUcsR0FBRyxLQUFHLFNBQVM7VUFDNUIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPO1VBQ3BCLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztVQUNoQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7VUFDZCxJQUFJOzs7O09BR1AsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztTQ2lCUyxPQUFPLFdBQUUsR0FBSTtzQkFBSyxHQUFLLGFBQUMsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUE1QixPQUFPLFdBQUUsR0FBSTtxQkFBSyxHQUFLLGFBQUMsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkFEcEMsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLOzs7O29DQUF0QixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQkFBQyxNQUFNLENBQUMsSUFBSSxXQUFDLEdBQUs7Ozs7bUNBQXRCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7NEJBQUosTUFBSTs7Ozs7Ozs7OztzQ0FBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQS9DSyxRQUFRO1NBS2YsUUFBUSxHQUFHLENBQUM7U0FDWixJQUFJOztLQUlSLE9BQU87TUFDTCxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQjtNQUM5QixXQUFXLENBQUMsY0FBYyxTQUFTLFFBQVEsQ0FBQyxZQUFZLEVBQUUsRUFBRSxFQUFFLGNBQWM7OztXQUd4RSxjQUFjLEdBQUcsR0FBRztNQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUc7O1VBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBRyxTQUFTO09BQ3ZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHO3VCQUMvQixJQUFJLEdBQUcsR0FBRzs7ZUFFSCxPQUFPLEtBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLO2FBQzdCLFVBQVU7O2dCQUNQLENBQUMsSUFBSSxHQUFHO1FBQ2YsVUFBVSxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDL0MsVUFBVSxDQUFDLENBQUMsRUFBRSxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPOzs7dUJBRXhDLElBQUksR0FBRyxVQUFVO09BQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxVQUFVOzs7Ozs7O2NBTWpDLGlCQUFpQixLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSzs7ZUFDcEMsR0FBRyxJQUFJLGlCQUFpQjtPQUMvQixpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsSUFBSTs7O01BRTdCLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQzs7O0tBR3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZO01BQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDO01BQzVDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsRUFBRSxjQUFjOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFuQy9DLEtBQUssR0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQkM2Q3NDLFFBQVEsZUFBUixHQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBNUN2REssS0FBRyxHQUFHLElBQUk7VUFDVkMsT0FBSyxHQUFHLGNBQWM7VUFDdEJDLElBQUUsR0FBRyxhQUFhOzs7Ozs7OztTQUhwQixJQUFJLEdBQUcsR0FBRzs7S0FLZCxPQUFPO01BQ0wsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDQSxJQUFFLFlBQVcsR0FBRztPQUN2QyxHQUFHLENBQUNBLElBQUUscUJBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQ0EsSUFBRTs7OztjQUlwQixPQUFPLEdBQUUsTUFBTTtzQkFDdEIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJO1lBQ1osSUFBSTtNQUNWLElBQUksQ0FBQ0EsSUFBRSxJQUFJLElBQUk7TUFDZixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSTs7O1NBRzNCLFFBQVEsR0FBRyxJQUFJOztjQUNWLFFBQVEsQ0FBQyxDQUFDO2NBQ1QsTUFBTSxJQUFJLFFBQVEsT0FBTSxNQUFNLENBQUMsSUFBSTtVQUN2QyxZQUFZOztVQUNaLENBQUMsS0FBRyxLQUFLO09BQ1hQLFFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7WUFDVixDQUFDO1NBQ0osWUFBWSxFQUFFLElBQUk7U0FDbEIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxRQUFROzs7OztNQUlqQyxRQUFRLElBQUksWUFBWSxDQUFDLFFBQVE7O01BQ2pDLFFBQVEsR0FBRyxVQUFVOztZQUNmLFFBQVE7U0FDVixZQUFZLEdBQUksUUFBUSxDQUFDLFFBQVEsT0FBSyxPQUFPLENBQUMsVUFBVTs7U0FDeERBLFFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztzQkFDVixDQUFDLEVBQ0osWUFBWTs7O1NBRWQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7T0FFZCxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQy9DRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDakMsRUFBRSxVQUFVLEVBQUUsRUFBRTtJQUNoQixFQUFFLFFBQVEsRUFBRSxFQUFFO0lBQ2QsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNiLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDWCxFQUFFLEtBQUssRUFBRSxFQUFFO0lBQ1gsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUNWLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDVCxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQ1QsQ0FBQzs7SUNUTSxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUM7SUFDL0IsRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTTtJQUN2QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrQ0M2QzBELFFBQVE7Ozs7OytDQUdULFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0FUN0MsUUFBUTtxREFNUSxHQUFXO29EQUdYLEdBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQWpEdEMsUUFBUSxDQUFDLENBQUM7S0FDakIsUUFBUSxDQUFDLFdBQVcsSUFBRyxXQUFXLEVBQUUsVUFBVSxJQUFHLElBQUk7OztNQUduRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSTs7TUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhOzs7O2FBMEJwQixRQUFRO2FBQ1AsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVTs7O2FBRTlCLFFBQVE7YUFDUCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTOzs7Ozs7Ozs7O2NBMUI3QixNQUFNLENBQUMsSUFBSTtNQUNsQixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7bUJBRVIsT0FBTyxLQUNQLElBQUk7OztNQUdYLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTzs7TUFDbkIsUUFBUSxDQUFDLFdBQVcsT0FBTSxJQUFJLElBQUcsSUFBSTtPQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLElBQUk7T0FDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSTs7OztjQUlwQixXQUFXLENBQUMsQ0FBQztNQUNwQixNQUFNLEdBQUUsVUFBVSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTzs7O2NBRzlCLFVBQVUsQ0FBQyxDQUFDO01BQ25CLE1BQU0sR0FBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQytEQyxHQUFJLElBQUMsT0FBTyxDQUFDLE1BQU07Ozs7O29CQUNuQixPQUFPLFVBQUMsR0FBSTs7Ozs7NEJBQzlCLEdBQUcsYUFBQyxHQUFJOzs7OzRCQUNSLEdBQUcsYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Z0VBSE4sTUFBTSxVQUFDLEdBQUk7O2dFQUNYLE1BQU0sVUFBQyxHQUFJOzs7Ozs7NEVBTGIsR0FBUyxJQUFDLEtBQUssY0FBRyxHQUFJLElBQUMsS0FBSzttRUFDckMsR0FBSSxJQUFDLEtBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0REFDWCxHQUFZOzs7OzttRUFFZ0IsR0FBSSxJQUFDLE9BQU8sQ0FBQyxNQUFNOzt3RkFBbkMsTUFBTSxVQUFDLEdBQUk7Ozs7MERBQ0ssT0FBTyxVQUFDLEdBQUk7O3dGQUE1QixNQUFNLFVBQUMsR0FBSTs7OztrRUFDYixHQUFHLGFBQUMsR0FBSTtrRUFDUixHQUFHLGFBQUMsR0FBSTs7K0dBUFIsR0FBUyxJQUFDLEtBQUssY0FBRyxHQUFJLElBQUMsS0FBSzs7OzsyRkFDckMsR0FBSSxJQUFDLEtBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQXBDYixNQUFNLEdBQUUsT0FBTyxFQUFDLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLEdBQUc7OzthQUczQixNQUFNLEdBQUUsT0FBTyxFQUFDLENBQUM7ZUFDZCxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVc7OzthQUV2QixPQUFPLEdBQUUsT0FBTyxFQUFDLENBQUM7WUFDbEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLE1BQU0sQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsR0FBRyxPQUFPLEVBQUU7Ozs7Ozs7Ozs7OztXQTlEbEQsSUFBSTs7Y0FLTixLQUFLO01BQ1osUUFBUSxDQUFDLEdBQUc7T0FDVixVQUFVO09BQ1YsUUFBUSxFQUFFLEVBQUU7T0FDWixPQUFPLEVBQUUsRUFBRTtPQUNYLEtBQUssRUFBRSxFQUFFO09BQ1QsS0FBSyxFQUFFLEVBQUU7T0FDVCxJQUFJLEVBQUUsRUFBRTtPQUNSLEdBQUcsRUFBRSxFQUFFO09BQ1AsR0FBRyxFQUFFLEVBQUU7Ozs7Y0FJRixZQUFZLENBQUMsQ0FBQztZQUNoQixLQUFLLEtBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPOztVQUNqQyxLQUFLLEtBQUcsU0FBUyxDQUFDLEtBQUs7T0FDekIsS0FBSzs7T0FFTCxLQUFLO2FBQ0MsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUs7O2FBQ3pDLEdBQUc7UUFDUCxVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVU7UUFDeEIsUUFBUSxFQUFFLFNBQVM7UUFDbkIsT0FBTyxFQUFFLFNBQVM7UUFDWCxLQUFLO1FBQ1osS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO1FBQ2QsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO1FBQ1osR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUMsd0JBQXdCO1FBQzVELEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRzs7O1dBRVIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTTtRQUN0QixVQUFVOztVQUNSLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUc7O1NBQ3ZCLENBQUM7OztRQUVKLFFBQVEsQ0FBQyxZQUFZLElBQUcsS0FBSyxFQUFFLEtBQUssT0FBSyxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUc7U0FDN0QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3NCQUVWLEdBQUcsRUFDTixRQUFRLEVBQ1IsT0FBTyxFQUNQLEdBQUc7Ozs7Ozs7Y0FrQk4sR0FBRyxHQUFFLE9BQU8sRUFBQyxDQUFDO1VBQ2pCLEdBQUc7O1VBQ0gsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTztPQUNyQixHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7aUJBQ2YsT0FBTyxDQUFDLFVBQVU7T0FDM0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJOztPQUVaLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7O1VBRXpCLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBRyxFQUFFO2NBQzNCLEVBQUUsRUFBQyxFQUFFLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJO09BQzlCLEdBQUcsR0FBRyxFQUFFLElBQUksRUFBRTs7O2FBRVQsR0FBRzs7O2NBRUgsR0FBRyxHQUFFLE9BQU8sRUFBQyxDQUFDO1VBQ2pCLE9BQU8sQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTztjQUNuQyxFQUFFOzthQUVILEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztjQUN6QixLQUFLLE9BQU8sS0FBSyxLQUFLLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1NDckIvQixHQUFHLFVBQUgsR0FBRztTQUNILEtBQUssWUFBTCxHQUFLO3NCQUNGLEdBQUssWUFBQyxHQUFHLGVBQUUsR0FBSztTQUNuQixVQUFVLGNBQUUsR0FBTyxJQUFDLFVBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUg5QixHQUFHLFVBQUgsR0FBRztRQUNILEtBQUssWUFBTCxHQUFLO3FCQUNGLEdBQUssWUFBQyxHQUFHLGVBQUUsR0FBSztRQUNuQixVQUFVLGNBQUUsR0FBTyxJQUFDLFVBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkJBTlAsR0FBRzs7Ozt3QkFDckIsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLFlBQUMsR0FBRzs7OztzQ0FBMUIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzttRkFEbUIsR0FBRzs7dUJBQ3JCLE1BQU0sQ0FBQyxJQUFJLFdBQUMsR0FBSyxZQUFDLEdBQUc7Ozs7cUNBQTFCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7OEJBQUosTUFBSTs7Ozs7Ozs7Ozt3Q0FBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkFGRCxNQUFNLENBQUMsSUFBSSxXQUFDLEdBQUs7Ozs7b0NBQXRCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQUFDLE1BQU0sQ0FBQyxJQUFJLFdBQUMsR0FBSzs7OzttQ0FBdEIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFBSixNQUFJOzs7Ozs7Ozs7O3NDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBWEcsVUFBVSxDQUFDLElBQUk7S0FDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsSUFBSTs7Ozs7Ozs7O1NBNUM1QixRQUFRLEdBQUcsQ0FBQztTQUNaLElBQUk7O0tBSVIsT0FBTztNQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYztNQUMzQixXQUFXLENBQUMsVUFBVSxTQUFTLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLFVBQVU7OztXQUc1RCxVQUFVLEdBQUcsR0FBRztNQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUc7O1VBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7Y0FDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSzs7T0FDL0IsUUFBUSxDQUFDLEdBQUc7UUFDVixVQUFVO1FBQ1YsUUFBUSxFQUFFLEVBQUU7UUFDWixPQUFPLEVBQUUsRUFBRTtRQUNYLEtBQUssRUFBRSxFQUFFO1FBQ1QsS0FBSyxFQUFFLEVBQUU7UUFDVCxJQUFJLEVBQUUsRUFBRTtRQUNSLEdBQUcsRUFBRSxFQUFFO1FBQ1AsR0FBRyxFQUFFLEVBQUU7Ozs7VUFHUCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUcsU0FBUztPQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRzt1QkFDM0IsSUFBSSxHQUFHLEdBQUc7O2VBRUgsR0FBRyxLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSzthQUN6QixNQUFNOztnQkFDSCxDQUFDLElBQUksR0FBRztRQUNmLE1BQU0sQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7Ozt1QkFFbkIsSUFBSSxHQUFHLE1BQU07T0FDYixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsTUFBTTs7OztLQUlsQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUztNQUNwQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxVQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBckNoQyxLQUFLLEdBQUcsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDUFIsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQ2pDLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDWixFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ1IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aURDdUJ5QyxHQUFNO2tEQUNOLEdBQU87a0RBQ1AsR0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQTFCeEMsTUFBTTtjQUNOLEdBQUcsRUFBRSxNQUFNLEtBQUksU0FBUztZQUN6QixFQUFFLFlBQVksR0FBRyxHQUFDLENBQUM7TUFDekIsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLGdCQUFnQjs7O2NBR3BDLE9BQU87Y0FDUCxHQUFHLEVBQUUsTUFBTSxLQUFJLFNBQVM7WUFDekIsRUFBRSxZQUFZLEdBQUcsR0FBQyxDQUFDO01BQ3pCLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxrQkFBa0I7OztjQUd0QyxPQUFPO1VBQ1YsR0FBRyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7TUFDbEMsR0FBRyxDQUFDLEdBQUc7WUFDRCxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHO01BQ3pCLE9BQU8sQ0FBQyxHQUFHLEdBQUUsSUFBSTs7TUFDakIsUUFBUSxDQUFDLFlBQVksSUFBRyxJQUFJLElBQUcsSUFBSTtPQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQ2Z0QixNQUFNO1NBQ1AsR0FBRztNQUNOLFFBQVEsRUFBRSxJQUFJO01BQ2QsV0FBVyxFQUFFLEtBQUs7OztTQUdoQixLQUFLO1NBQ0wsS0FBSztTQUNMLEtBQUs7U0FFTCxLQUFLO1NBQ0wsS0FBSztTQUNMLEtBQUs7O0tBRVQsT0FBTztNQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsK0JBQStCO01BQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUztZQUNmLEdBQUcsR0FBRyxTQUFTLENBQUMsR0FBRyxLQUFHLElBQUksR0FBRyxZQUFZLEdBQUcsU0FBUyxDQUFDLEdBQUc7WUFDekQsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU87WUFDbkMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHOztZQUNmLElBQUk7VUFDTCxNQUFNO09BQ1QsUUFBUSxFQUFFLE1BQU07T0FDaEIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxPQUFPOzs7WUFFcEIsSUFBSTtVQUNMLE1BQU07T0FDVCxRQUFRLEVBQUUsR0FBRztPQUNiLEtBQUssRUFBRSxTQUFTLENBQUMsUUFBUTs7O1lBRXJCLElBQUk7VUFDTCxNQUFNO09BQ1QsUUFBUSxFQUFFLE1BQU07T0FDaEIsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDOzs7WUFFL0IsS0FBSyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsY0FBYyxLQUFLLFlBQVk7O1VBQzlELEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTTtPQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQ3ZCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUNyQixPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksRUFDcEIsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQ3BCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBRyxFQUNuQixPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFDaEIsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFO09BQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTTs7O01BR3hCLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTO01BQ2hELEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTO01BQ2hELEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTO01BRWhELEtBQUssR0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUk7TUFDaEQsS0FBSyxHQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSTtNQUNoRCxLQUFLLEdBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJO01BRWhELE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCO1lBQy9CLEdBQUcsT0FBTyxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDckMsR0FBRyxPQUFPLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUNyQyxHQUFHLE9BQU8sY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLO01BRTNDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSztNQUNqQixHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUs7TUFDakIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLOztNQUVqQixRQUFRLENBQUMsR0FBRztVQUNQLFNBQVM7T0FDVixNQUFNLElBQ0osS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLOzs7O2NBSUosS0FBSztZQUNOLENBQUMsR0FBRyxTQUFTLENBQUMsVUFBVTtZQUN4QixHQUFHLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixLQUFLLENBQUMsQ0FBQyxxQ0FBcUM7YUFDNUUsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQzVEQyxHQUFTLElBQUMsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUVBQWIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBaEIxQixPQUFPO01BQ0wsVUFBVTs7Y0FDRixLQUFLLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGFBQWE7O2tCQUMzQyxDQUFDLEVBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPO1NBQ2hDLElBQUksQ0FBQyxPQUFPLGFBQVksQ0FBQztVQUN2QixRQUFRLENBQUMsR0FBRyxNQUNQLFNBQVMsRUFDWixHQUFHLEVBQUUsQ0FBQzs7OztPQUlYLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkNLSyxHQUFTLElBQUMsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUVBQWIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBaEIxQixPQUFPO01BQ0wsVUFBVTs7Y0FDRixLQUFLLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGFBQWE7O2tCQUMzQyxDQUFDLEVBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPO1NBQ2hDLElBQUksQ0FBQyxPQUFPLGFBQVksQ0FBQztVQUN2QixRQUFRLENBQUMsR0FBRyxNQUNQLFNBQVMsRUFDWixHQUFHLEVBQUUsQ0FBQzs7OztPQUlYLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkNLSyxHQUFTLElBQUMsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUVBQWIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBaEIxQixPQUFPO01BQ0wsVUFBVTs7Y0FDRixLQUFLLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGFBQWE7O2tCQUMzQyxDQUFDLEVBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPO1NBQ2hDLElBQUksQ0FBQyxPQUFPLGFBQVksQ0FBQztVQUN2QixRQUFRLENBQUMsR0FBRyxNQUNQLFNBQVMsRUFDWixHQUFHLEVBQUUsQ0FBQzs7OztPQUlYLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkNLSyxHQUFTLElBQUMsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUVBQWIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBaEIxQixPQUFPO01BQ0wsVUFBVTs7Y0FDRixLQUFLLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVk7O2tCQUMxQyxDQUFDLEVBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPO1NBQ2hDLElBQUksQ0FBQyxPQUFPLGFBQVksQ0FBQztVQUN2QixRQUFRLENBQUMsR0FBRyxNQUNQLFNBQVMsRUFDWixHQUFHLEVBQUUsQ0FBQzs7OztPQUlYLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkNLSyxHQUFTLElBQUMsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUVBQWIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBaEIxQixPQUFPO01BQ0wsVUFBVTs7Y0FDRixLQUFLLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVc7O2tCQUN6QyxDQUFDLEVBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxPQUFPO1NBQ2hDLElBQUksQ0FBQyxPQUFPLGFBQVksQ0FBQztVQUN2QixRQUFRLENBQUMsR0FBRyxNQUNQLFNBQVMsRUFDWixHQUFHLEVBQUUsQ0FBQzs7OztPQUlYLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7aUNDS0UsR0FBUyxJQUFDLFFBQVE7Ozs7Ozs7Ozs7Ozs7OzsyRUFBbEIsR0FBUyxJQUFDLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREFaYixHQUFTLElBQUMsR0FBRzs7Ozs7Ozs7aUZBQWIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2REFEckIsR0FBUyxJQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTTs7d0JBRXZCLEdBQVMsSUFBQyxHQUFHLEtBQUcsTUFBTTt3QkFFdEIsR0FBUyxJQUFDLEdBQUcsS0FBRyxNQUFNO3dCQUV0QixHQUFTLElBQUMsR0FBRyxLQUFHLEtBQUs7d0JBRXJCLEdBQVMsSUFBQyxHQUFHLEtBQUcsS0FBSzt3QkFFckIsR0FBUyxJQUFDLEdBQUcsS0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkNReUIsR0FBUyxJQUFDLEtBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1RUFBZixHQUFTLElBQUMsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBakJsRUssS0FBRyxHQUFHLElBQUk7VUFDVkUsSUFBRSxHQUFHLFVBQVU7Ozs7Ozs7O1NBSGpCLEdBQUcsR0FBRyxLQUFLO1NBQ1gsSUFBSSxHQUFHLEdBQUc7O0tBSWQsT0FBTztNQUNMLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQ0EsSUFBRSxZQUFXLEdBQUc7T0FDdkMsR0FBRyxDQUFDQSxJQUFFLHFCQUFNLElBQUksR0FBRyxHQUFHLENBQUNBLElBQUU7Ozs7Y0FJcEIsT0FBTyxHQUFFLE1BQU07c0JBQ3RCLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSTtZQUNaLElBQUk7TUFDVixJQUFJLENBQUNBLElBQUUsSUFBSSxJQUFJO01BQ2YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDdEJ4QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUM7SUFDN0IsRUFBRSxTQUFTLEVBQUUsSUFBSTtJQUNqQixFQUFFLE1BQU0sRUFBRSxFQUFFO0lBQ1osRUFBRSxNQUFNLEVBQUUsRUFBRTtJQUNaLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDWixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUNDNkM0RCxHQUFROzs7dUNBQ1IsR0FBUTs7Ozs7Ozs7Ozs7Ozs7OztrQ0FKbkQsR0FBSyxJQUFDLFNBQVM7Ozs7Ozs7Ozs7O3FDQU9mLEdBQVE7Ozs7Ozs7c0NBSmMsUUFBUTtzQ0FDUixPQUFPOzs7Ozs7Ozs7bUNBSjdCLEdBQUssSUFBQyxTQUFTOzs7O21EQUc0QixHQUFROzs7O21EQUNSLEdBQVE7Ozs7c0NBR25ELEdBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBbERqQixRQUFRLENBQUMsQ0FBQztLQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVTs7O2FBR2xDLE9BQU8sQ0FBQyxDQUFDO2FBQ1QsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEtBQUksTUFBTSxDQUFDLElBQUk7V0FDdEMsSUFBSSxLQUNSLE1BQU0sRUFDTixNQUFNLEVBQ04sTUFBTTtLQUVSLFFBQVEsQ0FBQyxVQUFVLEVBQUUsSUFBSTs7Ozs7Ozs7O1NBZHZCLFFBQVEsR0FBRyxJQUFJO1NBQ2YsS0FBSyxHQUFHLEtBQUs7O0tBZ0JqQixPQUFPO1VBQ0QsUUFBUSxHQUFHLEtBQUs7O01BQ3BCLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLE9BQU8sYUFBWSxDQUFDO2VBQy9DLElBQUksS0FBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVU7O1dBQzlCLElBQUk7Z0JBQ0MsS0FBSyxLQUFJLElBQUk7O1lBQ2hCLFFBQVEsSUFBSSxLQUFLLEtBQUcsVUFBVTthQUM1QixRQUFRO1VBQ1YsWUFBWSxDQUFDLFFBQVE7OztTQUV2QixRQUFRLEdBQUcsVUFBVTs7V0FDbkIsUUFBUSxHQUFHLEtBQUs7V0FDaEIsT0FBTyxDQUFFOztVQUNULEVBQUU7Ozs7UUFFTixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsTUFBTTs7OztNQUluQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsU0FBUztPQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7T0FDMUIsSUFBSSxDQUFDLEdBQUcsTUFBSyxLQUFLOzs7Ozs7Ozs7OztNQVFKLEtBQUssQ0FBQyxTQUFTOzs7OztNQU9mLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkJDMkRDLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxRUFIWixHQUFJOzs7Ozs7eUVBSEMsR0FBUSxhQUFDLEdBQUk7Ozs7Ozs7aUNBS2YsR0FBSyxJQUFDLE1BQU0sVUFBQyxHQUFJOzs7Ozs7OztnREFEckIsR0FBTzs7Ozs7Ozs7Ozs4RkFETixHQUFJOzs7OztrQ0FFRCxHQUFLLElBQUMsTUFBTSxVQUFDLEdBQUk7OztvRUFDWixHQUFJOztrR0FOUCxHQUFRLGFBQUMsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkFEMUIsUUFBUSxXQUFDLEdBQUs7Ozs7b0NBQW5CLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQkFBQyxRQUFRLFdBQUMsR0FBSzs7OzttQ0FBbkIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0FBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBOUJELFFBQVEsQ0FBQyxJQUFJO2FBQ2IsT0FBTyxLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtXQUMxQixJQUFJOztjQUVELEdBQUcsQ0FBQyxFQUFFO2VBQ0osRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtjQUNwQixDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRztPQUMxQixJQUFJLENBQUMsQ0FBQyxJQUFFLENBQUMsSUFBSSxJQUFJOzs7O1NBSWpCLEdBQUc7O1NBQ0gsSUFBSSxDQUFDLFNBQVM7ZUFDUCxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU07YUFDbEIsR0FBRyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBQyxPQUFPOztXQUN0QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRztRQUNsQyxHQUFHLENBQUMsRUFBRTs7OztNQUdWLEdBQUcsQ0FBQyxVQUFVO01BQ2QsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUk7O01BRTVCLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNOzs7WUFFeEIsR0FBRzs7Ozs7Ozs7OztjQTlGSCxPQUFPLENBQUMsQ0FBQztjQUNULE1BQU0sT0FBTSxJQUFJLE9BQUssS0FBSzs7TUFDakMsVUFBVTs7Z0JBQ0QsTUFBTSxFQUFDLE1BQU0sRUFBQyxNQUFNLEtBQUksS0FBSztnQkFDN0IsSUFBSSxLQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTztjQUN6QixJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUk7UUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSztlQUVmLE1BQU0sRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHOztZQUNoQyxHQUFHO2tCQUNJLEVBQUUsSUFBSSxNQUFNO2lCQUNaLE1BQU0sRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHOztlQUM3QixJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sS0FBRyxNQUFNLElBQUksR0FBRyxLQUFHLEdBQUc7ZUFDekMsTUFBTSxDQUFDLE1BQU0sTUFBSSxTQUFTO1lBQzVCLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSTs7O1dBRXZCLE1BQU0sQ0FBQyxFQUFFLEtBQUssSUFBSTtxQkFDVCxNQUFNLENBQUMsTUFBTSxNQUFJLFNBQVM7V0FDbkMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJOzs7OztpQkFLbEIsRUFBRSxJQUFJLE1BQU07ZUFDYixTQUFTLEdBQUcsTUFBTSxDQUFDLEVBQUU7O2tCQUNsQixHQUFHLElBQUksU0FBUztnQkFDakIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxHQUFHOztjQUNqQyxJQUFJLEtBQUcsSUFBSTtXQUNiLFNBQVMsQ0FBQyxHQUFHLElBQUksSUFBSTs7O2NBRW5CLE1BQU0sS0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1dBQzVCLFNBQVMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxLQUFLOzs7OztpQkFLbkMsRUFBRSxJQUFJLE1BQU07ZUFDYixJQUFJLEdBQUcsTUFBTSxDQUFDLEVBQUU7O2tCQUNiLEdBQUcsSUFBSSxJQUFJO2dCQUNaLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRzs7bUJBQ1osR0FBRyxJQUFJLElBQUk7aUJBQ1osU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHOztvQkFDakIsR0FBRyxJQUFJLFNBQVM7Z0JBQ25CLElBQUksS0FBRyxHQUFHO2FBQ1osU0FBUyxDQUFDLEdBQUcsSUFBSSxJQUFJOzs7Z0JBRW5CLE1BQU0sS0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQzNCLFNBQVMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsS0FBSyxLQUFLOzs7Ozs7O2dCQU14QyxTQUFTLEVBQUUsTUFBTSxLQUFJLEtBQUs7O1FBQ2pDLElBQUksQ0FBQyxHQUFHO1NBQ04sU0FBUztTQUNULE1BQU07U0FDTixNQUFNO1NBQ04sTUFBTTtTQUNOLE1BQU07OztPQUVQLEVBQUU7Ozs7Y0FHRSxRQUFRLENBQUMsSUFBSTtZQUNkLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtZQUNyQyxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7cUJBQzVCLEdBQUcsSUFBSSxHQUFHOzs7Ozs7Ozs7O01BdUNMLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkNuQmUsSUFBSSxVQUFDLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUVBSDVDLEdBQUk7OytFQUdELEdBQUksSUFBQyxLQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssR0FBRyxFQUFFOzs7eUVBTjFCLEdBQVEsYUFBQyxHQUFJOzs7Ozs7O2lDQUtmLEdBQUssYUFBQyxHQUFJOzs7Ozs7OztnREFEZCxHQUFPOzs7Ozs7Ozs7OzhGQUROLEdBQUk7Ozs7O2tDQUVELEdBQUssYUFBQyxHQUFJOzs7MkRBQ3NCLElBQUksVUFBQyxHQUFJOzt3R0FBekMsR0FBSSxJQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksS0FBSyxHQUFHLEVBQUU7Ozs7a0dBTjFCLEdBQVEsYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFGYixHQUFFLFFBQUcsVUFBVSxHQUFHLEtBQUssVUFBRyxHQUFFOzs7O3NCQUMzQyxRQUFRLFdBQUMsR0FBSzs7OztvQ0FBbkIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Z0VBRGdCLEdBQUUsUUFBRyxVQUFVLEdBQUcsS0FBSyxVQUFHLEdBQUU7OztxQkFDM0MsUUFBUSxXQUFDLEdBQUs7Ozs7bUNBQW5CLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7d0NBQUosTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQXRCQyxRQUFRLENBQUMsS0FBSztXQUNmLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFDLENBQUM7YUFDL0IsRUFBRSxFQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUc7YUFDcEIsRUFBRSxFQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUc7TUFDM0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO01BQ1osQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO1VBQ1IsQ0FBQyxHQUFDLENBQUMsVUFBVSxDQUFDO1VBQ2QsQ0FBQyxHQUFDLENBQUMsU0FBUyxDQUFDO2FBQ1YsQ0FBQzs7O1lBRUgsR0FBRzs7O2FBR0gsSUFBSSxDQUFDLElBQUk7WUFDVCxDQUFDLEVBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRztTQUN4QixDQUFDLEtBQUcsU0FBUyxTQUFTLENBQUM7ZUFDakIsQ0FBQyxJQUFJLENBQUM7Ozs7Ozs7OztXQS9FUCxLQUFLO1dBQ0wsRUFBRTs7Y0FFSixPQUFPLENBQUMsQ0FBQztjQUNULE1BQU0sRUFBQyxNQUFNLEVBQUMsTUFBTSxLQUFJLEtBQUs7Y0FDN0IsSUFBSSxLQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTztZQUN6QixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLElBQUk7YUFDaEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7WUFDOUIsU0FBUyxHQUFHLE1BQU0sQ0FBQyxFQUFFO1lBQ3JCLElBQUk7O2VBQ0QsR0FBRyxJQUFJLFNBQVM7T0FDdkIsSUFBSSxDQUFDLEdBQUcsSUFBSSxTQUFTLENBQUMsR0FBRzs7O01BRTNCLFVBQVU7O2NBQ0YsSUFBSSxHQUFFLFNBQVMsQ0FBQyxJQUFJO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFHLE1BQU0sRUFBQyxNQUFNOztZQUUzQixHQUFHO2tCQUNJLEdBQUcsSUFBSSxTQUFTO2dCQUNqQixJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLEdBQUc7aUJBQzlCLE1BQU0sRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHOztnQkFDOUIsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJO2VBQ2pCLE1BQU0sS0FBRyxNQUFNLElBQUksR0FBRyxLQUFHLEdBQUc7WUFDOUIsU0FBUyxDQUFDLEdBQUcsS0FBSyxJQUFJOzs7Ozs7Y0FNeEIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFOztpQkFDYixHQUFHLElBQUksSUFBSTtlQUNaLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRzs7a0JBQ1osR0FBRyxJQUFJLElBQUk7Z0JBQ1osVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHOzttQkFDbEIsR0FBRyxJQUFJLFVBQVU7ZUFDcEIsSUFBSSxLQUFHLEdBQUc7WUFDWixVQUFVLENBQUMsR0FBRyxJQUFJLElBQUk7OztlQUVwQixNQUFNLEtBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMzQixVQUFVLENBQUMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEtBQUssS0FBSzs7Ozs7O2dCQUsxQyxTQUFTLEVBQUUsTUFBTSxLQUFJLEtBQUs7O1FBQ2pDLElBQUksQ0FBQyxHQUFHO1NBQ04sU0FBUztTQUNULE1BQU07U0FDTixNQUFNO1NBQ04sTUFBTTtTQUNOLE1BQU07OztPQUVQLEVBQUU7Ozs7Y0FHRSxRQUFRLENBQUMsSUFBSTtVQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7Y0FDVCxLQUFLLENBQUMsSUFBSSxJQUFJLFVBQVUsR0FBRyxNQUFNOztjQUVqQyxLQUFLLENBQUMsSUFBSSxJQUFJLFVBQVUsR0FBRyxFQUFFOzs7Ozs7Ozs7OztNQWdDbEIsS0FBSyxDQUFDLElBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7eUJDNUViLEdBQUssSUFBQyxNQUFNLFFBQUMsR0FBRTttQkFBTyxHQUFFOzs7Ozs7Ozs7Ozs7Ozs7aUVBQXhCLEdBQUssSUFBQyxNQUFNLFFBQUMsR0FBRTsyREFBTyxHQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0JBRHBDLEdBQU8sV0FBQyxHQUFFOzs7Ozs7Ozs7Ozs7Ozs7O3NEQUFWLEdBQU8sV0FBQyxHQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBRFYsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLElBQUMsTUFBTTs7OztvQ0FBN0IsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUJBQUMsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLElBQUMsTUFBTTs7OzttQ0FBN0IsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFBSixNQUFJOzs7Ozs7Ozs7O3NDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQVpHLE9BQU8sQ0FBQyxFQUFFO2NBQ1YsT0FBTyxLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTs7VUFDNUIsS0FBSyxDQUFDLFNBQVM7YUFDWCxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLE9BQU87Y0FDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLEtBQUcsVUFBVTs7Y0FFcEQsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkMrQ0YsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FFQUhBLEdBQUk7Ozs7eUVBSEMsR0FBUSxhQUFDLEdBQUk7Ozs7Ozs7aUNBS2YsR0FBSyxhQUFDLEdBQUk7Ozs7Ozs7O2dEQURkLEdBQU87Ozs7Ozs7Ozs7OEZBRE4sR0FBSTs7Ozs7a0NBRUQsR0FBSyxhQUFDLEdBQUk7OztvRUFDakIsR0FBSTs7a0dBTkssR0FBUSxhQUFDLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0FENUIsR0FBTSxjQUFDLEdBQUs7Ozs7b0NBQWpCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztnQ0FBQyxHQUFNLGNBQUMsR0FBSzs7OzttQ0FBakIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0FBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBL0NLLEtBQUs7V0FDTCxJQUFJO1dBQ0osSUFBSTtXQUNKLEVBQUU7O2NBRUosT0FBTyxDQUFDLENBQUM7TUFDaEIsVUFBVTs7Z0JBQ0QsTUFBTSxLQUFJLEtBQUs7Y0FDaEIsU0FBUyxHQUFHLE1BQU0sQ0FBQyxFQUFFO2dCQUNwQixJQUFJLEVBQUUsQ0FBQyxLQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTztlQUMzQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRztRQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBRyxNQUFNOztpQkFFZixHQUFHLElBQUksU0FBUztlQUNqQixJQUFJLEdBQUcsU0FBUyxDQUFDLEdBQUc7O2tCQUNqQixHQUFHLElBQUksSUFBSTtnQkFDWixNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUc7O3FCQUNaLE1BQU0sS0FBRyxRQUFRO29CQUNqQixHQUFHLElBQUksTUFBTTttQkFDYixNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRzs7Z0JBQy9CLE1BQU0sS0FBRyxNQUFNLElBQUksR0FBRyxLQUFHLEdBQUc7YUFDOUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLO2FBQ25CLElBQUksQ0FBQyxHQUFHLE1BQ0gsS0FBSyxFQUNSLE1BQU07Ozs7Ozs7T0FPakIsRUFBRTs7OztjQUdFLFFBQVEsQ0FBQyxJQUFJO2FBQ2IsS0FBSyxDQUFDLElBQUksSUFBSSxVQUFVLEdBQUcsTUFBTTs7O2NBR2pDLE1BQU0sQ0FBQyxJQUFJO2NBQ1gsTUFBTSxLQUFJLElBQUk7WUFDZixTQUFTLEdBQUcsTUFBTSxDQUFDLEVBQUU7WUFDckIsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJO1lBQ3JCLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSTthQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUk7Ozs7Ozs7Ozs7TUFVWCxLQUFLLENBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQ3ZDUCxHQUFJOzs7OEJBQUcsR0FBSyxpQkFBSyxHQUFJOzs7Ozs7Ozt5QkFDM0IsR0FBSyxhQUFDLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tGQURKLEdBQUk7MEZBQUcsR0FBSyxpQkFBSyxHQUFJOzt3RUFDM0IsR0FBSyxhQUFDLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0FGcEIsR0FBTSxjQUFDLEdBQUssS0FBRSxNQUFNOzs7O29DQUF6QixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztnQ0FBQyxHQUFNLGNBQUMsR0FBSyxLQUFFLE1BQU07Ozs7bUNBQXpCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7NEJBQUosTUFBSTs7Ozs7Ozs7OztzQ0FBSixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQkFBc0IsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLE1BQUksR0FBRzs7Ozs7Ozs7V0FaOUIsS0FBSztXQUNMLElBQUk7V0FDSixFQUFFOztjQUVKLE1BQU0sQ0FBQyxJQUFJO2NBQ1gsTUFBTSxLQUFJLElBQUk7WUFDZixTQUFTLEdBQUcsTUFBTSxDQUFDLEVBQUU7WUFDckIsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJO2FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQ0tBLEdBQUk7Ozs7Ozs7O3lCQUNWLEdBQUssYUFBQyxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0ZBREosR0FBSTs7d0VBQ1YsR0FBSyxhQUFDLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFITCxHQUFFLFFBQUcsVUFBVSxHQUFHLEtBQUssVUFBRyxHQUFFOzs7OztpQ0FDM0MsR0FBTSxjQUFDLEdBQUs7Ozs7b0NBQWpCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzhFQURnQixHQUFFLFFBQUcsVUFBVSxHQUFHLEtBQUssVUFBRyxHQUFFOzs7Z0NBQzNDLEdBQU0sY0FBQyxHQUFLOzs7O21DQUFqQixNQUFJOzs7Ozs7Ozs7Ozs7Ozs7OzRCQUFKLE1BQUk7Ozs7Ozs7Ozs7c0NBQUosTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FaRyxLQUFLO1dBQ0wsRUFBRTs7Y0FFSixNQUFNLENBQUMsSUFBSTtjQUNYLE1BQU0sS0FBSSxJQUFJO1lBQ2YsU0FBUyxHQUFHLE1BQU0sQ0FBQyxFQUFFO2FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3lCQ1VYLEdBQUssSUFBQyxNQUFNLFFBQUMsR0FBRTs7Ozs7Ozs7Ozs7Ozs7OztpRUFBZixHQUFLLElBQUMsTUFBTSxRQUFDLEdBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkJBRDNCLEdBQUssV0FBQyxHQUFFOzs7Ozs7Ozs7Ozs7Ozs7O29EQUFSLEdBQUssV0FBQyxHQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0JBRFIsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLElBQUMsTUFBTTs7OztvQ0FBN0IsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUJBQUMsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLElBQUMsTUFBTTs7OzttQ0FBN0IsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFBSixNQUFJOzs7Ozs7Ozs7O3NDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQWRHLEtBQUssQ0FBQyxFQUFFO2NBQ1IsT0FBTyxLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQixHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDakMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE1BQU07O1VBQzFDLEtBQUssQ0FBQyxTQUFTO2FBQ1gsR0FBRyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBQyxPQUFPO2NBQ25DLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLEVBQUUsS0FBRyxVQUFVOztjQUUxRCxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQ0FiLE9BQU87Ozs7S0FJUCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsU0FBUzs7TUFFekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkI7O2NBQ2xDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxLQUFJLE1BQU0sQ0FBQyxJQUFJO2NBQ3JDLFNBQVMsS0FBSSxLQUFLO1lBQ25CLE1BQU07O2VBQ0gsRUFBRSxJQUFJLE1BQU07YUFDYixJQUFJLEdBQUcsTUFBTSxDQUFDLEVBQUU7O2dCQUNiLElBQUksSUFBSSxJQUFJO2dCQUNYLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7UUFDM0IsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLElBQUksSUFBSTs7OztNQUcxQixJQUFJLENBQUMsR0FBRztPQUNOLFNBQVM7T0FDVCxNQUFNO09BQ04sTUFBTTtPQUNOLE1BQU07T0FDTixNQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OENDMUJRLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7YUFQaEIsT0FBTztLQUNkLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLElBQUk7TUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs4Q0NLdEIsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQVBoQixPQUFPO0tBQ2QsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsSUFBSTtNQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkNDWW9CLElBQUk7Ozs7Ozs7Ozs7Ozs7OzZDQUE3QixjQUFjOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBZHhDLGNBQWMsQ0FBQyxDQUFDO1dBQ2pCLFdBQVcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU87O0tBQ3BDLFFBQVEsQ0FBQyxXQUFXLElBQUcsV0FBVyxJQUFHLElBQUk7TUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXO01BQ2pELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUUsSUFBSTs7OzthQUk1QyxJQUFJO1lBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2Q0NLYUMsTUFBSTs7Ozs7Ozs7Ozs7Ozs7NkNBQXJCLE1BQU07Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7YUFkaEMsTUFBTSxDQUFDLENBQUM7V0FDVCxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPOztLQUM1QixRQUFRLENBQUMsV0FBVyxJQUFHLEdBQUcsSUFBRyxJQUFJO01BQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztNQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLElBQUk7Ozs7YUFJcENBLE1BQUk7WUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1YvQjtBQUVBO0lBQ08sTUFBTVIsUUFBTSxHQUFHLFFBQVEsQ0FBQztJQUMvQixFQUFFLFlBQVksRUFBRSxLQUFLO0lBQ3JCLEVBQUUsWUFBWSxFQUFFLElBQUk7SUFDcEIsRUFBRSxVQUFVLEVBQUUsSUFBSTtJQUNsQixFQUFFLE9BQU8sRUFBRSxLQUFLO0lBQ2hCLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDWCxFQUFFLElBQUksRUFBRSxFQUFFO0lBQ1YsQ0FBQzs7Ozs7Ozs7b0JDRVEsUUFBUSxXQUFDLEdBQUs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MkRBQzJELEdBQVM7Ozs7OzJEQURsRixRQUFRLFdBQUMsR0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FUbkIsS0FBSyxHQUFHLEVBQUU7O2NBQ0wsU0FBUyxDQUFDLENBQUM7c0JBQ2xCLEtBQUssSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDakIsSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCO01BQ3BELElBQUksQ0FBQyxTQUFTLHdCQUF3QixLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQ0N1RWxDLEdBQU8sZ0JBQUMsR0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MkVBQWYsR0FBTyxnQkFBQyxHQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBMUNwQixDQUFDLEdBQUcsZUFBZTs7Ozs7Ozs7O0tBaEN6QixPQUFPO01BQ0wsUUFBUSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxhQUFZLENBQUM7ZUFDOUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxNQUFNO09BQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUk7O1dBQ3ZCLElBQUk7UUFDTixDQUFDLENBQUMsY0FBYztRQUNoQixDQUFDLENBQUMsZUFBZTs7O2NBRVgsUUFBUSxHQUFHLE1BQU07O2NBQ2pCLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUk7Y0FDckMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxHQUFHLEdBQUcsRUFBRTtjQUM5QyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUI7UUFDeEQsT0FBTyxDQUFDLE1BQU0sR0FBRSxHQUFHLEVBQUUsUUFBUTs7WUFFekIsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNOztlQUNaLElBQUksQ0FBQyxFQUFFLEtBQUcsVUFBVTthQUNyQixJQUFJLENBQUMsUUFBUSxLQUFHLEdBQUc7VUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFROztjQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXO1dBQzdCLENBQUMsQ0FBQyxjQUFjO1dBQ2hCLENBQUMsQ0FBQyxlQUFlO1dBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSTs7Ozs7O1NBSXZDLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYTs7Ozs7O1NBTTdCLE9BQU87O2NBRUYsT0FBTyxDQUFDLEdBQUc7T0FDakIsT0FBTyxLQUFLLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTztNQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQjs7TUFDakMsVUFBVTs7WUFDSixRQUFRLENBQUMsYUFBYSxDQUFDLG9CQUFvQjtTQUM3QyxPQUFPLENBQUMsSUFBSTtlQUNOLEdBQUcsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsYUFBYTs7a0JBQzFDLElBQUksSUFBSSxHQUFHO2dCQUNaLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU87Z0JBQ2pDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVM7VUFDaEQsT0FBTyxDQUFDLFNBQVMsZUFBZSxLQUFLO2dCQUMvQixNQUFNOzttQkFDSCxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVE7V0FDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLOzs7bUJBRVYsS0FBSyxJQUFJLE1BQU07V0FDdEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLOzs7VUFFM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPOzs7O2FBR3ZCLFFBQVEsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCO2FBQ3RDLElBQUk7ZUFDRixFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJO2VBQ2hDLEdBQUcsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCO1NBQ3RELEVBQUUsS0FBSyxJQUFJLDRCQUE0QixFQUFFLENBQUMsRUFBRTs7bUJBQ2xDLENBQUMsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLE9BQU87Y0FDM0IsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDO1dBQ2YsSUFBSSxDQUFDLFNBQVMsTUFBTSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUk7OztVQUUzQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFO1VBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSTs7OztPQUduQixDQUFDOzs7YUFDRyxHQUFHLENBQUMsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7bUJDekNsQk0sT0FBSyxVQUFDLEdBQUk7Ozs7Ozs7Ozs7OzBFQUhTLEdBQU8sSUFBQyxLQUFLLGNBQUcsR0FBSSxJQUFDLEtBQUs7aUVBQ2xDLEdBQUksSUFBQyxPQUFPOzs7Ozs7Ozs7Ozs0REFDWixHQUFZOzs7Ozt3REFDdkJBLE9BQUssVUFBQyxHQUFJOzsyR0FIUyxHQUFPLElBQUMsS0FBSyxjQUFHLEdBQUksSUFBQyxLQUFLOzs7O3lGQUNsQyxHQUFJLElBQUMsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBVmhCQSxPQUFLLENBQUMsQ0FBQztLQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUs7V0FDYixNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFDLEVBQUU7V0FDbkMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztXQUN4QyxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUMsRUFBRSxFQUFFLFdBQVc7WUFDeEMsR0FBRyxDQUFDLFdBQVcsS0FBSyxJQUFJOzs7Ozs7Ozs7V0FyQnRCLElBQUk7O2NBRU4sWUFBWSxDQUFDLENBQUM7TUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJO2NBQ1QsS0FBSyxLQUFJLElBQUk7O01BQ3BCLFFBQVEsQ0FBQyxhQUFhLElBQUcsS0FBSyxPQUFLLE9BQU87T0FDeENOLFFBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFFUixDQUFDLEVBQ0osT0FBTyxFQUNQLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkMwQ0ksR0FBRzs7Ozt3QkFDbkIsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLFlBQUMsR0FBRzs7OztzQ0FBMUIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O21GQURpQixHQUFHOzt1QkFDbkIsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLFlBQUMsR0FBRzs7OztxQ0FBMUIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs4QkFBSixNQUFJOzs7Ozs7Ozs7O3dDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBTkMsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLFlBQUMsR0FBRzs7OztzQ0FBMUIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dUJBQUMsTUFBTSxDQUFDLElBQUksV0FBQyxHQUFLLFlBQUMsR0FBRzs7OztxQ0FBMUIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs4QkFBSixNQUFJOzs7Ozs7Ozs7O3dDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FPUyxPQUFPLFdBQUUsR0FBSTtzQkFBSyxHQUFLLFlBQUMsR0FBRyxjQUFFLEdBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFBakMsT0FBTyxXQUFFLEdBQUk7cUJBQUssR0FBSyxZQUFDLEdBQUcsY0FBRSxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FOakMsT0FBTyxXQUFFLEdBQUk7c0JBQUssR0FBSyxZQUFDLEdBQUcsY0FBRSxHQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBQWpDLE9BQU8sV0FBRSxHQUFJO3FCQUFLLEdBQUssWUFBQyxHQUFHLGNBQUUsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBSC9DLEdBQUcsUUFBRyxVQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NCQURoQixNQUFNLENBQUMsSUFBSSxXQUFDLEdBQUs7Ozs7b0NBQXRCLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQUFDLE1BQU0sQ0FBQyxJQUFJLFdBQUMsR0FBSzs7OzttQ0FBdEIsTUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFBSixNQUFJOzs7Ozs7Ozs7O3NDQUFKLE1BQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBOUNLLFFBQVE7U0FLZixRQUFRLEdBQUcsQ0FBQztTQUNaLElBQUk7O0tBSVIsT0FBTztNQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCO01BQy9CLFdBQVcsQ0FBQyxlQUFlLFNBQVMsUUFBUSxDQUFDLGFBQWEsRUFBRSxFQUFFLEVBQUUsZUFBZTs7O1dBRzNFLGVBQWUsR0FBRyxHQUFHO01BQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBRzs7VUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFHLFNBQVM7T0FDeEMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLEdBQUc7dUJBQ2hDLElBQUksR0FBRyxHQUFHOztlQUVILFFBQVEsS0FBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUs7YUFDOUIsV0FBVzs7Z0JBQ1IsQ0FBQyxJQUFJLEdBQUc7UUFDZixXQUFXLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDOzs7dUJBRXhCLElBQUksR0FBRyxXQUFXO09BQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxXQUFXOzs7Ozs7O2NBTW5DLGlCQUFpQixLQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSzs7ZUFDcEMsR0FBRyxJQUFJLGlCQUFpQjtPQUMvQixpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsSUFBSTs7O01BRTdCLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQzs7O0tBR3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFhO01BQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDO01BQzdDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBRSxlQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFsQ2pELEtBQUssR0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VDQ1RNLE9BQUssR0FBRyxRQUFRO1VBQ2hCQyxJQUFFLEdBQUksVUFBVTs7Ozs7U0FIbEIsR0FBRyxHQUFHLEtBQUs7U0FDWCxJQUFJLEdBQUcsR0FBRzs7S0FJZCxPQUFPO01BQ0wsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDQSxJQUFFLFlBQVcsR0FBRztPQUN2QyxHQUFHLENBQUNBLElBQUUscUJBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQ0EsSUFBRTs7OztjQUlwQixPQUFPLEdBQUUsTUFBTTtzQkFDdEIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJO1lBQ1osSUFBSTtNQUNWLElBQUksQ0FBQ0EsSUFBRSxJQUFJLElBQUk7TUFDZixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tDWC9CLE9BQU87TUFDTCxVQUFVOztjQUNGLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLGFBQWE7Y0FDM0MsRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSTtRQUN0QyxFQUFFLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU87UUFDdEMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUztRQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7O09BQ2xCLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ25CUDtBQUVBO0lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FB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
