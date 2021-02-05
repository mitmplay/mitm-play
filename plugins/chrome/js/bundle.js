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
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
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
    function dataset_dev(node, property, value) {
        node.dataset[property] = value;
        dispatch_dev('SvelteDOMSetDataset', { node, property, value });
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

    /* node_modules\svelma\src\components\Icon.svelte generated by Svelte v3.29.7 */

    const file = "node_modules\\svelma\\src\\components\\Icon.svelte";

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

    /* node_modules\svelma\src\components\Tabs\Tabs.svelte generated by Svelte v3.29.7 */
    const file$1 = "node_modules\\svelma\\src\\components\\Tabs\\Tabs.svelte";

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

    /* node_modules\svelma\src\components\Tabs\Tab.svelte generated by Svelte v3.29.7 */
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

    const source$1 = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: '',
      fpath: '',
      path: ''
    });

    /* src\components\box\VBox.svelte generated by Svelte v3.29.7 */

    const file$3 = "src\\components\\box\\VBox.svelte";

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

    /* src\components\box\BStatic.svelte generated by Svelte v3.29.7 */

    const file$4 = "src\\components\\box\\BStatic.svelte";

    // (13:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block_1 = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "table-container svelte-1x2hxw3");
    			attr_dev(div, "style", div_style_value = /*resize*/ ctx[1]());
    			add_location(div, file$4, 13, 4, 221);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
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
    		block: block_1,
    		id: create_else_block.name,
    		type: "else",
    		source: "(13:2) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (11:2) {#if block}
    function create_if_block$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block_1 = {
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
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
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
    		block: block_1,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(11:2) {#if block}",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*block*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "vbox left svelte-1x2hxw3");
    			add_location(div, file$4, 9, 0, 147);
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
    		block: block_1,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BStatic", slots, ['default']);
    	let { top } = $$props;
    	let { block = false } = $$props;

    	function resize() {
    		return top ? `height: calc(100vh - ${top}px);` : "";
    	}

    	const writable_props = ["top", "block"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BStatic> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("top" in $$props) $$invalidate(2, top = $$props.top);
    		if ("block" in $$props) $$invalidate(0, block = $$props.block);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ top, block, resize });

    	$$self.$inject_state = $$props => {
    		if ("top" in $$props) $$invalidate(2, top = $$props.top);
    		if ("block" in $$props) $$invalidate(0, block = $$props.block);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [block, resize, top, $$scope, slots];
    }

    class BStatic extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { top: 2, block: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BStatic",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*top*/ ctx[2] === undefined && !("top" in props)) {
    			console.warn("<BStatic> was created without expected prop 'top'");
    		}
    	}

    	get top() {
    		throw new Error("<BStatic>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<BStatic>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<BStatic>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<BStatic>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\box\Splitter.svelte generated by Svelte v3.29.7 */
    const file$5 = "src\\components\\box\\Splitter.svelte";

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
    			add_location(div, file$5, 76, 0, 1822);
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

    /* src\components\box\BResize.svelte generated by Svelte v3.29.7 */
    const file$6 = "src\\components\\box\\BResize.svelte";

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
    			add_location(div, file$6, 26, 0, 488);
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

    /* src\components\box\BHeader.svelte generated by Svelte v3.29.7 */

    const file$7 = "src\\components\\box\\BHeader.svelte";

    function create_fragment$7(ctx) {
    	let table;
    	let tr;
    	let td;
    	let div;
    	let table_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			td = element("td");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "td-header svelte-xfa7hs");
    			add_location(div, file$7, 15, 6, 245);
    			attr_dev(td, "class", "svelte-xfa7hs");
    			add_location(td, file$7, 14, 4, 233);
    			add_location(tr, file$7, 13, 2, 223);
    			attr_dev(table, "class", "table-header svelte-xfa7hs");
    			attr_dev(table, "style", table_style_value = /*resize*/ ctx[1](/*left*/ ctx[0]));
    			add_location(table, file$7, 12, 0, 168);
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
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*left*/ 1 && table_style_value !== (table_style_value = /*resize*/ ctx[1](/*left*/ ctx[0]))) {
    				attr_dev(table, "style", table_style_value);
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
    	let { left = 0 } = $$props;

    	function resize() {
    		let css = "";

    		if (left) {
    			css += `width: calc(100vw - ${left}px);`;
    		}

    		return css;
    	}

    	const writable_props = ["left"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ left, resize });

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, resize, $$scope, slots];
    }

    class BHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { left: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BHeader",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get left() {
    		throw new Error("<BHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<BHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\box\BTable.svelte generated by Svelte v3.29.7 */

    const file$8 = "src\\components\\box\\BTable.svelte";

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

    /* src\components\box\VBox2.svelte generated by Svelte v3.29.7 */
    const file$9 = "src\\components\\box\\VBox2.svelte";

    // (22:6) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(22:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:6) {#if typeof title === 'string'}
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(20:6) {#if typeof title === 'string'}",
    		ctx
    	});

    	return block;
    }

    // (19:4) <BHeader>
    function create_default_slot_3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(19:4) <BHeader>",
    		ctx
    	});

    	return block;
    }

    // (18:2) <BStatic {top}>
    function create_default_slot_2(ctx) {
    	let bheader;
    	let t;
    	let div;
    	let switch_instance;
    	let current;

    	bheader = new BHeader({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

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
    			create_component(bheader.$$.fragment);
    			t = space();
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "details-list svelte-24mcew");
    			add_location(div, file$9, 25, 4, 580);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bheader, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bheader_changes = {};

    			if (dirty & /*$$scope, title*/ 260) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);

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
    			transition_in(bheader.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bheader.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bheader, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(18:2) <BStatic {top}>",
    		ctx
    	});

    	return block;
    }

    // (28:2) {#if show}
    function create_if_block$2(ctx) {
    	let bresize;
    	let current;

    	bresize = new BResize({
    			props: {
    				left: /*left*/ ctx[1],
    				top: /*top*/ ctx[6],
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
    			if (dirty & /*top*/ 64) bresize_changes.top = /*top*/ ctx[6];

    			if (dirty & /*$$scope*/ 256) {
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
    		source: "(28:2) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (29:2) <BResize {left} on:dragend={dragend} {top}>
    function create_default_slot_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

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
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
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
    		source: "(29:2) <BResize {left} on:dragend={dragend} {top}>",
    		ctx
    	});

    	return block;
    }

    // (17:0) <VBox>
    function create_default_slot(ctx) {
    	let bstatic;
    	let t;
    	let if_block_anchor;
    	let current;

    	bstatic = new BStatic({
    			props: {
    				top: /*top*/ ctx[6],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*show*/ ctx[4] && create_if_block$2(ctx);

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
    			if (dirty & /*top*/ 64) bstatic_changes.top = /*top*/ ctx[6];

    			if (dirty & /*$$scope, List, props, title*/ 293) {
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
    		source: "(17:0) <VBox>",
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

    			if (dirty & /*$$scope, left, top, dragend, show, List, props, title*/ 383) {
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
    	let { top = "0" } = $$props;
    	const writable_props = ["List", "left", "title", "dragend", "show", "props", "top"];

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
    		if ("top" in $$props) $$invalidate(6, top = $$props.top);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		List,
    		left,
    		title,
    		dragend,
    		show,
    		props,
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
    		if ("top" in $$props) $$invalidate(6, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [List, left, title, dragend, show, props, top, slots, $$scope];
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
    			top: 6
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

    	get top() {
    		throw new Error("<VBox2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<VBox2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\monaco\Exbutton.svelte generated by Svelte v3.29.7 */

    const { console: console_1 } = globals;
    const file$a = "src\\components\\monaco\\Exbutton.svelte";

    function create_fragment$a(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t4;
    	let button2_disabled_value;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "[--]";
    			t1 = text(" -\r\n");
    			button1 = element("button");
    			button1.textContent = "[++]";
    			t3 = text(" -\r\n");
    			button2 = element("button");
    			t4 = text("Open");
    			t5 = text(" -");
    			attr_dev(button0, "class", "tlb btn-min svelte-1eubylj");
    			add_location(button0, file$a, 22, 0, 454);
    			attr_dev(button1, "class", "tlb btn-plus svelte-1eubylj");
    			add_location(button1, file$a, 23, 0, 521);
    			attr_dev(button2, "class", "tlb btn-open svelte-1eubylj");
    			button2.disabled = button2_disabled_value = /*source*/ ctx[0].openDisabled;
    			add_location(button2, file$a, 24, 0, 588);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    			append_dev(button2, t4);
    			insert_dev(target, t5, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*btnMin*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*btnPlus*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*btnOpen*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*source*/ 1 && button2_disabled_value !== (button2_disabled_value = /*source*/ ctx[0].openDisabled)) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t5);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Exbutton", slots, []);
    	let { editor } = $$props;
    	let { source } = $$props;

    	function btnMin() {
    		const monaco = window.mitm.editor[editor];
    		monaco && monaco.trigger("fold", "editor.foldAll");
    	}

    	function btnPlus() {
    		const monaco = window.mitm.editor[editor];
    		monaco && monaco.trigger("unfold", "editor.unfoldAll");
    	}

    	function btnOpen() {
    		console.log(source);

    		ws__send("openFolder", source, data => {
    			console.log("Done Open!");
    		});
    	}

    	const writable_props = ["editor", "source"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Exbutton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("editor" in $$props) $$invalidate(4, editor = $$props.editor);
    		if ("source" in $$props) $$invalidate(0, source = $$props.source);
    	};

    	$$self.$capture_state = () => ({ editor, source, btnMin, btnPlus, btnOpen });

    	$$self.$inject_state = $$props => {
    		if ("editor" in $$props) $$invalidate(4, editor = $$props.editor);
    		if ("source" in $$props) $$invalidate(0, source = $$props.source);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [source, btnMin, btnPlus, btnOpen, editor];
    }

    class Exbutton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { editor: 4, source: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Exbutton",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*editor*/ ctx[4] === undefined && !("editor" in props)) {
    			console_1.warn("<Exbutton> was created without expected prop 'editor'");
    		}

    		if (/*source*/ ctx[0] === undefined && !("source" in props)) {
    			console_1.warn("<Exbutton> was created without expected prop 'source'");
    		}
    	}

    	get editor() {
    		throw new Error("<Exbutton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editor(value) {
    		throw new Error("<Exbutton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get source() {
    		throw new Error("<Exbutton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set source(value) {
    		throw new Error("<Exbutton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\route\Button.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$b = "src\\components\\route\\Button.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (55:0) {#if $source.path}
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
    			add_location(button, file$b, 60, 2, 1326);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$b, 55, 1, 1148);
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
    				dispose = listen_dev(button, "click", /*btnGo*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*btnUrl, btns, $source, btnTag*/ 5) {
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
    		source: "(55:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    // (57:2) {#each btns($source.item) as item}
    function create_each_block$1(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[4] + "";
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
    			attr_dev(button, "data-url", button_data_url_value = /*btnUrl*/ ctx[2](/*item*/ ctx[4]));
    			add_location(button, file$b, 57, 2, 1217);
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
    			if (dirty & /*$source*/ 1 && t0_value !== (t0_value = /*item*/ ctx[4] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$source*/ 1 && button_data_url_value !== (button_data_url_value = /*btnUrl*/ ctx[2](/*item*/ ctx[4]))) {
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
    		source: "(57:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if $source.path}
    function create_if_block$3(ctx) {
    	let div;
    	let exbutton;
    	let t0;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;

    	exbutton = new Exbutton({
    			props: {
    				source: /*$source*/ ctx[0],
    				editor: "_route"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(exbutton.$$.fragment);
    			t0 = space();
    			button = element("button");
    			t1 = text("Save");
    			attr_dev(button, "class", "tlb btn-save svelte-11e4kdx");
    			button.disabled = button_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button, file$b, 68, 2, 1579);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$b, 66, 1, 1500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(exbutton, div, null);
    			append_dev(div, t0);
    			append_dev(div, button);
    			append_dev(button, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*btnSave*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const exbutton_changes = {};
    			if (dirty & /*$source*/ 1) exbutton_changes.source = /*$source*/ ctx[0];
    			exbutton.$set(exbutton_changes);

    			if (!current || dirty & /*$source*/ 1 && button_disabled_value !== (button_disabled_value = /*$source*/ ctx[0].saveDisabled)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(exbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(exbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(exbutton);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(66:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let current;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$1(ctx);
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
    			add_location(div, file$b, 63, 0, 1433);
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
    			current = true;
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

    			if ((!current || dirty & /*$source*/ 1) && t2_value !== (t2_value = /*$source*/ ctx[0].path + "")) set_data_dev(t2, t2_value);

    			if (/*$source*/ ctx[0].path) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$source*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block1) if_block1.d();
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

    function instance$b($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(0, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);

    	function btnSave(e) {
    		const { editor: { _route } } = window.mitm;

    		if (_route) {
    			const content = _route.getValue();

    			source$1.update(n => {
    				return {
    					...n,
    					content,
    					saveDisabled: true,
    					editbuffer: content
    				};
    			});

    			console.log($source);

    			ws__send("saveRoute", $source, data => {
    				source$1.update(n => {
    					return { ...n, saveDisabled: true };
    				});

    				console.log("Done Save!");
    			});
    		}
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		source: source$1,
    		Exbutton,
    		btnSave,
    		btns,
    		btnUrl,
    		btnTag,
    		btnGo,
    		$source
    	});

    	return [$source, btnSave, btnUrl, btnGo];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$b.name
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

    /* src\components\route\Editor.svelte generated by Svelte v3.29.7 */

    const { console: console_1$2 } = globals;
    const file$c = "src\\components\\route\\Editor.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "monaco");
    			add_location(div0, file$c, 25, 2, 721);
    			attr_dev(div1, "class", "edit-container");
    			add_location(div1, file$c, 24, 0, 689);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Editor> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$2.warn("<Editor> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const rerender = writable({
      toggle: true,
    });

    function urls () {
      console.log('urls is called!');
      rerender.set({
        toggle: true
      });
    }

    /* src\components\route\Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$3 } = globals;
    const file$d = "src\\components\\route\\Item.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_element_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + /*group*/ ctx[1] + " " + (/*$source*/ ctx[2].fpath === /*item*/ ctx[0].fpath) + " svelte-1qjjsyf");
    			attr_dev(div, "data-element", div_data_element_value = /*item*/ ctx[0].element);
    			add_location(div, file$d, 39, 0, 838);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*clickHandler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*group, $source, item*/ 7 && div_class_value !== (div_class_value = "td-item " + /*group*/ ctx[1] + " " + (/*$source*/ ctx[2].fpath === /*item*/ ctx[0].fpath) + " svelte-1qjjsyf")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_element_value !== (div_data_element_value = /*item*/ ctx[0].element)) {
    				attr_dev(div, "data-element", div_data_element_value);
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
    		id: create_fragment$d.name,
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;
    	let { group = "" } = $$props;
    	let { onChange } = $$props;

    	function clickHandler(e) {
    		e.preventDefault();
    		e.stopPropagation();
    		let { element } = e.target.dataset;
    		const { editor: { _route, _routeEdit }, files } = mitm;
    		const url = mitm.routes[element].url;
    		const obj = files.route[element];
    		console.log(item, element, obj);

    		if (_route === undefined) {
    			_routeEdit(obj.content);
    		} else {
    			_route.setValue(obj.content || "");
    			_route.revealLine(1);
    		}

    		setTimeout(() => {
    			onChange(false);

    			source$1.update(
    				n => {
    					return {
    						...n,
    						goDisabled: url === undefined,
    						content: obj.content,
    						fpath: obj.fpath,
    						path: obj.path,
    						item: element
    					};
    				},
    				1
    			);
    		});
    	}

    	const writable_props = ["item", "group", "onChange"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("group" in $$props) $$invalidate(1, group = $$props.group);
    		if ("onChange" in $$props) $$invalidate(4, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		source: source$1,
    		item,
    		group,
    		onChange,
    		clickHandler,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("group" in $$props) $$invalidate(1, group = $$props.group);
    		if ("onChange" in $$props) $$invalidate(4, onChange = $$props.onChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, group, $source, clickHandler, onChange];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { item: 0, group: 1, onChange: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$3.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChange*/ ctx[4] === undefined && !("onChange" in props)) {
    			console_1$3.warn("<Item> was created without expected prop 'onChange'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get group() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChange() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\route\List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$1, console: console_1$4 } = globals;
    const file$e = "src\\components\\route\\List.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (93:2) {:else}
    function create_else_block$2(ctx) {
    	let item;
    	let current;

    	item = new Item({
    			props: {
    				item: {
    					element: /*item*/ ctx[6],
    					.../*_data*/ ctx[1][/*item*/ ctx[6]]
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
    				element: /*item*/ ctx[6],
    				.../*_data*/ ctx[1][/*item*/ ctx[6]]
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(93:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (84:2) {#if isGroup(item)}
    function create_if_block$4(ctx) {
    	let details;
    	let summary;
    	let item;
    	let t0;
    	let t1;
    	let current;

    	item = new Item({
    			props: {
    				item: {
    					element: /*item*/ ctx[6],
    					.../*_data*/ ctx[1][/*item*/ ctx[6]]
    				},
    				onChange: /*onChange*/ ctx[0],
    				group: "group"
    			},
    			$$inline: true
    		});

    	let each_value_1 = childs(/*item*/ ctx[6]);
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
    			create_component(item.$$.fragment);
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr_dev(summary, "class", "space1 svelte-f53jvg");
    			add_location(summary, file$e, 85, 4, 2303);
    			add_location(details, file$e, 84, 2, 2288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			mount_component(item, summary, null);
    			append_dev(details, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(details, null);
    			}

    			append_dev(details, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item_changes = {};

    			if (dirty & /*_data*/ 2) item_changes.item = {
    				element: /*item*/ ctx[6],
    				.../*_data*/ ctx[1][/*item*/ ctx[6]]
    			};

    			if (dirty & /*onChange*/ 1) item_changes.onChange = /*onChange*/ ctx[0];
    			item.$set(item_changes);

    			if (dirty & /*childs, xlist, _data, onChange*/ 7) {
    				each_value_1 = childs(/*item*/ ctx[6]);
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
    			transition_in(item.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_component(item);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(84:2) {#if isGroup(item)}",
    		ctx
    	});

    	return block;
    }

    // (89:4) {#each childs(item) as item2}
    function create_each_block_1(ctx) {
    	let item;
    	let current;

    	item = new Item({
    			props: {
    				item: {
    					element: /*item2*/ ctx[9],
    					.../*_data*/ ctx[1][/*item2*/ ctx[9]]
    				},
    				onChange: /*onChange*/ ctx[0],
    				group: "child"
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
    				element: /*item2*/ ctx[9],
    				.../*_data*/ ctx[1][/*item2*/ ctx[9]]
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(89:4) {#each childs(item) as item2}",
    		ctx
    	});

    	return block;
    }

    // (83:0) {#each xlist(_data) as item}
    function create_each_block$2(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*_data*/ 2) show_if = !!isGroup(/*item*/ ctx[6]);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(83:0) {#each xlist(_data) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*xlist*/ ctx[2](/*_data*/ ctx[1]);
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
    			if (dirty & /*childs, xlist, _data, onChange, isGroup*/ 7) {
    				each_value = /*xlist*/ ctx[2](/*_data*/ ctx[1]);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function childs(item) {
    	const route = window.mitm.routes[item];
    	return Object.keys(route._childns.list);
    }

    function isGroup(item) {
    	const route = window.mitm.routes[item];
    	const arr = Object.keys(route._childns.list);
    	return arr.length;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { onChange } = $$props;
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount route/list");
    		_ws_connect.routeOnMount = () => ws__send("getRoute", "", routeHandler);
    	});

    	const routeHandler = obj => {
    		console.warn("ws__send(getRoute)", obj);
    		window.mitm.routes = obj.routes;
    		const { routes } = window.mitm;

    		for (const id in obj.routes) {
    			const [sub, nspace] = id.split("@");

    			if (nspace) {
    				routes[id]._childns = routes[nspace]._childns || { list: {}, _subns: "" };
    			} // routes[id]._subns = routes[nspace]._subns || ''
    		}

    		if (obj._tags_) {
    			window.mitm.__tag1 = obj._tags_.__tag1;
    			window.mitm.__tag2 = obj._tags_.__tag2;
    			window.mitm.__tag3 = obj._tags_.__tag3;
    			window.mitm.__tag4 = obj._tags_.__tag4;
    			window.mitm.__urls = obj._tags_.__urls;
    			setTimeout(() => urls(), 1);
    		}

    		if (window.mitm.files.route === undefined) {
    			window.mitm.files.route = obj.files;
    			$$invalidate(4, data = obj.files);
    		} else {
    			const { route } = window.mitm.files;
    			const { files } = obj;
    			const newRoute = {};

    			for (let k in files) {
    				newRoute[k] = route[k] ? route[k] : files[k];
    				newRoute[k].content = files[k].content;
    			}

    			$$invalidate(4, data = newRoute);
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

    	function xlist(all) {
    		return Object.keys(_data).filter(x => !x.match("@"));
    	}

    	const writable_props = ["onChange"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		onChange,
    		urls,
    		onMount,
    		Item,
    		rerender,
    		data,
    		routeHandler,
    		xlist,
    		childs,
    		isGroup,
    		_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("onChange" in $$props) $$invalidate(0, onChange = $$props.onChange);
    		if ("rerender" in $$props) rerender = $$props.rerender;
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("_data" in $$props) $$invalidate(1, _data = $$props._data);
    	};

    	let _data;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 16) {
    			 $$invalidate(1, _data = data);
    		}
    	};

    	return [onChange, _data, xlist];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$4.warn("<List> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\route\Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$5 } = globals;

    // (56:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
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
    		source: "(56:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const top = "47";
    const title = "-Route(s)-";
    const id = "routeLeft";

    function instance$f($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(4, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 165;

    	onMount(async () => {
    		console.warn("onMount route/index");

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

    			source$1.update(n => {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		source: source$1,
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    // feat: profile

    const source$2 = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: '',
      fpath: '',
      path: ''
    });

    /* src\components\profile\Button.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$2, console: console_1$6 } = globals;
    const file$f = "src\\components\\profile\\Button.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (62:0) {#if $source.path}
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
    			add_location(div, file$f, 62, 1, 1308);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*btnUrl, btns, $source, btnTag*/ 5) {
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
    		source: "(62:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    // (64:2) {#each btns($source.item) as item}
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
    			attr_dev(button, "data-url", button_data_url_value = /*btnUrl*/ ctx[2](/*item*/ ctx[5]));
    			add_location(button, file$f, 64, 2, 1377);
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

    			if (dirty & /*$source*/ 1 && button_data_url_value !== (button_data_url_value = /*btnUrl*/ ctx[2](/*item*/ ctx[5]))) {
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
    		source: "(64:2) {#each btns($source.item) as item}",
    		ctx
    	});

    	return block;
    }

    // (73:0) {#if $source.path}
    function create_if_block$5(ctx) {
    	let div;
    	let exbutton;
    	let t0;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;

    	exbutton = new Exbutton({
    			props: {
    				source: /*$source*/ ctx[0],
    				editor: "_profile"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(exbutton.$$.fragment);
    			t0 = space();
    			button = element("button");
    			t1 = text("Save");
    			attr_dev(button, "class", "tlb btn-save svelte-11e4kdx");
    			button.disabled = button_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button, file$f, 75, 2, 1747);
    			attr_dev(div, "class", "btn-container svelte-11e4kdx");
    			add_location(div, file$f, 73, 1, 1666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(exbutton, div, null);
    			append_dev(div, t0);
    			append_dev(div, button);
    			append_dev(button, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*btnSave*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const exbutton_changes = {};
    			if (dirty & /*$source*/ 1) exbutton_changes.source = /*$source*/ ctx[0];
    			exbutton.$set(exbutton_changes);

    			if (!current || dirty & /*$source*/ 1 && button_disabled_value !== (button_disabled_value = /*$source*/ ctx[0].saveDisabled)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(exbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(exbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(exbutton);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(73:0) {#if $source.path}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let t0;
    	let div;
    	let t1;
    	let t2_value = /*$source*/ ctx[0].path + "";
    	let t2;
    	let t3;
    	let current;
    	let if_block0 = /*$source*/ ctx[0].path && create_if_block_1$2(ctx);
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
    			add_location(div, file$f, 70, 0, 1599);
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
    			current = true;
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

    			if ((!current || dirty & /*$source*/ 1) && t2_value !== (t2_value = /*$source*/ ctx[0].path + "")) set_data_dev(t2, t2_value);

    			if (/*$source*/ ctx[0].path) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$source*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block1) if_block1.d();
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

    function instance$g($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$2, "source");
    	component_subscribe($$self, source$2, $$value => $$invalidate(0, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);

    	function btnSave(e) {
    		const { editor: { _profile } } = window.mitm;

    		if (_profile) {
    			const content = _profile.getValue();

    			source$2.update(n => {
    				return {
    					...n,
    					content,
    					saveDisabled: true,
    					editbuffer: content
    				};
    			});

    			console.log($source);

    			ws__send("saveProfile", $source, data => {
    				source$2.update(n => {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		source: source$2,
    		Exbutton,
    		btnSave,
    		btnOpen,
    		btns: btns$1,
    		btnUrl,
    		btnTag: btnTag$1,
    		btnGo,
    		$source
    	});

    	return [$source, btnSave, btnUrl];
    }

    class Button$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\components\profile\Editor.svelte generated by Svelte v3.29.7 */

    const { console: console_1$7 } = globals;
    const file$g = "src\\components\\profile\\Editor.svelte";

    function create_fragment$h(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "profile");
    			add_location(div0, file$g, 25, 2, 740);
    			attr_dev(div1, "class", "edit-container");
    			add_location(div1, file$g, 24, 0, 708);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<Editor> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$7.warn("<Editor> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\profile\Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$8 } = globals;
    const file$h = "src\\components\\profile\\Item.svelte";

    function create_fragment$i(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-rqs7oq");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$h, 36, 0, 758);
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
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-rqs7oq")) {
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$2, "source");
    	component_subscribe($$self, source$2, $$value => $$invalidate(1, $source = $$value));
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

    				source$2.update(n => {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$8.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(3, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		source: source$2,
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { item: 0, onChange: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$8.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChange*/ ctx[3] === undefined && !("onChange" in props)) {
    			console_1$8.warn("<Item> was created without expected prop 'onChange'");
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

    /* src\components\profile\List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$3, console: console_1$9 } = globals;

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

    function create_fragment$j(ctx) {
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { onChange } = $$props;
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount profile/list");
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$9.warn(`<List> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console_1$9.warn("<List> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\profile\Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$a } = globals;

    // (56:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
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
    		source: "(56:0) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const top$1 = "47";
    const title$1 = "-Profile(s)-";
    const id$1 = "profileLeft";

    function instance$k($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$2, "source");
    	component_subscribe($$self, source$2, $$value => $$invalidate(4, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 165;

    	onMount(async () => {
    		console.warn("onMount profile/index");

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
    			source$2.update(n => {
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

    					source$2.update(n => {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$a.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		source: source$2,
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
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$k.name
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

    const states = writable({
      chevron: '[>>]',
      state2: {},
      state3: {},
    });

    /* src\components\button\Collapse.svelte generated by Svelte v3.29.7 */
    const file$i = "src\\components\\button\\Collapse.svelte";

    function create_fragment$l(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "[-]";
    			attr_dev(button, "class", "collapse svelte-1axs6ta");
    			add_location(button, file$i, 19, 0, 491);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*btnClose*/ ctx[0], false, false, false);
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $states;
    	validate_store(states, "states");
    	component_subscribe($$self, states, $$value => $$invalidate(3, $states = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Collapse", slots, []);
    	let { q } = $$props;
    	let { name } = $$props;
    	const dispatch = createEventDispatcher();

    	function btnClose(e) {
    		const all = { ...$states };
    		all[name][q] = false;
    		const nodes = document.querySelectorAll(`${q} details[open]`);
    		nodes.forEach(node => node.removeAttribute("open"));
    		states.set(all);
    		dispatch("message", { all, name }); // feat: auto collapsed between tag2 & tag3
    	}

    	const writable_props = ["q", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Collapse> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("q" in $$props) $$invalidate(1, q = $$props.q);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		q,
    		name,
    		states,
    		createEventDispatcher,
    		dispatch,
    		btnClose,
    		$states
    	});

    	$$self.$inject_state = $$props => {
    		if ("q" in $$props) $$invalidate(1, q = $$props.q);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [btnClose, q, name];
    }

    class Collapse extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { q: 1, name: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Collapse",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*q*/ ctx[1] === undefined && !("q" in props)) {
    			console.warn("<Collapse> was created without expected prop 'q'");
    		}

    		if (/*name*/ ctx[2] === undefined && !("name" in props)) {
    			console.warn("<Collapse> was created without expected prop 'name'");
    		}
    	}

    	get q() {
    		throw new Error("<Collapse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set q(value) {
    		throw new Error("<Collapse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Collapse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Collapse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\button\Expand.svelte generated by Svelte v3.29.7 */
    const file$j = "src\\components\\button\\Expand.svelte";

    function create_fragment$m(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("[");
    			b = element("b");
    			b.textContent = "+";
    			t2 = text("]");
    			add_location(b, file$j, 22, 54, 644);
    			attr_dev(button, "class", "expand svelte-1axs6ta");
    			add_location(button, file$j, 22, 0, 590);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button, "click", /*btnOpen*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
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
    	let $states;
    	validate_store(states, "states");
    	component_subscribe($$self, states, $$value => $$invalidate(4, $states = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Expand", slots, []);
    	let { q } = $$props;
    	let { name } = $$props;
    	const dispatch = createEventDispatcher();

    	function btnOpen(e) {
    		const all = { ...$states };
    		all[name][q] = !all[name][q];
    		const nodes = document.querySelectorAll(`${q} details`);

    		if (all[name][q]) {
    			nodes.forEach(node => node.setAttribute("open", ""));
    		} else {
    			nodes.forEach(node => node.removeAttribute("open"));
    		}

    		states.set(all);
    		dispatch("message", { all, name }); // feat: auto collapsed between tag2 & tag3
    	}

    	const writable_props = ["q", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Expand> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("q" in $$props) $$invalidate(1, q = $$props.q);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		q,
    		name,
    		states,
    		createEventDispatcher,
    		dispatch,
    		btnOpen,
    		$states
    	});

    	$$self.$inject_state = $$props => {
    		if ("q" in $$props) $$invalidate(1, q = $$props.q);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [btnOpen, q, name, click_handler];
    }

    class Expand extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { q: 1, name: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Expand",
    			options,
    			id: create_fragment$m.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*q*/ ctx[1] === undefined && !("q" in props)) {
    			console.warn("<Expand> was created without expected prop 'q'");
    		}

    		if (/*name*/ ctx[2] === undefined && !("name" in props)) {
    			console.warn("<Expand> was created without expected prop 'name'");
    		}
    	}

    	get q() {
    		throw new Error("<Expand>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set q(value) {
    		throw new Error("<Expand>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Expand>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Expand>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\logs\Button.svelte generated by Svelte v3.29.7 */

    const { console: console_1$b } = globals;
    const file$k = "src\\components\\logs\\Button.svelte";

    function create_fragment$n(ctx) {
    	let div;
    	let input0;
    	let input0_src_value;
    	let t0;
    	let collapse;
    	let t1;
    	let expand;
    	let t2;
    	let label0;
    	let input1;
    	let input1_checked_value;
    	let t3;
    	let t4;
    	let label1;
    	let input2;
    	let input2_checked_value;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;

    	collapse = new Collapse({
    			props: { st: /*st*/ ctx[0], q: "#list-logs" },
    			$$inline: true
    		});

    	expand = new Expand({
    			props: { st: /*st*/ ctx[0], q: "#list-logs" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			create_component(collapse.$$.fragment);
    			t1 = space();
    			create_component(expand.$$.fragment);
    			t2 = space();
    			label0 = element("label");
    			input1 = element("input");
    			t3 = text("host");
    			t4 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t5 = text("args");
    			attr_dev(input0, "class", "stop svelte-65ny7r");
    			attr_dev(input0, "type", "image");
    			if (input0.src !== (input0_src_value = "images/stop.svg")) attr_dev(input0, "src", input0_src_value);
    			attr_dev(input0, "alt", "");
    			add_location(input0, file$k, 59, 2, 1317);
    			attr_dev(input1, "type", "checkbox");
    			input1.checked = input1_checked_value = hostflag();
    			attr_dev(input1, "class", "svelte-65ny7r");
    			add_location(input1, file$k, 63, 4, 1522);
    			attr_dev(label0, "class", "checkbox svelte-65ny7r");
    			add_location(label0, file$k, 62, 2, 1492);
    			attr_dev(input2, "type", "checkbox");
    			input2.checked = input2_checked_value = argsflag();
    			attr_dev(input2, "class", "svelte-65ny7r");
    			add_location(input2, file$k, 66, 4, 1639);
    			attr_dev(label1, "class", "checkbox svelte-65ny7r");
    			add_location(label1, file$k, 65, 2, 1609);
    			attr_dev(div, "class", "btn-container svelte-65ny7r");
    			set_style(div, "top", "1px");
    			add_location(div, file$k, 58, 0, 1268);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			append_dev(div, t0);
    			mount_component(collapse, div, null);
    			append_dev(div, t1);
    			mount_component(expand, div, null);
    			append_dev(div, t2);
    			append_dev(div, label0);
    			append_dev(label0, input1);
    			append_dev(label0, t3);
    			append_dev(div, t4);
    			append_dev(div, label1);
    			append_dev(label1, input2);
    			append_dev(label1, t5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "click", btnClear, false, false, false),
    					listen_dev(input1, "click", /*btnHostswch*/ ctx[1], false, false, false),
    					listen_dev(input2, "click", /*btnArgswch*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapse.$$.fragment, local);
    			transition_in(expand.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapse.$$.fragment, local);
    			transition_out(expand.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(collapse);
    			destroy_component(expand);
    			mounted = false;
    			run_all(dispose);
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

    function btnClear(e) {
    	const data = {};
    	const arr = document.querySelectorAll("summary.true");

    	if (arr.length) {
    		const folders = [];

    		for (let node of arr) {
    			folders.push(node.dataset.path);
    		}

    		data.folders = folders;
    	}

    	ws__send("clearLogs", data, data => {
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

    function instance$n($$self, $$props, $$invalidate) {
    	let $client;
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(3, $client = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let st = { collapse: true, expand: false };

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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$b.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		client,
    		Collapse,
    		Expand,
    		st,
    		btnClear,
    		toogle,
    		btnHostswch,
    		btnArgswch,
    		hostflag,
    		argsflag,
    		$client
    	});

    	$$self.$inject_state = $$props => {
    		if ("st" in $$props) $$invalidate(0, st = $$props.st);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [st, btnHostswch, btnArgswch];
    }

    class Button$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\components\logs\Title.svelte generated by Svelte v3.29.7 */

    function create_fragment$o(ctx) {
    	let t;
    	let button;
    	let current;
    	button = new Button$2({ $$inline: true });

    	const block = {
    		c: function create() {
    			t = text("-Logs-\r\n");
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\components\logs\Item.svelte generated by Svelte v3.29.7 */
    const file$l = "src\\components\\logs\\Item.svelte";

    function create_fragment$p(ctx) {
    	let div;
    	let span0;
    	let t0_value = status2(/*item*/ ctx[0]) + "";
    	let t0;
    	let span0_class_value;
    	let t1;
    	let span1;
    	let t2_value = /*method2*/ ctx[4](/*item*/ ctx[0]) + "";
    	let t2;
    	let span1_class_value;
    	let t3;
    	let span2;
    	let t4_value = /*url*/ ctx[5](/*item*/ ctx[0]) + "";
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = /*pth*/ ctx[6](/*item*/ ctx[0]) + "";
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
    			attr_dev(span0, "class", span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-1llf19r");
    			add_location(span0, file$l, 132, 2, 2651);
    			attr_dev(span1, "class", span1_class_value = "method " + /*method*/ ctx[3](/*item*/ ctx[0]) + " svelte-1llf19r");
    			add_location(span1, file$l, 133, 2, 2713);
    			attr_dev(span2, "class", "url");
    			add_location(span2, file$l, 134, 2, 2775);
    			attr_dev(span3, "class", "prm svelte-1llf19r");
    			add_location(span3, file$l, 135, 2, 2815);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-1llf19r");
    			attr_dev(div, "data-logid", div_data_logid_value = /*item*/ ctx[0].logid);
    			add_location(div, file$l, 128, 0, 2541);
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
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = status2(/*item*/ ctx[0]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "status " + status(/*item*/ ctx[0]) + " svelte-1llf19r")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*method2*/ ctx[4](/*item*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "method " + /*method*/ ctx[3](/*item*/ ctx[0]) + " svelte-1llf19r")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*url*/ ctx[5](/*item*/ ctx[0]) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = /*pth*/ ctx[6](/*item*/ ctx[0]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$logstore, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$logstore*/ ctx[1].logid === /*item*/ ctx[0].logid) + " svelte-1llf19r")) {
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function status({ general: g }) {
    	if (g === undefined) {
    		return "";
    	}

    	return `_${Math.trunc(g.status / 100)}`;
    }

    function status2({ general: g }) {
    	if (g === undefined) {
    		return "";
    	}

    	return g.status;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let $logstore;
    	let $client;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(1, $logstore = $$value));
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(7, $client = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;

    	const m = {
    		POST: "post",
    		PUT: "put ",
    		GET: "get ",
    		DELETE: "del "
    	};

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

    	function method({ general: g }) {
    		if (g === undefined) {
    			return "";
    		}

    		return `${m[g.method]}`;
    	}

    	function method2({ general: g }) {
    		if (g === undefined) {
    			return "";
    		}

    		return m[g.method] + (g.ext ? `<${g.ext.padEnd(4, " ")}> ` : "");
    	}

    	function url({ general: g }) {
    		let msg;

    		if (g === undefined) {
    			return "";
    		}

    		if (g.url.match("/log/")) {
    			msg = g.url.split("@")[1];
    		} else if ($client.nohostlogs) {
    			msg = g.path;
    		} else {
    			msg = `${g.url.split("?")[0]}`;
    		}

    		if ($client.nohostlogs) {
    			if (g.url.match("-sshot@")) {
    				msg = g.url.split("~").pop();
    			} else if (g.ext === "") {
    				const [a1, a2] = msg.split("--");
    				msg = a2 || a1;
    			}
    		} else if (g.url.match("-sshot@")) {
    			msg = new URL(msg).pathname;
    		}

    		return msg;
    	}

    	function pth({ general: g }) {
    		if (g === undefined) {
    			return "";
    		}

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
    		m,
    		empty,
    		clickHandler,
    		status,
    		status2,
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

    	return [item, $logstore, clickHandler, method, method2, url, pth];
    }

    class Item$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$p.name
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

    /* src\components\logs\Summary.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$4 } = globals;
    const file$m = "src\\components\\logs\\Summary.svelte";

    function create_fragment$q(ctx) {
    	let summary;
    	let input;
    	let t;
    	let html_tag;
    	let summary_data_path_value;
    	let summary_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			summary = element("summary");
    			input = element("input");
    			t = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-6jfg3t");
    			add_location(input, file$m, 35, 2, 612);
    			html_tag = new HtmlTag(null);
    			attr_dev(summary, "data-path", summary_data_path_value = data(/*item*/ ctx[0]));
    			attr_dev(summary, "class", summary_class_value = "" + (/*_checked*/ ctx[2] + /*klass*/ ctx[5](/*$logstore*/ ctx[3]) + " svelte-6jfg3t"));
    			add_location(summary, file$m, 31, 0, 531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, summary, anchor);
    			append_dev(summary, input);
    			append_dev(summary, t);
    			html_tag.m(/*key*/ ctx[1], summary);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*clickHandler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 2) html_tag.p(/*key*/ ctx[1]);

    			if (dirty & /*item*/ 1 && summary_data_path_value !== (summary_data_path_value = data(/*item*/ ctx[0]))) {
    				attr_dev(summary, "data-path", summary_data_path_value);
    			}

    			if (dirty & /*_checked, $logstore*/ 12 && summary_class_value !== (summary_class_value = "" + (/*_checked*/ ctx[2] + /*klass*/ ctx[5](/*$logstore*/ ctx[3]) + " svelte-6jfg3t"))) {
    				attr_dev(summary, "class", summary_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(summary);
    			mounted = false;
    			dispose();
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

    function data(i) {
    	const id = Object.keys(i)[0];
    	const arr = i[id].path.split("/");
    	arr.pop();
    	return arr.join("/");
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let $logstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(3, $logstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Summary", slots, []);
    	let { item } = $$props;
    	let { key } = $$props;
    	let _checked = false;

    	function clickHandler(e) {
    		const node = e.currentTarget;
    		let { path } = node.parentElement.dataset;
    		$$invalidate(2, _checked = node.checked);
    	}

    	function klass(store) {
    		for (const itm in item) {
    			if (itm === store.logid) {
    				return " chk";
    			}
    		}

    		return "";
    	}

    	const writable_props = ["item", "key"];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    	};

    	$$self.$capture_state = () => ({
    		item,
    		key,
    		logstore,
    		_checked,
    		data,
    		clickHandler,
    		klass,
    		$logstore
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("_checked" in $$props) $$invalidate(2, _checked = $$props._checked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, key, _checked, $logstore, clickHandler, klass];
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, { item: 0, key: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$q.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Summary> was created without expected prop 'item'");
    		}

    		if (/*key*/ ctx[1] === undefined && !("key" in props)) {
    			console.warn("<Summary> was created without expected prop 'key'");
    		}
    	}

    	get item() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\logs\List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$5, console: console_1$c } = globals;
    const file$n = "src\\components\\logs\\List.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (70:6) {#each Object.keys(_data[key]) as logid}
    function create_each_block_1$1(ctx) {
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
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(70:6) {#each Object.keys(_data[key]) as logid}",
    		ctx
    	});

    	return block;
    }

    // (68:2) {#each Object.keys(_data) as key, i}
    function create_each_block$5(ctx) {
    	let details;
    	let summary;
    	let t0;
    	let t1;
    	let current;

    	summary = new Summary({
    			props: {
    				item: /*_data*/ ctx[0][/*key*/ ctx[5]],
    				key: /*key*/ ctx[5]
    			},
    			$$inline: true
    		});

    	let each_value_1 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[5]]);
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
    			details = element("details");
    			create_component(summary.$$.fragment);
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			add_location(details, file$n, 68, 4, 1624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			mount_component(summary, details, null);
    			append_dev(details, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(details, null);
    			}

    			append_dev(details, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const summary_changes = {};
    			if (dirty & /*_data*/ 1) summary_changes.item = /*_data*/ ctx[0][/*key*/ ctx[5]];
    			if (dirty & /*_data*/ 1) summary_changes.key = /*key*/ ctx[5];
    			summary.$set(summary_changes);

    			if (dirty & /*Object, _data, $client*/ 3) {
    				each_value_1 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[5]]);
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
    			transition_in(summary.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(summary.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_component(summary);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(68:2) {#each Object.keys(_data) as key, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let div;
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
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "list-logs");
    			add_location(div, file$n, 66, 0, 1558);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

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
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	validate_store(client, "client");
    	component_subscribe($$self, client, $$value => $$invalidate(1, $client = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount logs/list");
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

    		const { files } = window.mitm;

    		if (files.log === undefined) {
    			files.log = obj;
    			$$invalidate(2, data = obj);
    		} else {
    			const { log } = files;
    			const newLog = {};

    			for (let k in obj) {
    				newLog[k] = obj[k];
    			}

    			$$invalidate(2, data = newLog);
    			const ln1 = Object.keys(log);
    			const ln2 = Object.keys(newLog);

    			if (ln2 < ln1) {
    				const nodes1 = document.querySelectorAll("#list-logs details[open]");
    				nodes1.forEach(node => node.removeAttribute("open"));
    				const nodes2 = document.querySelectorAll("#list-logs summary input:checked");
    				nodes2.forEach(node => node.checked = false);
    			}

    			files.log = newLog;
    		}
    	};

    	window.mitm.files.log_events.LogsTable = () => {
    		ws__send("getLog", "", logHandler);
    	};

    	const writable_props = [];

    	Object_1$5.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$c.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		logstore,
    		onMount,
    		Item: Item$2,
    		Summary,
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
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    const tabstore = writable({
      editor: {},
      tab: 0
    });

    /* src\components\logs\Button2.svelte generated by Svelte v3.29.7 */

    const { console: console_1$d } = globals;
    const file$o = "src\\components\\logs\\Button2.svelte";

    function create_fragment$s(ctx) {
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
    			t1 = text(" -\r\n  ");
    			button1 = element("button");
    			button1.textContent = "[++]";
    			t3 = text(" -\r\n  ");
    			button2 = element("button");
    			button2.textContent = "Open";
    			attr_dev(button0, "class", "tlb btn-min svelte-19x602s");
    			add_location(button0, file$o, 28, 2, 636);
    			attr_dev(button1, "class", "tlb btn-plus svelte-19x602s");
    			add_location(button1, file$o, 29, 2, 705);
    			attr_dev(button2, "class", "tlb btn-open svelte-19x602s");
    			add_location(button2, file$o, 30, 2, 774);
    			attr_dev(div, "class", "btn-container svelte-19x602s");
    			add_location(div, file$o, 27, 0, 605);
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
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
    		const id = `edit${tab + 1}`;
    		editor[id].trigger("fold", "editor.foldAll");
    	}

    	function btnPlus() {
    		const { tab, editor } = $tabstore;
    		const id = `edit${tab + 1}`;
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$d.warn(`<Button2> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button2",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* src\components\logs\BaseTab.svelte generated by Svelte v3.29.7 */

    const { console: console_1$e } = globals;
    const file$p = "src\\components\\logs\\BaseTab.svelte";

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
    			add_location(div0, file$p, 89, 4, 2170);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$p, 88, 2, 2136);
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
    			add_location(div0, file$p, 95, 4, 2280);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$p, 94, 2, 2246);
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
    			add_location(div0, file$p, 101, 4, 2385);
    			attr_dev(div1, "class", "view-container svelte-1tedr8d");
    			add_location(div1, file$p, 100, 2, 2351);
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

    function create_fragment$t(ctx) {
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$e.warn(`<BaseTab> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BaseTab",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src\components\logs\Json.svelte generated by Svelte v3.29.7 */

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

    function create_fragment$u(ctx) {
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
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Json",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src\components\logs\Html.svelte generated by Svelte v3.29.7 */

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

    function create_fragment$v(ctx) {
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
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Html",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* src\components\logs\Text.svelte generated by Svelte v3.29.7 */

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

    function create_fragment$w(ctx) {
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
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    /* src\components\logs\Css.svelte generated by Svelte v3.29.7 */

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

    function create_fragment$x(ctx) {
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
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Css",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* src\components\logs\Js.svelte generated by Svelte v3.29.7 */

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

    function create_fragment$y(ctx) {
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
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$y($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Js",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    /* src\components\logs\Show.svelte generated by Svelte v3.29.7 */
    const file$q = "src\\components\\logs\\Show.svelte";

    // (23:2) {:else}
    function create_else_block$3(ctx) {
    	let pre;
    	let t_value = /*$logstore*/ ctx[0].response + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(t_value);
    			attr_dev(pre, "class", "svelte-1bhfci6");
    			add_location(pre, file$q, 23, 4, 601);
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
    		id: create_else_block$3.name,
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
    function create_if_block_2(ctx) {
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
    		id: create_if_block_2.name,
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
    function create_if_block$6(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*$logstore*/ ctx[0].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "image");
    			add_location(img, file$q, 11, 4, 301);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(11:2) {#if $logstore.title.match('.png')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$z(ctx) {
    	let div;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	const if_block_creators = [
    		create_if_block$6,
    		create_if_block_1$3,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_else_block$3
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
    			add_location(div, file$q, 9, 0, 233);
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
    		id: create_fragment$z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$z($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$z, create_fragment$z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Show",
    			options,
    			id: create_fragment$z.name
    		});
    	}
    }

    /* src\components\logs\Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$f } = globals;

    // (29:0) <VBox2 {title} {top} {left} {dragend} {List} show={$logstore.logid}>
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
    		source: "(29:0) <VBox2 {title} {top} {left} {dragend} {List} show={$logstore.logid}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$A(ctx) {
    	let vbox2;
    	let current;

    	vbox2 = new VBox2({
    			props: {
    				title: Title,
    				top: top$2,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[2],
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

    			if (dirty & /*$$scope*/ 8) {
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
    		id: create_fragment$A.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const top$2 = "47";
    const id$2 = "logsLeft";

    function instance$A($$self, $$props, $$invalidate) {
    	let $logstore;
    	validate_store(logstore, "logstore");
    	component_subscribe($$self, logstore, $$value => $$invalidate(1, $logstore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 163;

    	onMount(async () => {
    		console.warn("onMount logs/index");

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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$f.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		logstore,
    		VBox2,
    		title: Title,
    		List: List$2,
    		Show,
    		left,
    		top: top$2,
    		id: id$2,
    		dragend,
    		$logstore
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, $logstore, dragend];
    }

    class Index$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$A, create_fragment$A, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$A.name
    		});
    	}
    }

    const tags = writable({
      filterUrl: true,
      __tag1: {},
      __tag2: {},
      __tag3: {},
      uniq: true,
      list: false
    });

    /* src\components\tags\Button.svelte generated by Svelte v3.29.7 */

    const { console: console_1$g } = globals;
    const file$r = "src\\components\\tags\\Button.svelte";

    function create_fragment$B(ctx) {
    	let div;
    	let label0;
    	let input0;
    	let t0;
    	let t1;
    	let label1;
    	let input1;
    	let t2;
    	let t3;
    	let label2;
    	let input2;
    	let t4;
    	let t5;
    	let button0;
    	let t6;
    	let t7;
    	let button1;
    	let t8;
    	let t9;
    	let label3;
    	let input3;
    	let t10;
    	let t11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = text("\r\n    list");
    			t1 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t2 = text("\r\n    fit");
    			t3 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t4 = text("\r\n    current-tab");
    			t5 = space();
    			button0 = element("button");
    			t6 = text("Reset");
    			t7 = space();
    			button1 = element("button");
    			t8 = text("Save");
    			t9 = space();
    			label3 = element("label");
    			input3 = element("input");
    			t10 = text("\r\n    autosave");
    			t11 = text("\r\n  .");
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "class", "svelte-11wpg9v");
    			add_location(input0, file$r, 55, 4, 1227);
    			attr_dev(label0, "class", "checker svelte-11wpg9v");
    			add_location(label0, file$r, 54, 2, 1198);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "class", "svelte-11wpg9v");
    			add_location(input1, file$r, 61, 4, 1342);
    			attr_dev(label1, "class", "checker svelte-11wpg9v");
    			add_location(label1, file$r, 60, 2, 1313);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-11wpg9v");
    			add_location(input2, file$r, 67, 4, 1456);
    			attr_dev(label2, "class", "checker svelte-11wpg9v");
    			add_location(label2, file$r, 66, 2, 1427);
    			attr_dev(button0, "class", "tlb btn-go svelte-11wpg9v");
    			button0.disabled = /*autoSave*/ ctx[0];
    			add_location(button0, file$r, 73, 2, 1578);
    			attr_dev(button1, "class", "tlb btn-go svelte-11wpg9v");
    			button1.disabled = /*autoSave*/ ctx[0];
    			add_location(button1, file$r, 74, 2, 1665);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "svelte-11wpg9v");
    			add_location(input3, file$r, 76, 4, 1780);
    			attr_dev(label3, "class", "checker svelte-11wpg9v");
    			add_location(label3, file$r, 75, 2, 1751);
    			attr_dev(div, "class", "btn-container svelte-11wpg9v");
    			add_location(div, file$r, 53, 0, 1167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(label0, input0);
    			input0.checked = /*$tags*/ ctx[1].list;
    			append_dev(label0, t0);
    			append_dev(div, t1);
    			append_dev(div, label1);
    			append_dev(label1, input1);
    			input1.checked = /*$tags*/ ctx[1].uniq;
    			append_dev(label1, t2);
    			append_dev(div, t3);
    			append_dev(div, label2);
    			append_dev(label2, input2);
    			input2.checked = /*$tags*/ ctx[1].filterUrl;
    			append_dev(label2, t4);
    			append_dev(div, t5);
    			append_dev(div, button0);
    			append_dev(button0, t6);
    			append_dev(div, t7);
    			append_dev(div, button1);
    			append_dev(button1, t8);
    			append_dev(div, t9);
    			append_dev(div, label3);
    			append_dev(label3, input3);
    			input3.checked = /*autoSave*/ ctx[0];
    			append_dev(label3, t10);
    			append_dev(div, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[4]),
    					listen_dev(input2, "click", urls, false, false, false),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[5]),
    					listen_dev(button0, "click", btnReset, false, false, false),
    					listen_dev(button1, "click", /*btnSave*/ ctx[2], false, false, false),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$tags*/ 2) {
    				input0.checked = /*$tags*/ ctx[1].list;
    			}

    			if (dirty & /*$tags*/ 2) {
    				input1.checked = /*$tags*/ ctx[1].uniq;
    			}

    			if (dirty & /*$tags*/ 2) {
    				input2.checked = /*$tags*/ ctx[1].filterUrl;
    			}

    			if (dirty & /*autoSave*/ 1) {
    				prop_dev(button0, "disabled", /*autoSave*/ ctx[0]);
    			}

    			if (dirty & /*autoSave*/ 1) {
    				prop_dev(button1, "disabled", /*autoSave*/ ctx[0]);
    			}

    			if (dirty & /*autoSave*/ 1) {
    				input3.checked = /*autoSave*/ ctx[0];
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
    		id: create_fragment$B.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnReset(e) {
    	window.mitm.files.route_events.routeTable();
    }

    function instance$B($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(1, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let autoSave = true;
    	let _tags = $tags;

    	function btnSave(e) {
    		const { __tag1, __tag2, __tag3, routes } = window.mitm;
    		const _childns = {};

    		for (const ns in routes) {
    			_childns[ns] = routes[ns]._childns;
    		}

    		const tags = { _childns, __tag1, __tag2, __tag3 };
    		console.log("saveTags", e.target);
    		ws__send("saveTags", tags);
    		urls();
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
    							btnSave(e);
    						},
    						50
    					);
    				}
    			}
    		};

    		window.mitm.browser.chgUrl_events.tagsEvent = function () {
    			console.log("Update tags!");
    			tags.set({ ...$tags });
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$g.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		$tags.list = this.checked;
    		tags.set($tags);
    	}

    	function input1_change_handler() {
    		$tags.uniq = this.checked;
    		tags.set($tags);
    	}

    	function input2_change_handler() {
    		$tags.filterUrl = this.checked;
    		tags.set($tags);
    	}

    	function input3_change_handler() {
    		autoSave = this.checked;
    		$$invalidate(0, autoSave);
    	}

    	$$self.$capture_state = () => ({
    		urls,
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

    	return [
    		autoSave,
    		$tags,
    		btnSave,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler
    	];
    }

    class Button$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$B, create_fragment$B, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$B.name
    		});
    	}
    }

    /* src\components\button\Chevron.svelte generated by Svelte v3.29.7 */
    const file$s = "src\\components\\button\\Chevron.svelte";

    function create_fragment$C(ctx) {
    	let button;
    	let t_value = /*$states*/ ctx[1].chevron + "";
    	let t;
    	let button_style_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "f-right svelte-1l2gymj");
    			attr_dev(button, "style", button_style_value = /*cols*/ ctx[0] === 3 ? "" : "display:none;");
    			add_location(button, file$s, 11, 0, 211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*resize*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$states*/ 2 && t_value !== (t_value = /*$states*/ ctx[1].chevron + "")) set_data_dev(t, t_value);

    			if (dirty & /*cols*/ 1 && button_style_value !== (button_style_value = /*cols*/ ctx[0] === 3 ? "" : "display:none;")) {
    				attr_dev(button, "style", button_style_value);
    			}
    		},
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
    		id: create_fragment$C.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$C($$self, $$props, $$invalidate) {
    	let $states;
    	validate_store(states, "states");
    	component_subscribe($$self, states, $$value => $$invalidate(1, $states = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chevron", slots, []);
    	let { cols = 3 } = $$props;

    	function resize(e) {
    		const all = { ...$states };
    		all.chevron = all.chevron === "[<<]" ? "[>>]" : "[<<]";
    		states.set(all);
    	}

    	const writable_props = ["cols"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chevron> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	$$self.$capture_state = () => ({ cols, states, resize, $states });

    	$$self.$inject_state = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cols, $states, resize];
    }

    class Chevron extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$C, create_fragment$C, safe_not_equal, { cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chevron",
    			options,
    			id: create_fragment$C.name
    		});
    	}

    	get cols() {
    		throw new Error("<Chevron>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Chevron>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags1_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$6, console: console_1$h } = globals;
    const file$t = "src\\components\\tags\\Tags1_.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (150:0) {#if listTags($tags).length}
    function create_if_block$7(ctx) {
    	let td;
    	let div;
    	let td_style_value;
    	let each_value = /*tgs*/ ctx[1];
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

    			attr_dev(div, "class", "border svelte-yydgal");
    			add_location(div, file$t, 151, 2, 3993);
    			attr_dev(td, "style", td_style_value = /*cols*/ ctx[0] > 1 ? "" : "display:none;");
    			attr_dev(td, "class", "svelte-yydgal");
    			add_location(td, file$t, 150, 0, 3945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*routetag, tgs, enter, leave, list, clicked*/ 54) {
    				each_value = /*tgs*/ ctx[1];
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

    			if (dirty & /*cols*/ 1 && td_style_value !== (td_style_value = /*cols*/ ctx[0] > 1 ? "" : "display:none;")) {
    				attr_dev(td, "style", td_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(150:0) {#if listTags($tags).length}",
    		ctx
    	});

    	return block;
    }

    // (153:4) {#each tgs as item}
    function create_each_block$6(ctx) {
    	let div;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[8] + "";
    	let t1;
    	let label_data_item_value;
    	let t2;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[7].call(input, /*item*/ ctx[8]);
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
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[8]);
    			attr_dev(input, "class", "svelte-yydgal");
    			add_location(input, file$t, 159, 8, 4197);
    			attr_dev(span, "class", "big svelte-yydgal");
    			add_location(span, file$t, 163, 8, 4320);
    			attr_dev(label, "data-item", label_data_item_value = /*item*/ ctx[8]);
    			attr_dev(label, "class", "svelte-yydgal");
    			add_location(label, file$t, 154, 6, 4089);
    			attr_dev(div, "class", div_class_value = "space0 " + /*routetag*/ ctx[5](/*item*/ ctx[8]) + " svelte-yydgal");
    			add_location(div, file$t, 153, 4, 4044);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*list*/ ctx[2][/*item*/ ctx[8]];
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*clicked*/ ctx[4], false, false, false),
    					listen_dev(input, "change", input_change_handler),
    					listen_dev(label, "mouseenter", enter, false, false, false),
    					listen_dev(label, "mouseleave", leave, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*tgs*/ 2 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[8])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*list, tgs*/ 6) {
    				input.checked = /*list*/ ctx[2][/*item*/ ctx[8]];
    			}

    			if (dirty & /*tgs*/ 2 && t1_value !== (t1_value = /*item*/ ctx[8] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*tgs*/ 2 && label_data_item_value !== (label_data_item_value = /*item*/ ctx[8])) {
    				attr_dev(label, "data-item", label_data_item_value);
    			}

    			if (dirty & /*tgs*/ 2 && div_class_value !== (div_class_value = "space0 " + /*routetag*/ ctx[5](/*item*/ ctx[8]) + " svelte-yydgal")) {
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
    		source: "(153:4) {#each tgs as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$D(ctx) {
    	let show_if = /*listTags*/ ctx[6](/*$tags*/ ctx[3]).length;
    	let if_block_anchor;
    	let if_block = show_if && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$tags*/ 8) show_if = /*listTags*/ ctx[6](/*$tags*/ ctx[3]).length;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function enter(e) {
    	const { rclass } = window.mitm.fn;
    	const node = document.querySelector(`#urls`);

    	if (node) {
    		const { item } = e.target.dataset;
    		const klass = item.replace(rclass, "-");

    		const css = `
    .urls ._${klass},
    .farg ._${klass},
    .t2 .spacex._${klass},
    .t3 .space3._${klass} {background: yellow;}
    .t2 .space1._${klass},
    .t3 .space1._${klass} {background: #dbf601 !important;}`;

    		node.innerHTML = css;
    	}
    }

    function leave(e) {
    	const { item } = e.target.dataset;
    	const node = document.querySelector(`#urls`);

    	if (node) {
    		node.innerHTML = ``;
    	}
    }

    function instance$D($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(3, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags1", slots, []);
    	let { cols } = $$props;

    	/***
    * ex:
    * __tag1[ns][remove-ads~1] = true
    * __tag1[ns][remove-ads~2] = false
    ***/
    	let tgs = [];

    	let list = {};

    	function clicked(e) {
    		const { routes, fn } = window.mitm;
    		const { resetRule3, oneSite } = fn;
    		const tagsStore = $tags;

    		setTimeout(
    			() => {
    				const { __tag1, __tag2, __tag3 } = $tags;
    				const { dataset, checked } = e.target;
    				const { item: tag } = dataset;
    				const [group1, id1] = tag.split("~");

    				for (let ns in __tag1) {
    					if (oneSite(tagsStore, ns)) {
    						ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    						__tag1[ns][tag] = checked;

    						if (id1 && checked) {
    							for (let tg in list) {
    								const [group2, id2] = tg.split("~");

    								if (group1 === group2 && id1 !== id2) {
    									if (__tag1[ns][group1] !== undefined) {
    										__tag1[ns][group1] = true;
    									}

    									__tag1[ns][tg] = false;
    								}
    							}
    						}
    					}
    				}

    				for (let ns in __tag2) {
    					if (oneSite(tagsStore, ns)) {
    						ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    						const tags = __tag2[ns];

    						for (let tg in tags) {
    							const typ2 = tg.split(":")[1] || tg;

    							if (tag === typ2) {
    								tags[tg].state = checked; // feat: update __tag2
    							}

    							if (group1 === typ2.split("~")[0]) {
    								tags[tg].state = __tag1[ns][typ2] || false; // feat: update __tag2
    							}
    						}
    					}
    				}

    				resetRule3($tags, tag);
    				const { filterUrl, tgroup, uniq } = $tags;

    				tags.set({
    					filterUrl,
    					__tag1,
    					__tag2,
    					__tag3,
    					tgroup,
    					uniq
    				});
    			},
    			10
    		);
    	}

    	function routetag(item) {
    		const { browser } = window.mitm;
    		const slc = $tags.__tag1[item] ? "slc" : "";
    		const grp = $tags.tgroup[item] ? "grp" : "";
    		let itm = "";

    		if ($tags.tgroup[item]) {
    			for (const ns of browser.nss) {
    				const tag3 = $tags.__tag3[ns] || [];

    				for (const id in tag3) {
    					const secs = tag3[id];

    					for (const sec in secs) {
    						const tags = secs[sec].tags; // feat: update __tag3

    						for (const tag in tags) {
    							if (item === tag.split(":").pop()) {
    								itm = "itm";
    								break;
    							}
    						}
    					}
    				}
    			}
    		}

    		let url = "";

    		for (const ns of browser.nss) {
    			const tag3 = $tags.__tag3[ns] || []; // feat: update __tag3

    			for (const id in tag3) {
    				if (id.match(`:${item}:`)) {
    					url = "url";
    					break;
    				}
    			}
    		}

    		return `rtag ${grp} ${slc} ${itm} ${url}`;
    	}

    	function listTags(tags) {
    		console.log("rerender...");
    		const { browser, routes, fn: { oneSite } } = window.mitm;
    		$$invalidate(2, list = {});
    		const nss = [];

    		for (let ns in tags.__tag1) {
    			nss.push(ns);

    			if (oneSite(tags, ns)) {
    				ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    				const tag1 = tags.__tag1[ns];

    				for (const id in tag1) {
    					if (list[id] === undefined || tag1[id]) {
    						$$invalidate(2, list[id] = tag1[id], list);
    					}
    				}
    			}
    		}

    		browser.nss = nss;
    		$$invalidate(1, tgs = Object.keys(list).sort());
    		return tgs;
    	}

    	const writable_props = ["cols"];

    	Object_1$6.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$h.warn(`<Tags1> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		list[item] = this.checked;
    		$$invalidate(2, list);
    		$$invalidate(1, tgs);
    	}

    	$$self.$$set = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		cols,
    		tgs,
    		list,
    		clicked,
    		routetag,
    		listTags,
    		enter,
    		leave,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    		if ("tgs" in $$props) $$invalidate(1, tgs = $$props.tgs);
    		if ("list" in $$props) $$invalidate(2, list = $$props.list);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cols, tgs, list, $tags, clicked, routetag, listTags, input_change_handler];
    }

    class Tags1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$D, create_fragment$D, safe_not_equal, { cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags1",
    			options,
    			id: create_fragment$D.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cols*/ ctx[0] === undefined && !("cols" in props)) {
    			console_1$h.warn("<Tags1> was created without expected prop 'cols'");
    		}
    	}

    	get cols() {
    		throw new Error("<Tags1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Tags1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags2_Title.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$7 } = globals;
    const file$u = "src\\components\\tags\\Tags2_Title.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (47:4) {:else}
    function create_else_block$4(ctx) {
    	let t_value = /*ns*/ ctx[0].split("@").pop() + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ns*/ 1 && t_value !== (t_value = /*ns*/ ctx[0].split("@").pop() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(47:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (45:4) {#if ns.match('_global_')}
    function create_if_block$8(ctx) {
    	let t0;
    	let span;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("[");
    			span = element("span");
    			span.textContent = `${" * "}`;
    			t2 = text("]");
    			attr_dev(span, "class", "svelte-1fqjhtj");
    			add_location(span, file$u, 45, 7, 1207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(45:4) {#if ns.match('_global_')}",
    		ctx
    	});

    	return block;
    }

    // (51:2) {#each childns(ns) as item}
    function create_each_block$7(ctx) {
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let t1_value = /*item*/ ctx[8].split("@")[0] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[6].call(input, /*item*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[8]);
    			attr_dev(input, "class", "svelte-1fqjhtj");
    			add_location(input, file$u, 52, 6, 1360);
    			attr_dev(label, "class", "checker svelte-1fqjhtj");
    			add_location(label, file$u, 51, 4, 1329);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*list*/ ctx[1][/*item*/ ctx[8]];
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*setSubns*/ ctx[3], false, false, false),
    					listen_dev(input, "change", input_change_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*ns*/ 1 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[8])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*list, childns, ns*/ 7) {
    				input.checked = /*list*/ ctx[1][/*item*/ ctx[8]];
    			}

    			if (dirty & /*ns*/ 1 && t1_value !== (t1_value = /*item*/ ctx[8].split("@")[0] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(51:2) {#each childns(ns) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$E(ctx) {
    	let div;
    	let collapse;
    	let t0;
    	let expand;
    	let t1;
    	let span;
    	let show_if;
    	let t2;
    	let current;

    	collapse = new Collapse({
    			props: {
    				name: "state2",
    				q: `.t2.${q(/*ns*/ ctx[0])}`
    			},
    			$$inline: true
    		});

    	collapse.$on("message", /*message_handler*/ ctx[4]);

    	expand = new Expand({
    			props: {
    				name: "state2",
    				q: `.t2.${q(/*ns*/ ctx[0])}`
    			},
    			$$inline: true
    		});

    	expand.$on("message", /*message_handler_1*/ ctx[5]);

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*ns*/ 1) show_if = !!/*ns*/ ctx[0].match("_global_");
    		if (show_if) return create_if_block$8;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);
    	let each_value = /*childns*/ ctx[2](/*ns*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(collapse.$$.fragment);
    			t0 = space();
    			create_component(expand.$$.fragment);
    			t1 = space();
    			span = element("span");
    			if_block.c();
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "ns svelte-1fqjhtj");
    			add_location(span, file$u, 43, 2, 1149);
    			attr_dev(div, "class", "space0 svelte-1fqjhtj");
    			add_location(div, file$u, 39, 0, 934);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(collapse, div, null);
    			append_dev(div, t0);
    			mount_component(expand, div, null);
    			append_dev(div, t1);
    			append_dev(div, span);
    			if_block.m(span, null);
    			append_dev(div, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const collapse_changes = {};
    			if (dirty & /*ns*/ 1) collapse_changes.q = `.t2.${q(/*ns*/ ctx[0])}`;
    			collapse.$set(collapse_changes);
    			const expand_changes = {};
    			if (dirty & /*ns*/ 1) expand_changes.q = `.t2.${q(/*ns*/ ctx[0])}`;
    			expand.$set(expand_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}

    			if (dirty & /*childns, ns, list, setSubns*/ 15) {
    				each_value = /*childns*/ ctx[2](/*ns*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
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
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapse.$$.fragment, local);
    			transition_in(expand.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapse.$$.fragment, local);
    			transition_out(expand.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(collapse);
    			destroy_component(expand);
    			if_block.d();
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

    function q(key) {
    	return key.replace(/[@.]/g, "-");
    }

    function instance$E($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(7, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags2_Title", slots, []);
    	let { ns } = $$props;
    	const list = window.mitm.routes[ns]._childns.list;

    	function childns(_ns) {
    		const { _childns } = window.mitm.routes[ns];

    		if (_childns && _childns.list !== undefined) {
    			return Object.keys(_childns.list);
    		} else {
    			return [];
    		}
    	}

    	function setSubns(e) {
    		const { checked, dataset } = e.target;

    		setTimeout(
    			() => {
    				const { _childns } = window.mitm.routes[ns];
    				const { list } = _childns;
    				const { item } = dataset;
    				_childns._subns = list[item] ? item : "";

    				if (checked) {
    					for (const id in list) {
    						if (id !== item) {
    							list[id] = false;
    						}
    					}
    				}

    				tags.set({ ...$tags });
    			},
    			1
    		);
    	}

    	const writable_props = ["ns"];

    	Object_1$7.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags2_Title> was created with unknown prop '${key}'`);
    	});

    	function message_handler(event) {
    		bubble($$self, event);
    	}

    	function message_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_change_handler(item) {
    		list[item] = this.checked;
    		$$invalidate(1, list);
    		$$invalidate(2, childns);
    		$$invalidate(0, ns);
    	}

    	$$self.$$set = $$props => {
    		if ("ns" in $$props) $$invalidate(0, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		Expand,
    		Collapse,
    		dataset_dev,
    		ns,
    		list,
    		q,
    		childns,
    		setSubns,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("ns" in $$props) $$invalidate(0, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ns,
    		list,
    		childns,
    		setSubns,
    		message_handler,
    		message_handler_1,
    		input_change_handler
    	];
    }

    class Tags2_Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$E, create_fragment$E, safe_not_equal, { ns: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2_Title",
    			options,
    			id: create_fragment$E.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ns*/ ctx[0] === undefined && !("ns" in props)) {
    			console.warn("<Tags2_Title> was created without expected prop 'ns'");
    		}
    	}

    	get ns() {
    		throw new Error("<Tags2_Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ns(value) {
    		throw new Error("<Tags2_Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags2_1.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$8, console: console_1$i } = globals;
    const file$v = "src\\components\\tags\\Tags2_1.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[14] = list;
    	child_ctx[15] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (112:0) {#if Object.keys(items).length}
    function create_if_block$9(ctx) {
    	let div;
    	let tags2title;
    	let t;
    	let current;

    	tags2title = new Tags2_Title({
    			props: { ns: /*ns*/ ctx[1] },
    			$$inline: true
    		});

    	tags2title.$on("message", /*message_handler*/ ctx[9]);
    	let each_value = /*itemlist*/ ctx[4](/*items*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tags2title.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "border svelte-1if6uvz");
    			add_location(div, file$v, 112, 0, 3074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tags2title, div, null);
    			append_dev(div, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tags2title_changes = {};
    			if (dirty & /*ns*/ 2) tags2title_changes.ns = /*ns*/ ctx[1];
    			tags2title.$set(tags2title_changes);

    			if (dirty & /*q, ns, urllist, $tags, itemlist, items, spacex, routetag, linkTags, show, clicked, isGroup*/ 511) {
    				each_value = /*itemlist*/ ctx[4](/*items*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
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
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tags2title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tags2title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tags2title);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(112:0) {#if Object.keys(items).length}",
    		ctx
    	});

    	return block;
    }

    // (134:4) {:else}
    function create_else_block$5(ctx) {
    	let div;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span0;
    	let t1_value = show(/*item*/ ctx[13]) + "";
    	let t1;
    	let span0_class_value;
    	let t2;
    	let span1;
    	let t3_value = /*linkTags*/ ctx[6](/*item*/ ctx[13]) + "";
    	let t3;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function input_change_handler_1() {
    		/*input_change_handler_1*/ ctx[11].call(input, /*item*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[13]);
    			attr_dev(input, "class", "svelte-1if6uvz");
    			add_location(input, file$v, 136, 10, 3974);
    			attr_dev(span0, "class", span0_class_value = "itm " + (/*item*/ ctx[13].match(":") ? "big" : "") + " svelte-1if6uvz");
    			add_location(span0, file$v, 140, 10, 4145);
    			attr_dev(span1, "class", "link-tags svelte-1if6uvz");
    			add_location(span1, file$v, 141, 10, 4225);
    			attr_dev(label, "class", "svelte-1if6uvz");
    			add_location(label, file$v, 135, 8, 3955);
    			attr_dev(div, "class", div_class_value = "space1 " + /*routetag*/ ctx[5](/*$tags*/ ctx[2], /*item*/ ctx[13]) + " svelte-1if6uvz");
    			add_location(div, file$v, 134, 6, 3901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*items*/ ctx[0][/*item*/ ctx[13]].state;
    			append_dev(label, t0);
    			append_dev(label, span0);
    			append_dev(span0, t1);
    			append_dev(label, t2);
    			append_dev(label, span1);
    			append_dev(span1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*clicked*/ ctx[3], false, false, false),
    					listen_dev(input, "change", input_change_handler_1)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*items*/ 1 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[13])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*items, itemlist*/ 17) {
    				input.checked = /*items*/ ctx[0][/*item*/ ctx[13]].state;
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = show(/*item*/ ctx[13]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 1 && span0_class_value !== (span0_class_value = "itm " + (/*item*/ ctx[13].match(":") ? "big" : "") + " svelte-1if6uvz")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*items*/ 1 && t3_value !== (t3_value = /*linkTags*/ ctx[6](/*item*/ ctx[13]) + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*$tags, items*/ 5 && div_class_value !== (div_class_value = "space1 " + /*routetag*/ ctx[5](/*$tags*/ ctx[2], /*item*/ ctx[13]) + " svelte-1if6uvz")) {
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
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(134:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (118:4) {#if isGroup(item)}
    function create_if_block_1$4(ctx) {
    	let details;
    	let summary;
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span0;
    	let t1_value = show(/*item*/ ctx[13]) + "";
    	let t1;
    	let span0_class_value;
    	let t2;
    	let span1;
    	let t3_value = /*linkTags*/ ctx[6](/*item*/ ctx[13]) + "";
    	let t3;
    	let summary_class_value;
    	let t4;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[10].call(input, /*item*/ ctx[13]);
    	}

    	let each_value_1 = /*urllist*/ ctx[7](/*$tags*/ ctx[2], /*item*/ ctx[13]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[13]);
    			attr_dev(input, "class", "svelte-1if6uvz");
    			add_location(input, file$v, 121, 12, 3378);
    			attr_dev(span0, "class", span0_class_value = "itm " + (/*item*/ ctx[13].match(":") ? "big" : "") + " svelte-1if6uvz");
    			add_location(span0, file$v, 125, 12, 3557);
    			attr_dev(span1, "class", "link-tags svelte-1if6uvz");
    			add_location(span1, file$v, 126, 12, 3639);
    			attr_dev(label, "class", "svelte-1if6uvz");
    			add_location(label, file$v, 120, 10, 3357);
    			attr_dev(summary, "class", summary_class_value = "space1 " + /*routetag*/ ctx[5](/*$tags*/ ctx[2], /*item*/ ctx[13]) + " svelte-1if6uvz");
    			add_location(summary, file$v, 119, 8, 3297);
    			add_location(details, file$v, 118, 6, 3278);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, label);
    			append_dev(label, input);
    			input.checked = /*items*/ ctx[0][/*item*/ ctx[13]].state;
    			append_dev(label, t0);
    			append_dev(label, span0);
    			append_dev(span0, t1);
    			append_dev(label, t2);
    			append_dev(label, span1);
    			append_dev(span1, t3);
    			append_dev(details, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(details, null);
    			}

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

    			if (dirty & /*items*/ 1 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[13])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*items, itemlist*/ 17) {
    				input.checked = /*items*/ ctx[0][/*item*/ ctx[13]].state;
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = show(/*item*/ ctx[13]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*items*/ 1 && span0_class_value !== (span0_class_value = "itm " + (/*item*/ ctx[13].match(":") ? "big" : "") + " svelte-1if6uvz")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*items*/ 1 && t3_value !== (t3_value = /*linkTags*/ ctx[6](/*item*/ ctx[13]) + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*$tags, items*/ 5 && summary_class_value !== (summary_class_value = "space1 " + /*routetag*/ ctx[5](/*$tags*/ ctx[2], /*item*/ ctx[13]) + " svelte-1if6uvz")) {
    				attr_dev(summary, "class", summary_class_value);
    			}

    			if (dirty & /*spacex, $tags, itemlist, items, urllist*/ 405) {
    				each_value_1 = /*urllist*/ ctx[7](/*$tags*/ ctx[2], /*item*/ ctx[13]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(details, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(118:4) {#if isGroup(item)}",
    		ctx
    	});

    	return block;
    }

    // (130:8) {#each urllist($tags, item) as path}
    function create_each_block_1$2(ctx) {
    	let div;
    	let t_value = /*path*/ ctx[16] + "";
    	let t;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "spacex " + /*spacex*/ ctx[8](/*$tags*/ ctx[2], /*item*/ ctx[13], /*path*/ ctx[16]) + " svelte-1if6uvz");
    			add_location(div, file$v, 130, 10, 3785);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$tags, items*/ 5 && t_value !== (t_value = /*path*/ ctx[16] + "")) set_data_dev(t, t_value);

    			if (dirty & /*$tags, items*/ 5 && div_class_value !== (div_class_value = "spacex " + /*spacex*/ ctx[8](/*$tags*/ ctx[2], /*item*/ ctx[13], /*path*/ ctx[16]) + " svelte-1if6uvz")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(130:8) {#each urllist($tags, item) as path}",
    		ctx
    	});

    	return block;
    }

    // (116:2) {#each itemlist(items) as item}
    function create_each_block$8(ctx) {
    	let div;
    	let show_if;
    	let t;
    	let div_class_value;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*items*/ 1) show_if = !!isGroup$1(/*item*/ ctx[13]);
    		if (show_if) return create_if_block_1$4;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			attr_dev(div, "class", div_class_value = "t2 " + q$1(/*ns*/ ctx[1]) + " svelte-1if6uvz");
    			add_location(div, file$v, 116, 4, 3221);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t);
    				}
    			}

    			if (dirty & /*ns*/ 2 && div_class_value !== (div_class_value = "t2 " + q$1(/*ns*/ ctx[1]) + " svelte-1if6uvz")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(116:2) {#each itemlist(items) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$F(ctx) {
    	let show_if = Object.keys(/*items*/ ctx[0]).length;
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 1) show_if = Object.keys(/*items*/ ctx[0]).length;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*items*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$9(ctx);
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
    		id: create_fragment$F.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function show(item) {
    	const short = { request: "reqs", response: "resp" };
    	const [k, v] = item.split(":");
    	if (v === undefined) return k;
    	return `${v}{${short[k] || k}}`;
    }

    function isGroup$1(item) {
    	const [sec, tag] = item.split(":");
    	return tag && sec !== "url";
    }

    function q$1(key) {
    	return key.replace(/[@.]/g, "-");
    }

    function instance$F($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags2_1", slots, []);
    	let { items } = $$props;
    	let { ns } = $$props;

    	function clicked(e) {
    		const { resetRule2, resetRule3 } = window.mitm.fn;
    		const { __tag1, __tag2, __tag3 } = $tags;
    		const { item } = e.target.dataset;
    		const namespace = __tag2[ns];
    		const tagx = {};

    		for (let itm in namespace) {
    			tagx[itm] = namespace[itm];
    		}

    		setTimeout(
    			() => {
    				console.log("e", { __tag2, __tag3 });
    				resetRule2($tags, item, ns, tagx);
    				resetRule3($tags, item, ns);
    				const { filterUrl, tgroup, uniq } = $tags;

    				tags.set({
    					filterUrl,
    					__tag1,
    					__tag2,
    					__tag3,
    					tgroup,
    					uniq
    				});
    			},
    			10
    		);
    	}

    	function itemlist(items) {
    		const { fn: { sortTag } } = window.mitm;
    		let arr = Object.keys(items);

    		if ($tags.uniq) {
    			arr = arr.filter(x => x.match(":")).filter(x => !x.match("url:"));
    		}

    		return arr.sort(sortTag);
    	}

    	function routetag(tags, item) {
    		const { __tag1, __tag2, fn: { rclass } } = window.mitm;
    		const _tags = __tag2[ns][item].tags || []; // feat: update __tag2
    		const tag2 = item.split(":");
    		let klas;

    		if (tag2[1]) {
    			klas = items[item].state ? "rtag slc" : "rtag"; // feat: update __tag2
    		} else {
    			klas = items[item].state ? "stag slc" : ""; // feat: update __tag2
    		}

    		if (item.match("url:")) {
    			klas += " url";
    		}

    		for (const tag of _tags) {
    			if (__tag1[ns][tag] === false) {
    				klas += " grey";
    				break;
    			}
    		}

    		return klas + ` _${tag2.pop().replace(rclass, "-")}`;
    	}

    	function linkTags(item) {
    		const { tags } = window.mitm.__tag2[ns][item]; // feat: update __tag2
    		const linkTags = tags && tags.length ? `[${tags.join(",")}]` : "";
    		return linkTags;
    	}

    	function urllist(_tags, item) {
    		const { __tag2, fn: { noTagInRule, uniq } } = window.mitm;
    		const { tags } = __tag2[ns][item]; // feat: update __tag2

    		if (tags && tags.length) {
    			item = `${item} ${tags.join(" ")}`;
    		}

    		let obj = window.mitm.routes[ns][item];

    		if (obj === undefined) {
    			obj = [];
    		} else if (!Array.isArray(obj)) {
    			obj = Object.keys(obj);
    		}

    		obj = obj.map(noTagInRule).filter(uniq);
    		return obj;
    	}

    	function alltags(tags, item, path) {
    		const { tagsIn__tag3 } = window.mitm.fn;
    		return tagsIn__tag3(tags, ns, path, item);
    	}

    	function spacex(tags, item, path) {
    		let klass = items[item].state ? "slc" : ""; // feat: update __tag2
    		const { rclass, isRuleOff } = window.mitm.fn;
    		isRuleOff(tags, ns, path) && (klass += " grey");
    		const _tags = alltags(tags, item, path);
    		_tags.length && (klass += ` _${_tags.join(" _")}`);
    		return `${klass} _${item.split(":")[1].replace(rclass, "-")}`;
    	}

    	const writable_props = ["items", "ns"];

    	Object_1$8.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$i.warn(`<Tags2_1> was created with unknown prop '${key}'`);
    	});

    	function message_handler(event) {
    		bubble($$self, event);
    	}

    	function input_change_handler(item) {
    		items[item].state = this.checked;
    		$$invalidate(0, items);
    		$$invalidate(4, itemlist);
    	}

    	function input_change_handler_1(item) {
    		items[item].state = this.checked;
    		$$invalidate(0, items);
    		$$invalidate(4, itemlist);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		Tags2Title: Tags2_Title,
    		items,
    		ns,
    		clicked,
    		itemlist,
    		routetag,
    		show,
    		linkTags,
    		isGroup: isGroup$1,
    		urllist,
    		alltags,
    		spacex,
    		q: q$1,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		ns,
    		$tags,
    		clicked,
    		itemlist,
    		routetag,
    		linkTags,
    		urllist,
    		spacex,
    		message_handler,
    		input_change_handler,
    		input_change_handler_1
    	];
    }

    class Tags2_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$F, create_fragment$F, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2_1",
    			options,
    			id: create_fragment$F.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console_1$i.warn("<Tags2_1> was created without expected prop 'items'");
    		}

    		if (/*ns*/ ctx[1] === undefined && !("ns" in props)) {
    			console_1$i.warn("<Tags2_1> was created without expected prop 'ns'");
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

    /* src\components\tags\Tags2_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$9 } = globals;
    const file$w = "src\\components\\tags\\Tags2_.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (15:2) {#if window.mitm.fn.oneSite($tags, ns)}
    function create_if_block$a(ctx) {
    	let tags21;
    	let current;

    	tags21 = new Tags2_1({
    			props: {
    				items: /*$tags*/ ctx[2].__tag2[nspace(/*ns*/ ctx[4])],
    				ns: nspace(/*ns*/ ctx[4])
    			},
    			$$inline: true
    		});

    	tags21.$on("message", /*message_handler*/ ctx[3]);

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
    			if (dirty & /*$tags*/ 4) tags21_changes.items = /*$tags*/ ctx[2].__tag2[nspace(/*ns*/ ctx[4])];
    			if (dirty & /*$tags*/ 4) tags21_changes.ns = nspace(/*ns*/ ctx[4]);
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
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(15:2) {#if window.mitm.fn.oneSite($tags, ns)}",
    		ctx
    	});

    	return block;
    }

    // (14:0) {#each Object.keys($tags.__tag2) as ns}
    function create_each_block$9(ctx) {
    	let show_if = window.mitm.fn.oneSite(/*$tags*/ ctx[2], /*ns*/ ctx[4]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$a(ctx);

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
    			if (dirty & /*$tags*/ 4) show_if = window.mitm.fn.oneSite(/*$tags*/ ctx[2], /*ns*/ ctx[4]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$tags*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$a(ctx);
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
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(14:0) {#each Object.keys($tags.__tag2) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$G(ctx) {
    	let td;
    	let td_style_value;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[2].__tag2);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
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

    			attr_dev(td, "style", td_style_value = "width:" + (/*$states*/ ctx[1].chevron === "[<<]" ? 45 : 35) + "%; " + (/*cols*/ ctx[0] > 0 ? "" : "display:none;"));
    			add_location(td, file$w, 12, 0, 300);
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
    			if (dirty & /*$tags, nspace, Object, window*/ 4) {
    				each_value = Object.keys(/*$tags*/ ctx[2].__tag2);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
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

    			if (!current || dirty & /*$states, cols*/ 3 && td_style_value !== (td_style_value = "width:" + (/*$states*/ ctx[1].chevron === "[<<]" ? 45 : 35) + "%; " + (/*cols*/ ctx[0] > 0 ? "" : "display:none;"))) {
    				attr_dev(td, "style", td_style_value);
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
    		id: create_fragment$G.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function nspace(ns) {
    	const { _subns } = window.mitm.routes[ns]._childns;
    	return _subns || ns; // feat: chg to child namespace
    }

    function instance$G($$self, $$props, $$invalidate) {
    	let $states;
    	let $tags;
    	validate_store(states, "states");
    	component_subscribe($$self, states, $$value => $$invalidate(1, $states = $$value));
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags2", slots, []);
    	let { cols } = $$props;
    	const writable_props = ["cols"];

    	Object_1$9.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags2> was created with unknown prop '${key}'`);
    	});

    	function message_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	$$self.$capture_state = () => ({
    		cols,
    		tags,
    		Tags21: Tags2_1,
    		states,
    		nspace,
    		$states,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cols, $states, $tags, message_handler];
    }

    class Tags2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$G, create_fragment$G, safe_not_equal, { cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2",
    			options,
    			id: create_fragment$G.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cols*/ ctx[0] === undefined && !("cols" in props)) {
    			console.warn("<Tags2> was created without expected prop 'cols'");
    		}
    	}

    	get cols() {
    		throw new Error("<Tags2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Tags2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Tags3_3.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$a } = globals;
    const file$x = "src\\components\\tags\\Tags3_3.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (72:4) {:else}
    function create_else_block$6(ctx) {
    	let label;
    	let input;
    	let input_data_item_value;
    	let t0;
    	let span;
    	let t1_value = title$2(/*item*/ ctx[2]) + "";
    	let t1;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[8].call(input, /*item*/ ctx[2]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[2]);
    			add_location(input, file$x, 73, 8, 1888);
    			attr_dev(span, "class", "svelte-1dy7019");
    			add_location(span, file$x, 77, 8, 2018);
    			add_location(label, file$x, 72, 6, 1871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*items*/ ctx[0].tags[/*item*/ ctx[2]];
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*clicked*/ ctx[4], false, false, false),
    					listen_dev(input, "change", input_change_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$tags*/ 8 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[2])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*items, xitems, $tags*/ 73) {
    				input.checked = /*items*/ ctx[0].tags[/*item*/ ctx[2]];
    			}

    			if (dirty & /*$tags*/ 8 && t1_value !== (t1_value = title$2(/*item*/ ctx[2]) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(72:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#if check(item) }
    function create_if_block$b(ctx) {
    	let label;
    	let input;
    	let input_data_item_value;
    	let input_checked_value;
    	let t0;
    	let span;
    	let t1_value = title$2(/*item*/ ctx[2]) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "data-item", input_data_item_value = /*item*/ ctx[2]);
    			input.checked = input_checked_value = /*$tags*/ ctx[3].__tag2[/*ns*/ ctx[1]][/*item*/ ctx[2]];
    			input.disabled = true;
    			add_location(input, file$x, 66, 8, 1697);
    			attr_dev(span, "class", "svelte-1dy7019");
    			add_location(span, file$x, 69, 8, 1808);
    			add_location(label, file$x, 65, 6, 1680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$tags*/ 8 && input_data_item_value !== (input_data_item_value = /*item*/ ctx[2])) {
    				attr_dev(input, "data-item", input_data_item_value);
    			}

    			if (dirty & /*$tags, ns*/ 10 && input_checked_value !== (input_checked_value = /*$tags*/ ctx[3].__tag2[/*ns*/ ctx[1]][/*item*/ ctx[2]])) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*$tags*/ 8 && t1_value !== (t1_value = title$2(/*item*/ ctx[2]) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(65:4) {#if check(item) }",
    		ctx
    	});

    	return block;
    }

    // (63:0) {#each xitems($tags) as item}
    function create_each_block$a(ctx) {
    	let div;
    	let show_if;
    	let t;
    	let div_class_value;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*$tags*/ 8) show_if = !!check(/*item*/ ctx[2]);
    		if (show_if) return create_if_block$b;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			attr_dev(div, "class", div_class_value = "space3 " + /*routetag*/ ctx[5](/*$tags*/ ctx[3], /*item*/ ctx[2]) + " svelte-1dy7019");
    			add_location(div, file$x, 63, 2, 1604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t);
    				}
    			}

    			if (dirty & /*$tags*/ 8 && div_class_value !== (div_class_value = "space3 " + /*routetag*/ ctx[5](/*$tags*/ ctx[3], /*item*/ ctx[2]) + " svelte-1dy7019")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(63:0) {#each xitems($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$H(ctx) {
    	let each_1_anchor;
    	let each_value = /*xitems*/ ctx[6](/*$tags*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
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
    			if (dirty & /*routetag, $tags, xitems, title, ns, check, items, clicked*/ 123) {
    				each_value = /*xitems*/ ctx[6](/*$tags*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
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
    		id: create_fragment$H.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$2(item) {
    	const [key, tag] = item.split(":");
    	return tag ? `${tag}{${key}}` : key;
    }

    function check(item) {
    	return item.indexOf("url:") === -1 && item.indexOf(":") > -1;
    }

    function instance$H($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(3, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3_3", slots, []);
    	let { items } = $$props;
    	let { item } = $$props;
    	let { path } = $$props;
    	let { ns } = $$props;

    	function clicked(e) {
    		const { __tag3 } = $tags;
    		const _item = __tag3[ns][path][item];

    		setTimeout(
    			() => {
    				const { item: i } = e.target.dataset;
    				const [group1, id1] = i.split("url:").pop().split("~");

    				for (let itm in _item.tags) {
    					// feat: update __tag3
    					const [group2, id2] = itm.split("url:").pop().split("~");

    					if (group1 === group2 && item !== itm) {
    						if (id2 === undefined) {
    							_item.tags[itm] = _item.tags[i];
    						} else if (id1 !== undefined && id1 !== id2) {
    							_item.tags[itm] = false;
    						}
    					}
    				}

    				tags.set({ ...$tags, __tag3 });
    			},
    			50
    		);
    	}

    	function routetag(tags, item) {
    		const { rclass } = window.mitm.fn;
    		let klas = items[item] ? "rtag slc" : "rtag";

    		if (item.indexOf("url:") > -1) {
    			klas += " url";
    		} else if (item.indexOf(":") > -1) {
    			klas += tags.__tag2[ns][item] ? " slc" : "";
    			klas += " r2";
    		}

    		return `${klas} _${item.split(":").pop().replace(rclass, "-")}`;
    	}

    	function xitems(tags) {
    		const { uniq, sortTag } = window.mitm.fn;
    		const arr = Object.keys(items.tags); // feat: update __tag3

    		if (tags.__tag2[ns][item] !== undefined) {
    			arr.push(item);
    		}

    		return arr.filter(uniq).sort(sortTag);
    	}

    	const writable_props = ["items", "item", "path", "ns"];

    	Object_1$a.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_3> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler(item) {
    		items.tags[item] = this.checked;
    		$$invalidate(0, items);
    		$$invalidate(6, xitems);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("item" in $$props) $$invalidate(2, item = $$props.item);
    		if ("path" in $$props) $$invalidate(7, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		items,
    		item,
    		path,
    		ns,
    		clicked,
    		routetag,
    		title: title$2,
    		xitems,
    		check,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("item" in $$props) $$invalidate(2, item = $$props.item);
    		if ("path" in $$props) $$invalidate(7, path = $$props.path);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, ns, item, $tags, clicked, routetag, xitems, path, input_change_handler];
    }

    class Tags3_3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$H, create_fragment$H, safe_not_equal, { items: 0, item: 2, path: 7, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_3",
    			options,
    			id: create_fragment$H.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Tags3_3> was created without expected prop 'items'");
    		}

    		if (/*item*/ ctx[2] === undefined && !("item" in props)) {
    			console.warn("<Tags3_3> was created without expected prop 'item'");
    		}

    		if (/*path*/ ctx[7] === undefined && !("path" in props)) {
    			console.warn("<Tags3_3> was created without expected prop 'path'");
    		}

    		if (/*ns*/ ctx[1] === undefined && !("ns" in props)) {
    			console.warn("<Tags3_3> was created without expected prop 'ns'");
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

    /* src\components\tags\Tags3_2.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$b } = globals;
    const file$y = "src\\components\\tags\\Tags3_2.svelte";

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (38:0) {#each xitems($tags) as item}
    function create_each_block$b(ctx) {
    	let details;
    	let summary;
    	let t0_value = title$3(/*item*/ ctx[7]) + "";
    	let t0;
    	let t1;
    	let span0;
    	let t2_value = (/*items*/ ctx[0][/*item*/ ctx[7]].note || "") + "";
    	let t2;
    	let t3;
    	let span1;
    	let t4_value = `<${/*xtags*/ ctx[6](/*$tags*/ ctx[3], /*item*/ ctx[7])}>` + "";
    	let t4;
    	let summary_class_value;
    	let t5;
    	let tags33;
    	let t6;
    	let current;

    	tags33 = new Tags3_3({
    			props: {
    				items: /*items*/ ctx[0][/*item*/ ctx[7]],
    				item: /*item*/ ctx[7],
    				path: /*path*/ ctx[1],
    				ns: /*ns*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			t0 = text(t0_value);
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			create_component(tags33.$$.fragment);
    			t6 = space();
    			attr_dev(span0, "class", "prop svelte-1ip64o1");
    			add_location(span0, file$y, 41, 6, 938);
    			attr_dev(span1, "class", "tags svelte-1ip64o1");
    			add_location(span1, file$y, 42, 6, 994);
    			attr_dev(summary, "class", summary_class_value = "space2 " + /*active*/ ctx[4](/*item*/ ctx[7]) + " svelte-1ip64o1");
    			add_location(summary, file$y, 39, 4, 870);
    			attr_dev(details, "class", "svelte-1ip64o1");
    			add_location(details, file$y, 38, 2, 855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, t0);
    			append_dev(summary, t1);
    			append_dev(summary, span0);
    			append_dev(span0, t2);
    			append_dev(summary, t3);
    			append_dev(summary, span1);
    			append_dev(span1, t4);
    			append_dev(details, t5);
    			mount_component(tags33, details, null);
    			append_dev(details, t6);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$tags*/ 8) && t0_value !== (t0_value = title$3(/*item*/ ctx[7]) + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*items, $tags*/ 9) && t2_value !== (t2_value = (/*items*/ ctx[0][/*item*/ ctx[7]].note || "") + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*$tags*/ 8) && t4_value !== (t4_value = `<${/*xtags*/ ctx[6](/*$tags*/ ctx[3], /*item*/ ctx[7])}>` + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty & /*$tags*/ 8 && summary_class_value !== (summary_class_value = "space2 " + /*active*/ ctx[4](/*item*/ ctx[7]) + " svelte-1ip64o1")) {
    				attr_dev(summary, "class", summary_class_value);
    			}

    			const tags33_changes = {};
    			if (dirty & /*items, $tags*/ 9) tags33_changes.items = /*items*/ ctx[0][/*item*/ ctx[7]];
    			if (dirty & /*$tags*/ 8) tags33_changes.item = /*item*/ ctx[7];
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
    			if (detaching) detach_dev(details);
    			destroy_component(tags33);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(38:0) {#each xitems($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$I(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*xitems*/ ctx[5](/*$tags*/ ctx[3]);
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
    			if (dirty & /*items, xitems, $tags, path, ns, active, xtags, title*/ 127) {
    				each_value = /*xitems*/ ctx[5](/*$tags*/ ctx[3]);
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
    		id: create_fragment$I.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$3(item) {
    	return `${item.split(":")[0]}:`;
    }

    function instance$I($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(3, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3_2", slots, []);
    	let { items } = $$props;
    	let { path } = $$props;
    	let { ns } = $$props;

    	function active(item) {
    		let enabled = $tags.__tag2[ns][item] === false ? false : true;

    		for (const id in items[item]) {
    			if (items[item][id] === false) {
    				enabled = false;
    				break;
    			}
    		}

    		return enabled ? "atag slc" : "atag";
    	}

    	function xitems(tags) {
    		const { __tag3 } = tags;
    		const namespace = __tag3[ns];
    		const typs = namespace[path];
    		let arr = Object.keys(typs);
    		return arr;
    	}

    	function xtags(tags, item) {
    		const arr = Object.keys(items[item].tags); // feat: update __tag3
    		const map = arr.map(x => x.split(":").pop());
    		return map.sort().join(" ");
    	}

    	const writable_props = ["items", "path", "ns"];

    	Object_1$b.keys($$props).forEach(key => {
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
    		title: title$3,
    		active,
    		xitems,
    		xtags,
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

    	return [items, path, ns, $tags, active, xitems, xtags];
    }

    class Tags3_2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$I, create_fragment$I, safe_not_equal, { items: 0, path: 1, ns: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_2",
    			options,
    			id: create_fragment$I.name
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

    /* src\components\tags\Tags3_1.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$c } = globals;
    const file$z = "src\\components\\tags\\Tags3_1.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (61:6) {:else}
    function create_else_block$7(ctx) {
    	let t_value = /*ns*/ ctx[1].split("@").pop() + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ns*/ 2 && t_value !== (t_value = /*ns*/ ctx[1].split("@").pop() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$7.name,
    		type: "else",
    		source: "(61:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:6) {#if ns.match('_global_')}
    function create_if_block$c(ctx) {
    	let t0;
    	let span;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("[");
    			span = element("span");
    			span.textContent = `${" * "}`;
    			t2 = text("]");
    			attr_dev(span, "class", "svelte-je1upl");
    			add_location(span, file$z, 59, 9, 1655);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(59:6) {#if ns.match('_global_')}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {#each xitems($tags) as path, i}
    function create_each_block$c(ctx) {
    	let details;
    	let summary;
    	let t0_value = /*path*/ ctx[8] + "";
    	let t0;
    	let summary_class_value;
    	let t1;
    	let tags32;
    	let t2;
    	let details_id_value;
    	let current;
    	let mounted;
    	let dispose;

    	tags32 = new Tags3_2({
    			props: {
    				items: /*items*/ ctx[0][/*path*/ ctx[8]],
    				path: /*path*/ ctx[8],
    				ns: /*ns*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(tags32.$$.fragment);
    			t2 = space();
    			attr_dev(summary, "class", summary_class_value = "space1 " + /*xtags*/ ctx[4](/*path*/ ctx[8]) + " svelte-je1upl");
    			add_location(summary, file$z, 68, 6, 1860);
    			attr_dev(details, "id", details_id_value = "path" + /*i*/ ctx[10]);
    			add_location(details, file$z, 67, 4, 1830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, t0);
    			append_dev(details, t1);
    			mount_component(tags32, details, null);
    			append_dev(details, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(summary, "click", btnExpand, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$tags*/ 4) && t0_value !== (t0_value = /*path*/ ctx[8] + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*$tags*/ 4 && summary_class_value !== (summary_class_value = "space1 " + /*xtags*/ ctx[4](/*path*/ ctx[8]) + " svelte-je1upl")) {
    				attr_dev(summary, "class", summary_class_value);
    			}

    			const tags32_changes = {};
    			if (dirty & /*items, $tags*/ 5) tags32_changes.items = /*items*/ ctx[0][/*path*/ ctx[8]];
    			if (dirty & /*$tags*/ 4) tags32_changes.path = /*path*/ ctx[8];
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
    			if (detaching) detach_dev(details);
    			destroy_component(tags32);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(67:4) {#each xitems($tags) as path, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$J(ctx) {
    	let div2;
    	let div0;
    	let collapse;
    	let t0;
    	let expand;
    	let t1;
    	let span;
    	let show_if;
    	let t2;
    	let div1;
    	let div1_class_value;
    	let current;

    	collapse = new Collapse({
    			props: {
    				name: "state3",
    				q: `.t3.${q$2(/*ns*/ ctx[1])}`
    			},
    			$$inline: true
    		});

    	collapse.$on("message", /*message_handler*/ ctx[5]);

    	expand = new Expand({
    			props: {
    				name: "state3",
    				q: `.t3.${q$2(/*ns*/ ctx[1])}`
    			},
    			$$inline: true
    		});

    	expand.$on("message", /*message_handler_1*/ ctx[6]);

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*ns*/ 2) show_if = !!/*ns*/ ctx[1].match("_global_");
    		if (show_if) return create_if_block$c;
    		return create_else_block$7;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);
    	let each_value = /*xitems*/ ctx[3](/*$tags*/ ctx[2]);
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
    			div2 = element("div");
    			div0 = element("div");
    			create_component(collapse.$$.fragment);
    			t0 = space();
    			create_component(expand.$$.fragment);
    			t1 = space();
    			span = element("span");
    			if_block.c();
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "ns svelte-je1upl");
    			add_location(span, file$z, 57, 4, 1593);
    			attr_dev(div0, "class", "space0 svelte-je1upl");
    			add_location(div0, file$z, 53, 2, 1370);
    			attr_dev(div1, "class", div1_class_value = "t3 " + q$2(/*ns*/ ctx[1]) + " svelte-je1upl");
    			add_location(div1, file$z, 65, 2, 1762);
    			attr_dev(div2, "class", "border svelte-je1upl");
    			add_location(div2, file$z, 52, 0, 1346);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(collapse, div0, null);
    			append_dev(div0, t0);
    			mount_component(expand, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			if_block.m(span, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const collapse_changes = {};
    			if (dirty & /*ns*/ 2) collapse_changes.q = `.t3.${q$2(/*ns*/ ctx[1])}`;
    			collapse.$set(collapse_changes);
    			const expand_changes = {};
    			if (dirty & /*ns*/ 2) expand_changes.q = `.t3.${q$2(/*ns*/ ctx[1])}`;
    			expand.$set(expand_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}

    			if (dirty & /*items, xitems, $tags, ns, xtags, btnExpand*/ 31) {
    				each_value = /*xitems*/ ctx[3](/*$tags*/ ctx[2]);
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
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*ns*/ 2 && div1_class_value !== (div1_class_value = "t3 " + q$2(/*ns*/ ctx[1]) + " svelte-je1upl")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapse.$$.fragment, local);
    			transition_in(expand.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapse.$$.fragment, local);
    			transition_out(expand.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(collapse);
    			destroy_component(expand);
    			if_block.d();
    			destroy_each(each_blocks, detaching);
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

    function q$2(key) {
    	return key.replace(/[@.]/g, "-");
    }

    function btnExpand(e) {
    	const node = e.target.parentElement;

    	setTimeout(
    		() => {
    			const exp = node.getAttribute("open");

    			if (exp !== null) {
    				const nodes = document.querySelectorAll(`#${node.id} details`);
    				nodes.forEach(node => node.setAttribute("open", ""));
    			}
    		},
    		0
    	);
    }

    function instance$J($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3_1", slots, []);
    	let { items } = $$props;
    	let { ns } = $$props;
    	let namespace;

    	function xitems(tags) {
    		const { __tag3 } = tags;
    		namespace = __tag3[ns];
    		const arr = Object.keys(namespace).sort();
    		return arr;
    	}

    	function xtags(path) {
    		const { rclass } = window.mitm.fn;
    		let secs = namespace[path];
    		let arr = Object.keys(secs).filter(x => x[0] !== ":");
    		let tag1 = {};

    		const klass = arr.map(x => {
    			const arr = Object.keys(secs[x]);

    			if (secs[x].tags) {
    				tag1 = { ...tag1, ...secs[x].tags };
    			}

    			return arr.map(x => x.split(":").pop().replace(rclass, "-")).join(" _");
    		});

    		tag1 = Object.keys(tag1);

    		tag1 = tag1.length
    		? `_${tag1.join(" _").replace(/url:/g, "").replace(rclass, "-")}`
    		: "";

    		return `${tag1} _${klass.join(" _")}`;
    	}

    	const writable_props = ["items", "ns"];

    	Object_1$c.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3_1> was created with unknown prop '${key}'`);
    	});

    	function message_handler(event) {
    		bubble($$self, event);
    	}

    	function message_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    	};

    	$$self.$capture_state = () => ({
    		tags,
    		Tags32: Tags3_2,
    		Expand,
    		Collapse,
    		items,
    		ns,
    		namespace,
    		q: q$2,
    		btnExpand,
    		xitems,
    		xtags,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("ns" in $$props) $$invalidate(1, ns = $$props.ns);
    		if ("namespace" in $$props) namespace = $$props.namespace;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, ns, $tags, xitems, xtags, message_handler, message_handler_1];
    }

    class Tags3_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$J, create_fragment$J, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_1",
    			options,
    			id: create_fragment$J.name
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

    /* src\components\tags\Tags3_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$d } = globals;
    const file$A = "src\\components\\tags\\Tags3_.svelte";

    function get_each_context$d(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (27:2) {#if istag(ns)}
    function create_if_block$d(ctx) {
    	let tags31;
    	let current;

    	tags31 = new Tags3_1({
    			props: {
    				items: /*$tags*/ ctx[2].__tag3[nspace$1(/*ns*/ ctx[5])],
    				ns: nspace$1(/*ns*/ ctx[5])
    			},
    			$$inline: true
    		});

    	tags31.$on("message", /*message_handler*/ ctx[4]);

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
    			if (dirty & /*$tags*/ 4) tags31_changes.items = /*$tags*/ ctx[2].__tag3[nspace$1(/*ns*/ ctx[5])];
    			if (dirty & /*$tags*/ 4) tags31_changes.ns = nspace$1(/*ns*/ ctx[5]);
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
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(27:2) {#if istag(ns)}",
    		ctx
    	});

    	return block;
    }

    // (26:0) {#each Object.keys($tags.__tag3) as ns}
    function create_each_block$d(ctx) {
    	let show_if = /*istag*/ ctx[3](/*ns*/ ctx[5]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$d(ctx);

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
    			if (dirty & /*$tags*/ 4) show_if = /*istag*/ ctx[3](/*ns*/ ctx[5]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$tags*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$d(ctx);
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
    		id: create_each_block$d.name,
    		type: "each",
    		source: "(26:0) {#each Object.keys($tags.__tag3) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$K(ctx) {
    	let td;
    	let td_style_value;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[2].__tag3);
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
    			td = element("td");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(td, "style", td_style_value = "width:" + (/*_resize*/ ctx[1] === "[<<]" ? 35 : 45) + "%; " + (/*cols*/ ctx[0] === 3 ? "" : "display:none;"));
    			add_location(td, file$A, 24, 0, 665);
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
    			if (dirty & /*$tags, nspace, Object, istag*/ 12) {
    				each_value = Object.keys(/*$tags*/ ctx[2].__tag3);
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
    						each_blocks[i].m(td, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*_resize, cols*/ 3 && td_style_value !== (td_style_value = "width:" + (/*_resize*/ ctx[1] === "[<<]" ? 35 : 45) + "%; " + (/*cols*/ ctx[0] === 3 ? "" : "display:none;"))) {
    				attr_dev(td, "style", td_style_value);
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
    		id: create_fragment$K.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function nspace$1(ns) {
    	const { _subns } = window.mitm.routes[ns]._childns;
    	return _subns || ns; // feat: chg to child namespace
    }

    function instance$K($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3", slots, []);
    	let { cols } = $$props;
    	let { _resize } = $$props;

    	function istag(ns) {
    		const { toRegex } = window.mitm.fn;
    		const arr = Object.keys($tags.__tag2[ns]);
    		let ok = arr.filter(x => x.match("url:") || !x.match(":")).length;

    		if (ns.match("@")) {
    			ok = false;
    		} else if ($tags.filterUrl) {
    			const rgx = toRegex(ns.replace(/~/, "[^.]*"));
    			ok = ok && mitm.browser.activeUrl.match(rgx) || ns === "_global_";
    		}

    		return ok;
    	}

    	const writable_props = ["cols", "_resize"];

    	Object_1$d.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags3> was created with unknown prop '${key}'`);
    	});

    	function message_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    		if ("_resize" in $$props) $$invalidate(1, _resize = $$props._resize);
    	};

    	$$self.$capture_state = () => ({
    		cols,
    		_resize,
    		tags,
    		Tags31: Tags3_1,
    		istag,
    		nspace: nspace$1,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("cols" in $$props) $$invalidate(0, cols = $$props.cols);
    		if ("_resize" in $$props) $$invalidate(1, _resize = $$props._resize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cols, _resize, $tags, istag, message_handler];
    }

    class Tags3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$K, create_fragment$K, safe_not_equal, { cols: 0, _resize: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3",
    			options,
    			id: create_fragment$K.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cols*/ ctx[0] === undefined && !("cols" in props)) {
    			console.warn("<Tags3> was created without expected prop 'cols'");
    		}

    		if (/*_resize*/ ctx[1] === undefined && !("_resize" in props)) {
    			console.warn("<Tags3> was created without expected prop '_resize'");
    		}
    	}

    	get cols() {
    		throw new Error("<Tags3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Tags3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _resize() {
    		throw new Error("<Tags3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _resize(value) {
    		throw new Error("<Tags3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Title-1.svelte generated by Svelte v3.29.7 */

    function create_fragment$L(ctx) {
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			t = text("URLs\r\n");
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
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
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("Title_1", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title_1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Title_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$L, create_fragment$L, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_1",
    			options,
    			id: create_fragment$L.name
    		});
    	}
    }

    /* src\components\tags\Title-2.svelte generated by Svelte v3.29.7 */

    function create_fragment$M(ctx) {
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			t = text("Flag &  Args\r\n");
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
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
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$M($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title_2", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title_2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Title_2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$M, create_fragment$M, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_2",
    			options,
    			id: create_fragment$M.name
    		});
    	}
    }

    /* src\components\tags\Url-style.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$e } = globals;
    const file$B = "src\\components\\tags\\Url-style.svelte";

    function create_fragment$N(ctx) {
    	let span;
    	let raw_value = /*hideBtn*/ ctx[1](/*btn*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$B, 23, 0, 616);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			span.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*btn*/ 1 && raw_value !== (raw_value = /*hideBtn*/ ctx[1](/*btn*/ ctx[0]) + "")) span.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
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

    function instance$N($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Url_style", slots, []);
    	let { btn = {} } = $$props;
    	let { _id = "" } = $$props;

    	function hideBtn(b) {
    		let arr = Object.keys(b).filter(x => !b[x]);

    		const hide = arr.map(x => {
    			if (x.slice(0, 1) === "_" || x === "dev") {
    				return `.${_id}>li>.${x}`;
    			} else if (x === "def") {
    				return `.${_id}>li>._notag`;
    			} else {
    				return `.${_id} li.${x} div`;
    			}
    		});

    		const s1 = `${hide.join(",")} {display: none;}`;

    		const b2 = b.def
    		? `.${_id}>li>._notag {display: block !important;}`
    		: "";

    		const content = `<style>${s1}\n${b2}<style>`;
    		return content;
    	}

    	const writable_props = ["btn", "_id"];

    	Object_1$e.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Url_style> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("btn" in $$props) $$invalidate(0, btn = $$props.btn);
    		if ("_id" in $$props) $$invalidate(2, _id = $$props._id);
    	};

    	$$self.$capture_state = () => ({ btn, _id, hideBtn });

    	$$self.$inject_state = $$props => {
    		if ("btn" in $$props) $$invalidate(0, btn = $$props.btn);
    		if ("_id" in $$props) $$invalidate(2, _id = $$props._id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [btn, hideBtn, _id];
    }

    class Url_style extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$N, create_fragment$N, safe_not_equal, { btn: 0, _id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Url_style",
    			options,
    			id: create_fragment$N.name
    		});
    	}

    	get btn() {
    		throw new Error("<Url_style>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set btn(value) {
    		throw new Error("<Url_style>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _id() {
    		throw new Error("<Url_style>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _id(value) {
    		throw new Error("<Url_style>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Title-btn.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$f } = globals;
    const file$C = "src\\components\\tags\\Title-btn.svelte";

    function get_each_context$e(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[10] = list;
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (27:2) {#if arr.length>1}
    function create_if_block$e(ctx) {
    	let label;
    	let input;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = text("\r\n      all");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$C, 28, 6, 455);
    			attr_dev(label, "class", "checker");
    			add_location(label, file$C, 27, 4, 424);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*all*/ ctx[3];
    			append_dev(label, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*allcheck*/ ctx[5], false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*all*/ 8) {
    				input.checked = /*all*/ ctx[3];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(27:2) {#if arr.length>1}",
    		ctx
    	});

    	return block;
    }

    // (36:2) {#each arr as item}
    function create_each_block$e(ctx) {
    	let label;
    	let input;
    	let t0;
    	let t1_value = /*item*/ ctx[9] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_change_handler_1() {
    		/*input_change_handler_1*/ ctx[8].call(input, /*item*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$C, 37, 6, 635);
    			attr_dev(label, "class", "checker");
    			add_location(label, file$C, 36, 4, 604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*btn*/ ctx[0][/*item*/ ctx[9]];
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler_1);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*btn, arr*/ 17) {
    				input.checked = /*btn*/ ctx[0][/*item*/ ctx[9]];
    			}

    			if (dirty & /*arr*/ 16 && t1_value !== (t1_value = /*item*/ ctx[9] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$e.name,
    		type: "each",
    		source: "(36:2) {#each arr as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$O(ctx) {
    	let t0_value = /*itemArray*/ ctx[6](/*items*/ ctx[1]) + "";
    	let t0;
    	let t1;
    	let div;
    	let t2;
    	let t3;
    	let urlstyle;
    	let current;
    	let if_block = /*arr*/ ctx[4].length > 1 && create_if_block$e(ctx);
    	let each_value = /*arr*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$e(get_each_context$e(ctx, each_value, i));
    	}

    	urlstyle = new Url_style({
    			props: { _id: /*_id*/ ctx[2], btn: /*btn*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			create_component(urlstyle.$$.fragment);
    			attr_dev(div, "class", "btn-container svelte-2ujof1");
    			add_location(div, file$C, 25, 0, 369);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t3, anchor);
    			mount_component(urlstyle, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*items*/ 2) && t0_value !== (t0_value = /*itemArray*/ ctx[6](/*items*/ ctx[1]) + "")) set_data_dev(t0, t0_value);

    			if (/*arr*/ ctx[4].length > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$e(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*arr, btn*/ 17) {
    				each_value = /*arr*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$e(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$e(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const urlstyle_changes = {};
    			if (dirty & /*_id*/ 4) urlstyle_changes._id = /*_id*/ ctx[2];
    			if (dirty & /*btn*/ 1) urlstyle_changes.btn = /*btn*/ ctx[0];
    			urlstyle.$set(urlstyle_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(urlstyle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(urlstyle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(urlstyle, detaching);
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
    	validate_slots("Title_btn", slots, []);
    	let { items = {} } = $$props;
    	let { btn = {} } = $$props;
    	let { _id = "" } = $$props;
    	let all = true;
    	let arr = [];

    	function allcheck() {
    		setTimeout(
    			() => {
    				for (const id in btn) {
    					$$invalidate(0, btn[id] = all, btn);
    				}
    			},
    			1
    		);
    	}

    	function itemArray(i) {
    		$$invalidate(4, arr = Object.keys(i));
    		return "";
    	}

    	const writable_props = ["items", "btn", "_id"];

    	Object_1$f.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title_btn> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		all = this.checked;
    		$$invalidate(3, all);
    	}

    	function input_change_handler_1(item) {
    		btn[item] = this.checked;
    		$$invalidate(0, btn);
    		$$invalidate(4, arr);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("btn" in $$props) $$invalidate(0, btn = $$props.btn);
    		if ("_id" in $$props) $$invalidate(2, _id = $$props._id);
    	};

    	$$self.$capture_state = () => ({
    		UrlStyle: Url_style,
    		items,
    		btn,
    		_id,
    		all,
    		arr,
    		allcheck,
    		itemArray
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("btn" in $$props) $$invalidate(0, btn = $$props.btn);
    		if ("_id" in $$props) $$invalidate(2, _id = $$props._id);
    		if ("all" in $$props) $$invalidate(3, all = $$props.all);
    		if ("arr" in $$props) $$invalidate(4, arr = $$props.arr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		btn,
    		items,
    		_id,
    		all,
    		arr,
    		allcheck,
    		itemArray,
    		input_change_handler,
    		input_change_handler_1
    	];
    }

    class Title_btn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$O, create_fragment$O, safe_not_equal, { items: 1, btn: 0, _id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_btn",
    			options,
    			id: create_fragment$O.name
    		});
    	}

    	get items() {
    		throw new Error("<Title_btn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Title_btn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get btn() {
    		throw new Error("<Title_btn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set btn(value) {
    		throw new Error("<Title_btn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _id() {
    		throw new Error("<Title_btn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _id(value) {
    		throw new Error("<Title_btn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Title-url.svelte generated by Svelte v3.29.7 */

    const file$D = "src\\components\\tags\\Title-url.svelte";

    function create_fragment$P(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*item*/ ctx[0].url + "";
    	let t1;
    	let t2;
    	let span0;
    	let t3_value = `{${/*list*/ ctx[1](/*item*/ ctx[0].secs)}}` + "";
    	let t3;
    	let span0_class_value;
    	let t4;
    	let span1;

    	let t5_value = (/*item*/ ctx[0].ctyp
    	? `[${/*list*/ ctx[1](/*item*/ ctx[0].secs, ",")}]`
    	: "") + "";

    	let t5;
    	let span1_class_value;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("* ");
    			t1 = text(t1_value);
    			t2 = space();
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			attr_dev(span0, "class", span0_class_value = "secs " + /*list*/ ctx[1](/*item*/ ctx[0].secs) + " svelte-1ayz7zb");
    			add_location(span0, file$D, 8, 2, 172);
    			attr_dev(span1, "class", span1_class_value = "ctyp " + /*list*/ ctx[1](/*item*/ ctx[0].ctyp) + " svelte-1ayz7zb");
    			add_location(span1, file$D, 9, 2, 244);
    			attr_dev(div, "class", div_class_value = "url " + (/*item*/ ctx[0].tags && /*item*/ ctx[0].tags.join(" ")) + " svelte-1ayz7zb");
    			add_location(div, file$D, 6, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, span0);
    			append_dev(span0, t3);
    			append_dev(div, t4);
    			append_dev(div, span1);
    			append_dev(span1, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].url + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*item*/ 1 && t3_value !== (t3_value = `{${/*list*/ ctx[1](/*item*/ ctx[0].secs)}}` + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "secs " + /*list*/ ctx[1](/*item*/ ctx[0].secs) + " svelte-1ayz7zb")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t5_value !== (t5_value = (/*item*/ ctx[0].ctyp
    			? `[${/*list*/ ctx[1](/*item*/ ctx[0].secs, ",")}]`
    			: "") + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "ctyp " + /*list*/ ctx[1](/*item*/ ctx[0].ctyp) + " svelte-1ayz7zb")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_class_value !== (div_class_value = "url " + (/*item*/ ctx[0].tags && /*item*/ ctx[0].tags.join(" ")) + " svelte-1ayz7zb")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$P($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title_url", slots, []);
    	let { item } = $$props;
    	const list = (itm, gap = " ") => itm ? itm.join(gap) : "";
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title_url> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ item, list });

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, list];
    }

    class Title_url extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$P, create_fragment$P, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_url",
    			options,
    			id: create_fragment$P.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Title_url> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Title_url>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Title_url>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Urls.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$g, console: console_1$j } = globals;
    const file$E = "src\\components\\tags\\Urls.svelte";

    function get_each_context$f(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (214:8) <Title1>
    function create_default_slot_1$2(ctx) {
    	let titlebtn;
    	let current;

    	titlebtn = new Title_btn({
    			props: {
    				_id: "urls",
    				items: /*title1*/ ctx[2],
    				btn: /*btn1*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(titlebtn.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebtn, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const titlebtn_changes = {};
    			if (dirty & /*title1*/ 4) titlebtn_changes.items = /*title1*/ ctx[2];
    			titlebtn.$set(titlebtn_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebtn.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebtn.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebtn, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(214:8) <Title1>",
    		ctx
    	});

    	return block;
    }

    // (215:8) <Title2>
    function create_default_slot$a(ctx) {
    	let titlebtn;
    	let current;

    	titlebtn = new Title_btn({
    			props: {
    				_id: "farg",
    				items: /*title2*/ ctx[3],
    				btn: /*btn2*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(titlebtn.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebtn, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const titlebtn_changes = {};
    			if (dirty & /*title2*/ 8) titlebtn_changes.items = /*title2*/ ctx[3];
    			titlebtn.$set(titlebtn_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebtn.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebtn.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebtn, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(215:8) <Title2>",
    		ctx
    	});

    	return block;
    }

    // (221:8) {#each _urls as item}
    function create_each_block_1$3(ctx) {
    	let li;
    	let titleurl;
    	let li_class_value;
    	let current;

    	titleurl = new Title_url({
    			props: { item: /*item*/ ctx[10] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(titleurl.$$.fragment);
    			attr_dev(li, "class", li_class_value = /*item*/ ctx[10].secs.join(" "));
    			add_location(li, file$E, 221, 8, 6198);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(titleurl, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const titleurl_changes = {};
    			if (dirty & /*_urls*/ 1) titleurl_changes.item = /*item*/ ctx[10];
    			titleurl.$set(titleurl_changes);

    			if (!current || dirty & /*_urls*/ 1 && li_class_value !== (li_class_value = /*item*/ ctx[10].secs.join(" "))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titleurl.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titleurl.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(titleurl);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(221:8) {#each _urls as item}",
    		ctx
    	});

    	return block;
    }

    // (229:8) {#each _cfgs as item}
    function create_each_block$f(ctx) {
    	let li;
    	let titleurl;
    	let li_class_value;
    	let current;

    	titleurl = new Title_url({
    			props: { item: /*item*/ ctx[10] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(titleurl.$$.fragment);
    			attr_dev(li, "class", li_class_value = /*item*/ ctx[10].secs.join(" "));
    			add_location(li, file$E, 229, 8, 6411);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(titleurl, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const titleurl_changes = {};
    			if (dirty & /*_cfgs*/ 2) titleurl_changes.item = /*item*/ ctx[10];
    			titleurl.$set(titleurl_changes);

    			if (!current || dirty & /*_cfgs*/ 2 && li_class_value !== (li_class_value = /*item*/ ctx[10].secs.join(" "))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titleurl.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titleurl.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(titleurl);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$f.name,
    		type: "each",
    		source: "(229:8) {#each _cfgs as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$Q(ctx) {
    	let t0_value = /*itemlist*/ ctx[8](/*$tags*/ ctx[4], /*$rerender*/ ctx[5]) + "";
    	let t0;
    	let t1;
    	let table;
    	let tr0;
    	let th0;
    	let title1_1;
    	let t2;
    	let th1;
    	let title2_1;
    	let t3;
    	let tr1;
    	let td0;
    	let style0;
    	let t4;
    	let ul0;
    	let t5;
    	let td1;
    	let style1;
    	let t6;
    	let ul1;
    	let current;

    	title1_1 = new Title_1({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	title2_1 = new Title_2({
    			props: {
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_1 = /*_urls*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*_cfgs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$f(get_each_context$f(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			create_component(title1_1.$$.fragment);
    			t2 = space();
    			th1 = element("th");
    			create_component(title2_1.$$.fragment);
    			t3 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			style0 = element("style");
    			t4 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			td1 = element("td");
    			style1 = element("style");
    			t6 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "svelte-4mez2m");
    			add_location(th0, file$E, 213, 4, 5918);
    			attr_dev(th1, "class", "svelte-4mez2m");
    			add_location(th1, file$E, 214, 4, 5998);
    			add_location(tr0, file$E, 212, 2, 5908);
    			attr_dev(style0, "id", "urls");
    			add_location(style0, file$E, 218, 6, 6107);
    			attr_dev(ul0, "class", "urls");
    			add_location(ul0, file$E, 219, 6, 6140);
    			attr_dev(td0, "class", "svelte-4mez2m");
    			add_location(td0, file$E, 217, 4, 6095);
    			attr_dev(style1, "id", "farg");
    			add_location(style1, file$E, 226, 6, 6320);
    			attr_dev(ul1, "class", "farg");
    			add_location(ul1, file$E, 227, 6, 6353);
    			attr_dev(td1, "class", "svelte-4mez2m");
    			add_location(td1, file$E, 225, 4, 6308);
    			add_location(tr1, file$E, 216, 2, 6085);
    			attr_dev(table, "class", "svelte-4mez2m");
    			add_location(table, file$E, 211, 0, 5897);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			mount_component(title1_1, th0, null);
    			append_dev(tr0, t2);
    			append_dev(tr0, th1);
    			mount_component(title2_1, th1, null);
    			append_dev(table, t3);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, style0);
    			append_dev(td0, t4);
    			append_dev(td0, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(tr1, t5);
    			append_dev(tr1, td1);
    			append_dev(td1, style1);
    			append_dev(td1, t6);
    			append_dev(td1, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$tags, $rerender*/ 48) && t0_value !== (t0_value = /*itemlist*/ ctx[8](/*$tags*/ ctx[4], /*$rerender*/ ctx[5]) + "")) set_data_dev(t0, t0_value);
    			const title1_1_changes = {};

    			if (dirty & /*$$scope, title1*/ 32772) {
    				title1_1_changes.$$scope = { dirty, ctx };
    			}

    			title1_1.$set(title1_1_changes);
    			const title2_1_changes = {};

    			if (dirty & /*$$scope, title2*/ 32776) {
    				title2_1_changes.$$scope = { dirty, ctx };
    			}

    			title2_1.$set(title2_1_changes);

    			if (dirty & /*_urls*/ 1) {
    				each_value_1 = /*_urls*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$3(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*_cfgs*/ 2) {
    				each_value = /*_cfgs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$f(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$f(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title1_1.$$.fragment, local);
    			transition_in(title2_1.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title1_1.$$.fragment, local);
    			transition_out(title2_1.$$.fragment, local);
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			destroy_component(title1_1);
    			destroy_component(title2_1);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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
    	let $tags;
    	let $rerender;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(4, $tags = $$value));
    	validate_store(rerender, "rerender");
    	component_subscribe($$self, rerender, $$value => $$invalidate(5, $rerender = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Urls", slots, []);
    	const replace = (s, p1, p2, p3) => p3;

    	let btn1 = {
    		response: true,
    		request: true,
    		cache: true,
    		mock: true,
    		html: true,
    		json: true,
    		css: true,
    		js: true,
    		log: true,
    		def: true
    	};

    	let btn2 = { flag: true, args: true, def: true };
    	let _urls, _cfgs, title1, title2;

    	function itemlist(tagsStore, rerender) {
    		console.log("rerender...");
    		const { __tag1, __tag2, __tag3, __urls, routes, fn } = window.mitm;
    		const { rmethod, noTagInRule, isRuleOff, oneSite } = fn;
    		let urls = {};
    		let url2 = {};
    		let url3 = {};

    		function addUrl2(sec, path, tags) {
    			const { rclass } = window.mitm.fn;
    			path = path.replace(rmethod, replace);
    			sec = sec.split(":")[0];

    			if (url2[path] === undefined) {
    				url2[path] = {};
    			}

    			if (url2[path][sec] === undefined) {
    				url2[path][sec] = {};
    			}

    			url2[path][sec] = true;

    			if (tags && Array.isArray(tags)) {
    				for (let tag of tags) {
    					tag = "_" + tag.split(":").pop().replace(rclass, "-"); // feat: tags in url

    					if (url3[path] === undefined) {
    						url3[path] = {};
    					}

    					if (url3[path][tag] === undefined) {
    						url3[path][tag] = {};
    					}

    					url3[path][tag] = true;
    				}
    			}
    		}

    		function addUrls(path) {
    			path = path.replace(rmethod, replace);
    			urls[path] = true;
    			return path;
    		}

    		for (let ns in __tag2) {
    			if (oneSite(tagsStore, ns)) {
    				ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    				const secs = __tag2[ns];

    				for (let sec in secs) {
    					const tag2 = secs[sec];

    					if (tag2.state && !sec.match(/(flag|args):/)) {
    						if (sec.match("url:")) {
    							const paths = __tag3[ns];

    							for (const path in paths) {
    								if (!isRuleOff(window.mitm, ns, path)) {
    									const _path = addUrls(path);

    									for (const sec in paths[path]) {
    										const tags = paths[path][sec].tags; // tags3

    										if (sec.slice(0, 1) !== ":") {
    											addUrl2(sec, _path, Object.keys(tags));
    											break;
    										}
    									}
    								}
    							}
    						} else if (sec.match(":")) {
    							let skip = false;
    							const tags = tag2.tags || [];

    							for (const tag of tags) {
    								if (__tag1[ns][tag] === false) {
    									skip = true;
    									break;
    								}
    							}

    							if (skip) {
    								continue;
    							}

    							if (tags.length) {
    								sec = `${sec} ${tags.join(" ")}`;
    							}

    							const tag = sec.split(":")[1];
    							let arr = routes[ns][sec];

    							if (!Array.isArray(arr)) {
    								for (const url in arr) {
    									const path = noTagInRule(url);

    									if (!isRuleOff(window.mitm, ns, path)) {
    										const _path = addUrls(url);
    										addUrl2(sec, _path, [tag]);
    									}
    								}
    							} else {
    								for (const url of arr) {
    									const path = noTagInRule(url);

    									if (!isRuleOff(window.mitm, ns, path)) {
    										const _path = addUrls(url);
    										addUrl2(sec, _path, [tag]);
    									}
    								}
    							}
    						}
    					}
    				}
    			}
    		}

    		for (let ns in __tag3) {
    			if (oneSite(tagsStore, ns)) {
    				ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    				const paths = __tag3[ns];

    				for (const path in paths) {
    					if (!isRuleOff(window.mitm, ns, path)) {
    						const _path = addUrls(path);
    						const secs = paths[path];

    						for (const sec in secs) {
    							const tags = secs[sec].tags; // tags3

    							if (sec.slice(0, 1) !== ":") {
    								addUrl2(sec, _path, Object.keys(tags));
    							}
    						}
    					}
    				}
    			}
    		}

    		for (let ns in __urls) {
    			if (oneSite(tagsStore, ns)) {
    				ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    				const _urls = __urls[ns] || [];

    				for (const url in _urls) {
    					const { pure, secs, tags } = _urls[url];

    					if (pure) {
    						for (const sec in secs) {
    							const _path = addUrls(url);
    							addUrl2(sec, _path, tags);
    						}
    					}
    				}
    			}
    		}

    		let arr = Object.keys(urls).sort();
    		const urls2 = [];
    		const urls3 = [];

    		for (const url of arr) {
    			const secs = Object.keys(url2[url]);
    			const tags = Object.keys(url3[url]);
    			let ctyp = [];

    			for (let ns in __urls) {
    				if (oneSite(tagsStore, ns)) {
    					ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
    					const _urls = __urls[ns] || [];

    					for (const _url in _urls) {
    						if (url === _url) {
    							ctyp = _urls[_url].ctyp;
    							break;
    						}
    					}
    				}
    			}

    			!ctyp.length && (ctyp = false);

    			if (secs.find(x => (/^(args|flag)/).test(x))) {
    				urls3.push({ url, secs, ctyp, tags });
    			} else {
    				urls2.push({ url, secs, ctyp, tags });
    			}
    		}

    		$$invalidate(2, title1 = {});
    		$$invalidate(3, title2 = {});
    		$$invalidate(0, _urls = urls2);
    		$$invalidate(1, _cfgs = urls3);

    		for (const item of _urls) {
    			if (item.tags.indexOf("_notag")) {
    				$$invalidate(2, title1.def = true, title1);
    			}

    			for (const sec of item.secs) {
    				$$invalidate(2, title1[sec] = true, title1);
    			}
    		}

    		for (const item of _cfgs) {
    			if (item.tags.indexOf("_notag")) {
    				$$invalidate(3, title2.def = true, title2);
    			}

    			for (const sec of item.secs) {
    				$$invalidate(3, title2[sec] = true, title2);
    			}
    		}

    		return "";
    	}

    	const writable_props = [];

    	Object_1$g.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$j.warn(`<Urls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		rerender,
    		tags,
    		Title1: Title_1,
    		Title2: Title_2,
    		TitleBtn: Title_btn,
    		TitleUrl: Title_url,
    		replace,
    		btn1,
    		btn2,
    		_urls,
    		_cfgs,
    		title1,
    		title2,
    		itemlist,
    		$tags,
    		$rerender
    	});

    	$$self.$inject_state = $$props => {
    		if ("btn1" in $$props) $$invalidate(6, btn1 = $$props.btn1);
    		if ("btn2" in $$props) $$invalidate(7, btn2 = $$props.btn2);
    		if ("_urls" in $$props) $$invalidate(0, _urls = $$props._urls);
    		if ("_cfgs" in $$props) $$invalidate(1, _cfgs = $$props._cfgs);
    		if ("title1" in $$props) $$invalidate(2, title1 = $$props.title1);
    		if ("title2" in $$props) $$invalidate(3, title2 = $$props.title2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [_urls, _cfgs, title1, title2, $tags, $rerender, btn1, btn2, itemlist];
    }

    class Urls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$Q, create_fragment$Q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Urls",
    			options,
    			id: create_fragment$Q.name
    		});
    	}
    }

    /* src\components\tags\Content.svelte generated by Svelte v3.29.7 */

    const { console: console_1$k } = globals;
    const file$F = "src\\components\\tags\\Content.svelte";

    // (75:8) <BHeader {left}>
    function create_default_slot_2$2(ctx) {
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let t6;
    	let chevron;
    	let current;
    	let mounted;
    	let dispose;
    	chevron = new Chevron({ $$inline: true });

    	const block_1 = {
    		c: function create() {
    			t0 = text("-Tags-\r\n          ");
    			button0 = element("button");
    			button0.textContent = "[full]";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "[two]";
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = "[one]";
    			t6 = space();
    			create_component(chevron.$$.fragment);
    			attr_dev(button0, "data-_cols", "3");
    			attr_dev(button0, "class", "svelte-q2ydjm");
    			add_location(button0, file$F, 75, 10, 2003);
    			attr_dev(button1, "data-_cols", "2");
    			attr_dev(button1, "class", "svelte-q2ydjm");
    			add_location(button1, file$F, 76, 10, 2073);
    			attr_dev(button2, "data-_cols", "1");
    			attr_dev(button2, "class", "svelte-q2ydjm");
    			add_location(button2, file$F, 77, 10, 2142);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(chevron, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*oneClick*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*oneClick*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*oneClick*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chevron.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chevron.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t6);
    			destroy_component(chevron, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(75:8) <BHeader {left}>",
    		ctx
    	});

    	return block_1;
    }

    // (81:8) <BTable>
    function create_default_slot_1$3(ctx) {
    	let tr;
    	let tags1;
    	let t0;
    	let tags2;
    	let t1;
    	let tags3;
    	let current;

    	tags1 = new Tags1({
    			props: { cols: /*cols*/ ctx[2] },
    			$$inline: true
    		});

    	tags2 = new Tags2({
    			props: { cols: /*cols*/ ctx[2] },
    			$$inline: true
    		});

    	tags2.$on("message", /*handleMessage*/ ctx[5]);

    	tags3 = new Tags3({
    			props: { cols: /*cols*/ ctx[2] },
    			$$inline: true
    		});

    	tags3.$on("message", /*handleMessage*/ ctx[5]);

    	const block_1 = {
    		c: function create() {
    			tr = element("tr");
    			create_component(tags1.$$.fragment);
    			t0 = space();
    			create_component(tags2.$$.fragment);
    			t1 = space();
    			create_component(tags3.$$.fragment);
    			attr_dev(tr, "class", "set-tags");
    			add_location(tr, file$F, 81, 10, 2271);
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
    		p: function update(ctx, dirty) {
    			const tags1_changes = {};
    			if (dirty & /*cols*/ 4) tags1_changes.cols = /*cols*/ ctx[2];
    			tags1.$set(tags1_changes);
    			const tags2_changes = {};
    			if (dirty & /*cols*/ 4) tags2_changes.cols = /*cols*/ ctx[2];
    			tags2.$set(tags2_changes);
    			const tags3_changes = {};
    			if (dirty & /*cols*/ 4) tags3_changes.cols = /*cols*/ ctx[2];
    			tags3.$set(tags3_changes);
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
    		block: block_1,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(81:8) <BTable>",
    		ctx
    	});

    	return block_1;
    }

    // (74:6) <BStatic {top} {block}>
    function create_default_slot$b(ctx) {
    	let bheader;
    	let t;
    	let btable;
    	let current;

    	bheader = new BHeader({
    			props: {
    				left: /*left*/ ctx[1],
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	btable = new BTable({
    			props: {
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block_1 = {
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
    			if (dirty & /*left*/ 2) bheader_changes.left = /*left*/ ctx[1];

    			if (dirty & /*$$scope*/ 128) {
    				bheader_changes.$$scope = { dirty, ctx };
    			}

    			bheader.$set(bheader_changes);
    			const btable_changes = {};

    			if (dirty & /*$$scope, cols*/ 132) {
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
    		block: block_1,
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(74:6) <BStatic {top} {block}>",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$R(ctx) {
    	let div1;
    	let details0;
    	let summary0;
    	let t1;
    	let div0;
    	let bstatic;
    	let t2;
    	let details1;
    	let html_tag;
    	let raw_value = "<style id=\"urls\"></style>" + "";
    	let t3;
    	let summary1;
    	let t5;
    	let urls;
    	let current;

    	bstatic = new BStatic({
    			props: {
    				top: /*top*/ ctx[0],
    				block: /*block*/ ctx[3],
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	urls = new Urls({ $$inline: true });

    	const block_1 = {
    		c: function create() {
    			div1 = element("div");
    			details0 = element("details");
    			summary0 = element("summary");
    			summary0.textContent = "Enable / Disable Tags";
    			t1 = space();
    			div0 = element("div");
    			create_component(bstatic.$$.fragment);
    			t2 = space();
    			details1 = element("details");
    			t3 = space();
    			summary1 = element("summary");
    			summary1.textContent = "Effected Url(s)";
    			t5 = space();
    			create_component(urls.$$.fragment);
    			attr_dev(summary0, "class", "svelte-q2ydjm");
    			add_location(summary0, file$F, 71, 4, 1862);
    			attr_dev(div0, "class", "vbox-1 svelte-q2ydjm");
    			add_location(div0, file$F, 72, 4, 1908);
    			details0.open = "true";
    			attr_dev(details0, "class", "svelte-q2ydjm");
    			add_location(details0, file$F, 70, 2, 1835);
    			html_tag = new HtmlTag(t3);
    			attr_dev(summary1, "class", "svelte-q2ydjm");
    			add_location(summary1, file$F, 92, 4, 2588);
    			attr_dev(details1, "class", "urls svelte-q2ydjm");
    			add_location(details1, file$F, 90, 2, 2519);
    			attr_dev(div1, "class", "vbox svelte-q2ydjm");
    			add_location(div1, file$F, 69, 0, 1813);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, details0);
    			append_dev(details0, summary0);
    			append_dev(details0, t1);
    			append_dev(details0, div0);
    			mount_component(bstatic, div0, null);
    			append_dev(div1, t2);
    			append_dev(div1, details1);
    			html_tag.m(raw_value, details1);
    			append_dev(details1, t3);
    			append_dev(details1, summary1);
    			append_dev(details1, t5);
    			mount_component(urls, details1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const bstatic_changes = {};
    			if (dirty & /*top*/ 1) bstatic_changes.top = /*top*/ ctx[0];

    			if (dirty & /*$$scope, cols, left*/ 134) {
    				bstatic_changes.$$scope = { dirty, ctx };
    			}

    			bstatic.$set(bstatic_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bstatic.$$.fragment, local);
    			transition_in(urls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bstatic.$$.fragment, local);
    			transition_out(urls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(bstatic);
    			destroy_component(urls);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$R.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$R($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(6, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Content", slots, []);
    	let { top = "23" } = $$props;
    	let { left } = $$props;
    	let block = true;
    	let cols = 3;

    	onMount(async () => {
    		console.warn("onMount tags/index");
    	});

    	window.mitm.files.getRoute_events.tagsTable = () => {
    		// window.ws__send('getRoute', '', routeHandler);
    		console.log("events.tagsTable...");

    		const { __tag1, __tag2, __tag3 } = window.mitm;
    		const { filterUrl, uniq } = $tags;
    		const tgroup = {};

    		for (let ns in __tag2) {
    			const tsks = __tag2[ns];

    			for (let task in tsks) {
    				const [k, v] = task.split(":");

    				if (v && k !== "url") {
    					tgroup[v] = true;
    				}
    			}
    		}

    		tags.set({
    			filterUrl,
    			__tag1,
    			__tag2,
    			__tag3,
    			tgroup,
    			uniq
    		});
    	};

    	function oneClick(e) {
    		const { _cols } = e.target.dataset;
    		$$invalidate(2, cols = +_cols);
    	}

    	function handleMessage(event) {
    		const { all, name } = event.detail;
    		let q;

    		if (name === "state2") {
    			all.chevron = all.state2 ? "[<<]" : "[<<]";
    			all.state3 = {}; // feat: auto collapsed between tag2 & tag3
    			q = ".t3";
    		} else if (name === "state3") {
    			all.chevron = !all.state3 ? "[>>]" : "[>>]";
    			all.state2 = {}; // feat: auto collapsed between tag2 & tag3
    			q = ".t2";
    		}

    		const nodes = document.querySelectorAll(`${q} details[open]`);
    		nodes.forEach(node => node.removeAttribute("open"));
    		states.set(all);
    	}

    	const writable_props = ["top", "left"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$k.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("top" in $$props) $$invalidate(0, top = $$props.top);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tags,
    		states,
    		Chevron,
    		BStatic,
    		BHeader,
    		BTable,
    		Tags1,
    		Tags2,
    		Tags3,
    		Urls,
    		top,
    		left,
    		block,
    		cols,
    		oneClick,
    		handleMessage,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("top" in $$props) $$invalidate(0, top = $$props.top);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("block" in $$props) $$invalidate(3, block = $$props.block);
    		if ("cols" in $$props) $$invalidate(2, cols = $$props.cols);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [top, left, cols, block, oneClick, handleMessage];
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$R, create_fragment$R, safe_not_equal, { top: 0, left: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$R.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*left*/ ctx[1] === undefined && !("left" in props)) {
    			console_1$k.warn("<Content> was created without expected prop 'left'");
    		}
    	}

    	get top() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Item.svelte generated by Svelte v3.29.7 */

    const file$G = "src\\components\\tags\\Item.svelte";

    function create_fragment$S(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[0].title + "";
    	let t;
    	let div_class_value;
    	let div_data_item_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-rqs7oq");
    			attr_dev(div, "data-item", div_data_item_value = /*item*/ ctx[0].element);
    			add_location(div, file$G, 11, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", clickHandler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*$source, item*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*$source*/ ctx[1].fpath === /*item*/ ctx[0].fpath) + " svelte-rqs7oq")) {
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
    		id: create_fragment$S.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function clickHandler(e) {
    	
    }

    function instance$S($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(1, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;
    	let { onChange } = $$props;
    	const writable_props = ["item", "onChange"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(2, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({ item, onChange, clickHandler, $source });

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("onChange" in $$props) $$invalidate(2, onChange = $$props.onChange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $source, onChange];
    }

    class Item$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$S, create_fragment$S, safe_not_equal, { item: 0, onChange: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$S.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Item> was created without expected prop 'item'");
    		}

    		if (/*onChange*/ ctx[2] === undefined && !("onChange" in props)) {
    			console.warn("<Item> was created without expected prop 'onChange'");
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

    /* src\components\tags\List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$h } = globals;

    function get_each_context$g(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (25:0) {#each Object.keys(_data) as item}
    function create_each_block$g(ctx) {
    	let item;
    	let current;

    	item = new Item$3({
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
    		id: create_each_block$g.name,
    		type: "each",
    		source: "(25:0) {#each Object.keys(_data) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$T(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$g(get_each_context$g(ctx, each_value, i));
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
    					const child_ctx = get_each_context$g(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$g(child_ctx);
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
    		id: create_fragment$T.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$T($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let { onChange } = $$props;
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		
    	});

    	const profileHandler = obj => {
    		
    	};

    	const writable_props = ["onChange"];

    	Object_1$h.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
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

    	 $$invalidate(1, _data = data);
    	return [onChange, _data];
    }

    class List$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$T, create_fragment$T, safe_not_equal, { onChange: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$T.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onChange*/ ctx[0] === undefined && !("onChange" in props)) {
    			console.warn("<List> was created without expected prop 'onChange'");
    		}
    	}

    	get onChange() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\tags\Index.svelte generated by Svelte v3.29.7 */

    // (33:0) {:else}
    function create_else_block$8(ctx) {
    	let content;
    	let current;
    	content = new Content({ props: { onChange }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(content.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$8.name,
    		type: "else",
    		source: "(33:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if $tags.list}
    function create_if_block$f(ctx) {
    	let vbox2;
    	let current;

    	vbox2 = new VBox2({
    			props: {
    				title: title$4,
    				top: top$3,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[2],
    				List: List$3,
    				props: { onChange },
    				$$slots: { default: [create_default_slot$c] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(vbox2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(vbox2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const vbox2_changes = {};
    			if (dirty & /*left*/ 1) vbox2_changes.left = /*left*/ ctx[0];

    			if (dirty & /*$$scope, left*/ 9) {
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
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(29:0) {#if $tags.list}",
    		ctx
    	});

    	return block;
    }

    // (30:2) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>
    function create_default_slot$c(ctx) {
    	let content;
    	let current;

    	content = new Content({
    			props: { left: /*left*/ ctx[0], onChange },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(content.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const content_changes = {};
    			if (dirty & /*left*/ 1) content_changes.left = /*left*/ ctx[0];
    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(30:2) <VBox2 {title} {top} {left} {dragend} {List} props={{onChange}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$U(ctx) {
    	let button;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	button = new Button$3({ $$inline: true });
    	const if_block_creators = [create_if_block$f, create_else_block$8];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$tags*/ ctx[1].list) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert_dev(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    			transition_in(button.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$U.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const top$3 = "47";
    const title$4 = "-List-";
    const id$3 = "routeLeft";

    function onChange(e) {
    	
    }

    function instance$U($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(1, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 165;

    	onMount(async () => {
    		
    	});

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		tags,
    		Button: Button$3,
    		VBox2,
    		Content,
    		List: List$3,
    		left,
    		top: top$3,
    		title: title$4,
    		id: id$3,
    		dragend,
    		onChange,
    		$tags
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, $tags, dragend];
    }

    class Index$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$U, create_fragment$U, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$U.name
    		});
    	}
    }

    /* src\components\other\OpenHome.svelte generated by Svelte v3.29.7 */

    const { console: console_1$l } = globals;
    const file$H = "src\\components\\other\\OpenHome.svelte";

    function create_fragment$V(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open Home";
    			add_location(button, file$H, 8, 0, 137);
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
    		id: create_fragment$V.name,
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

    function instance$V($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OpenHome", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$l.warn(`<OpenHome> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnOpen });
    	return [];
    }

    class OpenHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$V, create_fragment$V, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpenHome",
    			options,
    			id: create_fragment$V.name
    		});
    	}
    }

    /* src\components\other\CodeHome.svelte generated by Svelte v3.29.7 */

    const { console: console_1$m } = globals;
    const file$I = "src\\components\\other\\CodeHome.svelte";

    function create_fragment$W(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Code Home";
    			add_location(button, file$I, 8, 0, 137);
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
    		id: create_fragment$W.name,
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

    function instance$W($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CodeHome", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$m.warn(`<CodeHome> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnCode });
    	return [];
    }

    class CodeHome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$W, create_fragment$W, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeHome",
    			options,
    			id: create_fragment$W.name
    		});
    	}
    }

    /* src\components\other\Postmessage.svelte generated by Svelte v3.29.7 */

    const { console: console_1$n } = globals;
    const file$J = "src\\components\\other\\Postmessage.svelte";

    function create_fragment$X(ctx) {
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
    			t = text("\r\n  Post Messages");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag();
    			add_location(input, file$J, 15, 2, 361);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$J, 14, 0, 333);
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
    		id: create_fragment$X.name,
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

    function instance$X($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Postmessage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$n.warn(`<Postmessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnPostmessage, flag });
    	return [];
    }

    class Postmessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$X, create_fragment$X, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Postmessage",
    			options,
    			id: create_fragment$X.name
    		});
    	}
    }

    /* src\components\other\Csp.svelte generated by Svelte v3.29.7 */

    const { console: console_1$o } = globals;
    const file$K = "src\\components\\other\\Csp.svelte";

    function create_fragment$Y(ctx) {
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
    			t = text("\r\n  Content Sec. Policy");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = flag$1();
    			add_location(input, file$K, 15, 2, 305);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$K, 14, 0, 277);
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
    		id: create_fragment$Y.name,
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

    function instance$Y($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Csp", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$o.warn(`<Csp> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnCsp, flag: flag$1 });
    	return [];
    }

    class Csp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$Y, create_fragment$Y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Csp",
    			options,
    			id: create_fragment$Y.name
    		});
    	}
    }

    /* src\components\other\Index.svelte generated by Svelte v3.29.7 */
    const file$L = "src\\components\\other\\Index.svelte";

    function create_fragment$Z(ctx) {
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
    			add_location(li0, file$L, 8, 0, 197);
    			attr_dev(li1, "class", "svelte-eb1kd7");
    			add_location(li1, file$L, 9, 0, 219);
    			attr_dev(li2, "class", "svelte-eb1kd7");
    			add_location(li2, file$L, 10, 0, 241);
    			attr_dev(li3, "class", "svelte-eb1kd7");
    			add_location(li3, file$L, 11, 0, 266);
    			attr_dev(ul, "class", "svelte-eb1kd7");
    			add_location(ul, file$L, 7, 0, 191);
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
    		id: create_fragment$Z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$Z($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$Z, create_fragment$Z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$Z.name
    		});
    	}
    }

    // feat: markdown

    const source$3 = writable({
      openDisabled: false,
      saveDisabled: true,
      goDisabled: true,
      content: 'Hi!',
      fpath: '',
      path: ''
    });

    /* src\components\help\Button.svelte generated by Svelte v3.29.7 */
    const file$M = "src\\components\\help\\Button.svelte";

    function create_fragment$_(ctx) {
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
    			add_location(span, file$M, 12, 2, 277);
    			attr_dev(input, "name", "weight");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "10");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "step", "1");
    			input.value = /*value*/ ctx[0];
    			add_location(input, file$M, 13, 2, 311);
    			attr_dev(div, "class", "btn-container svelte-fmpgpb");
    			add_location(div, file$M, 11, 0, 246);
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
    		id: create_fragment$_.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$_($$self, $$props, $$invalidate) {
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

    	$$self.$capture_state = () => ({ source: source$3, value, plotValue });

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
    		init(this, options, instance$_, create_fragment$_, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$_.name
    		});
    	}
    }

    /* src\components\help\Title.svelte generated by Svelte v3.29.7 */

    const file$N = "src\\components\\help\\Title.svelte";

    function create_fragment$$(ctx) {
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("-Help-\r\n");
    			button = element("button");
    			button.textContent = "[--]";
    			attr_dev(button, "class", "clollapse svelte-jf6nf1");
    			add_location(button, file$N, 8, 0, 183);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", btnClose, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$$.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function btnClose() {
    	const nodes = document.querySelectorAll("#list-help details[open]");
    	nodes.forEach(node => node.removeAttribute("open"));
    }

    function instance$$($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ btnClose });
    	return [];
    }

    class Title$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$$, create_fragment$$, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$$.name
    		});
    	}
    }

    /* src\components\help\View.svelte generated by Svelte v3.29.7 */

    const { console: console_1$p } = globals;
    const file$O = "src\\components\\help\\View.svelte";

    function create_fragment$10(ctx) {
    	let div1;
    	let div0;
    	let raw_value = /*content*/ ctx[1](/*$source*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "markdown");
    			add_location(div0, file$O, 77, 2, 2334);
    			attr_dev(div1, "class", "show-container svelte-1nvl3j1");
    			add_location(div1, file$O, 76, 0, 2302);
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
    		id: create_fragment$10.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const r = /(%.{2}|[~.])/g;

    function instance$10($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$3, "source");
    	component_subscribe($$self, source$3, $$value => $$invalidate(0, $source = $$value));
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

    		// console.log('plot the content...');
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$p.warn(`<View> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		source: source$3,
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
    		init(this, options, instance$10, create_fragment$10, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "View",
    			options,
    			id: create_fragment$10.name
    		});
    	}
    }

    /* src\components\help\Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$q } = globals;
    const file$P = "src\\components\\help\\Item.svelte";

    function create_fragment$11(ctx) {
    	let div;
    	let t_value = title$5(/*item*/ ctx[0]) + "";
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
    			add_location(div, file$P, 28, 0, 598);
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
    			if (dirty & /*item*/ 1 && t_value !== (t_value = title$5(/*item*/ ctx[0]) + "")) set_data_dev(t, t_value);

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
    		id: create_fragment$11.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$5(t) {
    	// console.log(t.title)
    	const string = t.title.replace(/\.md$/, "");

    	const pre = string.match(/^([^a-zA-Z]+.|.)/)[0];
    	const post = string.replace(pre, "").toLowerCase();
    	return pre.toUpperCase() + post;
    }

    function instance$11($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$3, "source");
    	component_subscribe($$self, source$3, $$value => $$invalidate(1, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;

    	function clickHandler(e) {
    		console.log(item);
    		const { fpath } = item;

    		ws__send("getMContent", { fpath }, ({ content }) => {
    			source$3.update(n => {
    				return { ...n, content, fpath: item.fpath };
    			});
    		});
    	}

    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$q.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		source: source$3,
    		item,
    		clickHandler,
    		title: title$5,
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

    class Item$4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$11, create_fragment$11, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$11.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console_1$q.warn("<Item> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\help\Summary.svelte generated by Svelte v3.29.7 */
    const file$Q = "src\\components\\help\\Summary.svelte";

    function create_fragment$12(ctx) {
    	let summary;
    	let summary_class_value;

    	const block = {
    		c: function create() {
    			summary = element("summary");
    			attr_dev(summary, "class", summary_class_value = "" + (null_to_empty(/*klass*/ ctx[2](/*$source*/ ctx[1])) + " svelte-11sbt5s"));
    			add_location(summary, file$Q, 15, 0, 236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, summary, anchor);
    			summary.innerHTML = /*key*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 1) summary.innerHTML = /*key*/ ctx[0];
    			if (dirty & /*$source*/ 2 && summary_class_value !== (summary_class_value = "" + (null_to_empty(/*klass*/ ctx[2](/*$source*/ ctx[1])) + " svelte-11sbt5s"))) {
    				attr_dev(summary, "class", summary_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(summary);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$12.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$12($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$3, "source");
    	component_subscribe($$self, source$3, $$value => $$invalidate(1, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Summary", slots, []);
    	let { item } = $$props;
    	let { key } = $$props;

    	function klass(store) {
    		for (const itm in item) {
    			if (itm === store.fpath) {
    				return "chk";
    			}
    		}

    		return "";
    	}

    	const writable_props = ["item", "key"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(3, item = $$props.item);
    		if ("key" in $$props) $$invalidate(0, key = $$props.key);
    	};

    	$$self.$capture_state = () => ({ source: source$3, item, key, klass, $source });

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(3, item = $$props.item);
    		if ("key" in $$props) $$invalidate(0, key = $$props.key);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [key, $source, klass, item];
    }

    class Summary$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$12, create_fragment$12, safe_not_equal, { item: 3, key: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$12.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[3] === undefined && !("item" in props)) {
    			console.warn("<Summary> was created without expected prop 'item'");
    		}

    		if (/*key*/ ctx[0] === undefined && !("key" in props)) {
    			console.warn("<Summary> was created without expected prop 'key'");
    		}
    	}

    	get item() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\help\List.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$i, console: console_1$r } = globals;
    const file$R = "src\\components\\help\\List.svelte";

    function get_each_context$h(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (55:4) {:else}
    function create_else_block$9(ctx) {
    	let details;
    	let summary;
    	let t0;
    	let t1;
    	let current;

    	summary = new Summary$1({
    			props: {
    				item: /*_data*/ ctx[0][/*key*/ ctx[4]],
    				key: /*key*/ ctx[4]
    			},
    			$$inline: true
    		});

    	let each_value_2 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[4]]);
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
    			create_component(summary.$$.fragment);
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			add_location(details, file$R, 55, 6, 1498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			mount_component(summary, details, null);
    			append_dev(details, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(details, null);
    			}

    			append_dev(details, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const summary_changes = {};
    			if (dirty & /*_data*/ 1) summary_changes.item = /*_data*/ ctx[0][/*key*/ ctx[4]];
    			if (dirty & /*_data*/ 1) summary_changes.key = /*key*/ ctx[4];
    			summary.$set(summary_changes);

    			if (dirty & /*Object, _data*/ 1) {
    				each_value_2 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[4]]);
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
    			transition_in(summary.$$.fragment, local);

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(summary.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_component(summary);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$9.name,
    		type: "else",
    		source: "(55:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#if key==='_readme_'}
    function create_if_block$g(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[4]]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
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
    			add_location(div, file$R, 49, 6, 1310);
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
    			if (dirty & /*Object, _data*/ 1) {
    				each_value_1 = Object.keys(/*_data*/ ctx[0][/*key*/ ctx[4]]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$4(child_ctx);
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
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(49:4) {#if key==='_readme_'}",
    		ctx
    	});

    	return block;
    }

    // (58:8) {#each Object.keys(_data[key]) as item}
    function create_each_block_2(ctx) {
    	let item;
    	let current;

    	item = new Item$4({
    			props: {
    				item: {
    					element: /*item*/ ctx[7],
    					.../*_data*/ ctx[0][/*key*/ ctx[4]][/*item*/ ctx[7]]
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
    				element: /*item*/ ctx[7],
    				.../*_data*/ ctx[0][/*key*/ ctx[4]][/*item*/ ctx[7]]
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(58:8) {#each Object.keys(_data[key]) as item}",
    		ctx
    	});

    	return block;
    }

    // (51:8) {#each Object.keys(_data[key]) as item}
    function create_each_block_1$4(ctx) {
    	let item;
    	let current;

    	item = new Item$4({
    			props: {
    				item: {
    					element: /*item*/ ctx[7],
    					.../*_data*/ ctx[0][/*key*/ ctx[4]][/*item*/ ctx[7]]
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
    				element: /*item*/ ctx[7],
    				.../*_data*/ ctx[0][/*key*/ ctx[4]][/*item*/ ctx[7]]
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
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(51:8) {#each Object.keys(_data[key]) as item}",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#each Object.keys(_data) as key, i}
    function create_each_block$h(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$g, create_else_block$9];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*key*/ ctx[4] === "_readme_") return 0;
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
    		id: create_each_block$h.name,
    		type: "each",
    		source: "(48:2) {#each Object.keys(_data) as key, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$13(ctx) {
    	let div;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$h(get_each_context$h(ctx, each_value, i));
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

    			attr_dev(div, "id", "list-help");
    			add_location(div, file$R, 46, 0, 1214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, _data*/ 1) {
    				each_value = Object.keys(/*_data*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$h(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$h(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$13.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$13($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	let rerender = 0;
    	let data = [];

    	onMount(async () => {
    		console.warn("onMount help/list");
    		_ws_connect.markdownOnMount = () => ws__send("getMarkdown", "", markdownHandler);
    	});

    	const markdownHandler = obj => {
    		console.warn("ws__send(getMarkdown)", obj);

    		if (window.mitm.files.markdown === undefined) {
    			window.mitm.files.markdown = obj;
    			$$invalidate(2, data = obj);
    		} else {
    			const { markdown } = window.mitm.files;
    			const newmarkdown = {};

    			for (let k in obj) {
    				newmarkdown[k] = obj[k];
    			}

    			$$invalidate(2, data = newmarkdown);
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

    	const writable_props = [];

    	Object_1$i.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$r.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Item: Item$4,
    		Summary: Summary$1,
    		rerender,
    		data,
    		markdownHandler,
    		_data
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

    	return [_data];
    }

    class List$4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$13, create_fragment$13, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$13.name
    		});
    	}
    }

    /* src\components\help\Index.svelte generated by Svelte v3.29.7 */

    const { console: console_1$s } = globals;

    // (29:0) <VBox2 {title} {left} {dragend} {List}>
    function create_default_slot$d(ctx) {
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
    		id: create_default_slot$d.name,
    		type: "slot",
    		source: "(29:0) <VBox2 {title} {left} {dragend} {List}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$14(ctx) {
    	let button;
    	let t;
    	let vbox2;
    	let current;
    	button = new Button$4({ $$inline: true });

    	vbox2 = new VBox2({
    			props: {
    				title: Title$1,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[1],
    				List: List$4,
    				$$slots: { default: [create_default_slot$d] },
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

    			if (dirty & /*$$scope*/ 4) {
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
    		id: create_fragment$14.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const id$4 = "helpLeft";

    function instance$14($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 150;

    	onMount(async () => {
    		console.warn("onMount help/index");

    		chrome.storage.local.get(id$4, function (opt) {
    			opt[id$4] && $$invalidate(0, left = opt[id$4]);
    		});
    	});

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    		const data = {};
    		data[id$4] = left;
    		chrome.storage.local.set(data);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$s.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Button: Button$4,
    		VBox2,
    		title: Title$1,
    		View,
    		List: List$4,
    		left,
    		id: id$4,
    		dragend
    	});

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, dragend];
    }

    class Index$5 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$14, create_fragment$14, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$14.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.7 */
    const file$S = "src\\App.svelte";

    // (26:2) <Tab label="Route">
    function create_default_slot_5(ctx) {
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
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(26:2) <Tab label=\\\"Route\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:2) <Tab label="Profile">
    function create_default_slot_4(ctx) {
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(27:2) <Tab label=\\\"Profile\\\">",
    		ctx
    	});

    	return block;
    }

    // (28:2) <Tab label="Logs">
    function create_default_slot_3$1(ctx) {
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
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(28:2) <Tab label=\\\"Logs\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:2) <Tab label="Tags">
    function create_default_slot_2$3(ctx) {
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
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(29:2) <Tab label=\\\"Tags\\\">",
    		ctx
    	});

    	return block;
    }

    // (31:2) <Tab label="Help">
    function create_default_slot_1$4(ctx) {
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
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(31:2) <Tab label=\\\"Help\\\">",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Tabs style="is-boxed" size="is-small">
    function create_default_slot$e(ctx) {
    	let tab0;
    	let t0;
    	let tab1;
    	let t1;
    	let tab2;
    	let t2;
    	let tab3;
    	let t3;
    	let tab4;
    	let current;

    	tab0 = new Tab({
    			props: {
    				label: "Route",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1 = new Tab({
    			props: {
    				label: "Profile",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2 = new Tab({
    			props: {
    				label: "Logs",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab3 = new Tab({
    			props: {
    				label: "Tags",
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab4 = new Tab({
    			props: {
    				label: "Help",
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
    		id: create_default_slot$e.name,
    		type: "slot",
    		source: "(25:0) <Tabs style=\\\"is-boxed\\\" size=\\\"is-small\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$15(ctx) {
    	let main;
    	let tabs;
    	let current;

    	tabs = new Tabs({
    			props: {
    				style: "is-boxed",
    				size: "is-small",
    				$$slots: { default: [create_default_slot$e] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			attr_dev(main, "class", "main");
    			add_location(main, file$S, 23, 0, 753);
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
    		id: create_fragment$15.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$15($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$15, create_fragment$15, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$15.name
    		});
    	}
    }

    /* global chrome */
    const rmethod = /^(GET|PUT|POST|DELETE|)#?\d*!?:([\w.#~-]+:|)(.+)/; // feat: tags in url
    const rclass = /[.#~/]+/g;

    console.log('Load MITM plugin');

    function toRegex (str, flags = '') {
      return new RegExp(str
        .replace(/\//g, '\\/')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '\\?'), flags)
    }

    const sortTag = (a,b) => {
      const [k1,v1] = a.split(':');
      const [k2,v2] = b.split(':');
      a = v1 || k1;
      b = v2 || k2;
      if (a<b) return -1;
      if (a>b) return 1;
      return 0;
    };

    function noTagInRule(path) {
      const arr = path.match(rmethod); // feat: tags in url
      return arr ? (arr[1] ? `${arr[1]}:${arr[3]}` : arr[3]) : path
    }

    function isRuleOff(tags, ns, path) {
      const secs = tags.__tag3[ns][path];
      const tag2 = tags.__tag2[ns];
      const tag1 = tags.__tag1;
      if (secs) {
        let id1 = [];
        let id2 = false;
        for (const sec in secs) {
          const node = secs[sec];
          if (node.tag2) {
            if (tag2[node.tag2].state===false) {
              return true
            } else {
              for (const tag of node.tag1) {
                if (tag1[ns][tag]===false) {
                  return true
                }
              }
            }
          }
          const tags = node.tags; // feat: update __tag3
          for (const tag in tags) {
            if (tags[tag]) {
              id1.push(sec);
            } else if (tags[tag]===false) {
              id2 = sec;
              break
            }
          }
        }
        // feat: rule off if URL in the same section
        if ((id1.length===0 && id2) || id1.indexOf(id2)>-1) {
          return true
        }
      }
      return false
    }

    function tagsIn__tag3(tags, ns, path, sec) {
      const secs = tags.__tag3[ns][path];
      let arr = [];
      if (secs) {
        const _sec = sec.split(':')[0];
        const tags = secs[_sec];
        if (tags) {
          arr = Object.keys(tags).map(x=>x.split(':').pop());
        }
      }
      return arr
    }

    function resetRule2(tags, item, ns, tagx) {
      const typ1 = item.split(':')[1] || item;
      const [ group1, id1 ] = typ1.split('~');
      const namespace2 = tags.__tag2[ns];
      const { state } = namespace2[item]; // feat: update __tag2
      if (id1) {
        for (let itm in namespace2) {
          const typ2 = itm.split(':')[1] || itm;
          const [group2, id2] = typ2.split('~');
          if (group1===group2) {
            if (id2===undefined) {
              namespace2[itm].state = state; // feat: update __tag2
            } else if (id1!==id2) {
              namespace2[itm].state = false; // feat: update __tag2
            }
          }
        }
      }
    }

    function resetRule3(tags, item, _ns) {
      const { routes } = window.mitm;
      const {__tag1,__tag2,__tag3} = tags;
      const t1 = item.split('url:').pop();
      const typ1 = item.split(':')[1] || item;
      const [group1, id1] = typ1.split('~');

      let tag1 = !_ns;

      function update(ns) {
        const namespace2 = __tag2[ns];
        const urls = __tag3[ns];

        let flag;
        if (tag1) {
          flag = __tag1[ns];
          if (flag===undefined) {
            flag = false;
          } else {
            flag = flag[t1];
          }
        } else {
          flag = namespace2[item].state;
        }

        for (let url in urls) {
          const typs = urls[url];
          for (let typ in typs) {
            const tags = typs[typ].tags; // feat: update __tag3
            for (let tag in tags) {
              if (item===tag) {
                tags[tag] = flag;
              }
              const id = tag.split('url:').pop();
              const [group2, id2] = id.split('~');

              if (group1===group2) {
                if (tag1) {
                  tags[tag] =  __tag1[ns][id] || false;
                } else {
                  if (id2===undefined) {
                    tags[tag] = namespace2[item].state;
                  } else if (id1!==id2) {
                    tags[tag] = false;
                  }
                }
              }
            }
          }
        }  
      }
      if (_ns) {
        update(_ns);
      } else {
        const nss =  tags.__tag2;
        for (let ns in nss) {
          if (oneSite(tags, ns)) {
            ns = routes[ns]._childns._subns || ns; // feat: chg to child namespace
            update(ns);
          }
        }
      }
    }

    function uniq(value, index, self) {
      return self.indexOf(value) === index;
    }

    function oneSite(tags, ns) {
      const {toRegex} = window.mitm.fn;
      if (ns.match('@')) {
        return false
      } else if (tags.filterUrl) {
        const rgx = toRegex(ns.replace(/~/,'[^.]*'));
        return mitm.browser.activeUrl.match(rgx) || ns==='_global_';
      } else {
        return true;
      }
    }

    const {fn} = window.mitm;
    fn.rmethod = rmethod;
    fn.rclass = rclass;
    fn.tagsIn__tag3 = tagsIn__tag3;
    fn.noTagInRule = noTagInRule;
    fn.resetRule2 = resetRule2;
    fn.resetRule3 = resetRule3;
    fn.isRuleOff = isRuleOff;
    fn.sortTag = sortTag;
    fn.oneSite = oneSite;
    fn.toRegex = toRegex;
    fn.uniq = uniq;
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
      getUrl();
    });

    const app = new App({ target: document.body });
    console.log('Start plugin');
    getUrl();

    return app;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvbW90aW9uL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWJzLnN2ZWx0ZSIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L0JTdGF0aWMuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L1NwbGl0dGVyLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9CUmVzaXplLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9CSGVhZGVyLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9WQm94Mi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9tb25hY28vRXhidXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL21vbmFjby9pbml0LmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvRWRpdG9yLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvcmVyZW5kZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL3VybC1kZWJvdW5jZS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3JvdXRlL0l0ZW0uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvTGlzdC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9JbmRleC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9wcm9maWxlL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvRWRpdG9yLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9wcm9maWxlL0xpc3Quc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9JbmRleC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2J1dHRvbi9zdGF0ZXMuanMiLCIuLi9zcmMvY29tcG9uZW50cy9idXR0b24vQ29sbGFwc2Uuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvYnV0dG9uL0V4cGFuZC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0J1dHRvbi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0l0ZW0uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9TdW1tYXJ5LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvTGlzdC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL3RhYi5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvQnV0dG9uMi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0Jhc2VUYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Kc29uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvSHRtbC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1RleHQuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Dc3Muc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9Kcy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1Nob3cuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9JbmRleC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2J1dHRvbi9DaGV2cm9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczFfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczJfVGl0bGUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzMl8xLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczJfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfMy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MzXzIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzM18xLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVXJsLXN0eWxlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGl0bGUtYnRuLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGl0bGUtdXJsLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVXJscy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL0NvbnRlbnQuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvTGlzdC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL09wZW5Ib21lLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL0NvZGVIb21lLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL1Bvc3RtZXNzYWdlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL290aGVyL0NzcC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwL3N0b3Jlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvVGl0bGUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9WaWV3LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwL1N1bW1hcnkuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9MaXN0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvSW5kZXguc3ZlbHRlIiwiLi4vc3JjL0FwcC5zdmVsdGUiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBub29wKCkgeyB9XG5jb25zdCBpZGVudGl0eSA9IHggPT4geDtcbmZ1bmN0aW9uIGFzc2lnbih0YXIsIHNyYykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKVxuICAgICAgICB0YXJba10gPSBzcmNba107XG4gICAgcmV0dXJuIHRhcjtcbn1cbmZ1bmN0aW9uIGlzX3Byb21pc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5mdW5jdGlvbiBub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuZnVuY3Rpb24gaXNfZW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfc3RvcmUoc3RvcmUsIG5hbWUpIHtcbiAgICBpZiAoc3RvcmUgIT0gbnVsbCAmJiB0eXBlb2Ygc3RvcmUuc3Vic2NyaWJlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7bmFtZX0nIGlzIG5vdCBhIHN0b3JlIHdpdGggYSAnc3Vic2NyaWJlJyBtZXRob2RgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzdWJzY3JpYmUoc3RvcmUsIC4uLmNhbGxiYWNrcykge1xuICAgIGlmIChzdG9yZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub29wO1xuICAgIH1cbiAgICBjb25zdCB1bnN1YiA9IHN0b3JlLnN1YnNjcmliZSguLi5jYWxsYmFja3MpO1xuICAgIHJldHVybiB1bnN1Yi51bnN1YnNjcmliZSA/ICgpID0+IHVuc3ViLnVuc3Vic2NyaWJlKCkgOiB1bnN1Yjtcbn1cbmZ1bmN0aW9uIGdldF9zdG9yZV92YWx1ZShzdG9yZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBzdWJzY3JpYmUoc3RvcmUsIF8gPT4gdmFsdWUgPSBfKSgpO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIGNvbXBvbmVudF9zdWJzY3JpYmUoY29tcG9uZW50LCBzdG9yZSwgY2FsbGJhY2spIHtcbiAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKHN1YnNjcmliZShzdG9yZSwgY2FsbGJhY2spKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9zbG90KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgICBjb25zdCBzbG90X2N0eCA9IGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbik7XG4gICAgICAgIHJldHVybiBkZWZpbml0aW9uWzBdKHNsb3RfY3R4KTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jb250ZXh0KGRlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZm4pIHtcbiAgICByZXR1cm4gZGVmaW5pdGlvblsxXSAmJiBmblxuICAgICAgICA/IGFzc2lnbigkJHNjb3BlLmN0eC5zbGljZSgpLCBkZWZpbml0aW9uWzFdKGZuKGN0eCkpKVxuICAgICAgICA6ICQkc2NvcGUuY3R4O1xufVxuZnVuY3Rpb24gZ2V0X3Nsb3RfY2hhbmdlcyhkZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZm4pIHtcbiAgICBpZiAoZGVmaW5pdGlvblsyXSAmJiBmbikge1xuICAgICAgICBjb25zdCBsZXRzID0gZGVmaW5pdGlvblsyXShmbihkaXJ0eSkpO1xuICAgICAgICBpZiAoJCRzY29wZS5kaXJ0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGxldHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KCQkc2NvcGUuZGlydHkubGVuZ3RoLCBsZXRzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VkW2ldID0gJCRzY29wZS5kaXJ0eVtpXSB8IGxldHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJHNjb3BlLmRpcnR5IHwgbGV0cztcbiAgICB9XG4gICAgcmV0dXJuICQkc2NvcGUuZGlydHk7XG59XG5mdW5jdGlvbiB1cGRhdGVfc2xvdChzbG90LCBzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4sIGdldF9zbG90X2NvbnRleHRfZm4pIHtcbiAgICBjb25zdCBzbG90X2NoYW5nZXMgPSBnZXRfc2xvdF9jaGFuZ2VzKHNsb3RfZGVmaW5pdGlvbiwgJCRzY29wZSwgZGlydHksIGdldF9zbG90X2NoYW5nZXNfZm4pO1xuICAgIGlmIChzbG90X2NoYW5nZXMpIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jb250ZXh0ID0gZ2V0X3Nsb3RfY29udGV4dChzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG4gICAgICAgIHNsb3QucChzbG90X2NvbnRleHQsIHNsb3RfY2hhbmdlcyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZXhjbHVkZV9pbnRlcm5hbF9wcm9wcyhwcm9wcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBpbiBwcm9wcylcbiAgICAgICAgaWYgKGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb21wdXRlX3Jlc3RfcHJvcHMocHJvcHMsIGtleXMpIHtcbiAgICBjb25zdCByZXN0ID0ge307XG4gICAga2V5cyA9IG5ldyBTZXQoa2V5cyk7XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoIWtleXMuaGFzKGspICYmIGtbMF0gIT09ICckJylcbiAgICAgICAgICAgIHJlc3Rba10gPSBwcm9wc1trXTtcbiAgICByZXR1cm4gcmVzdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfc2xvdHMoc2xvdHMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBzbG90cykge1xuICAgICAgICByZXN1bHRba2V5XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgbGV0IHJhbiA9IGZhbHNlO1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBpZiAocmFuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIH07XG59XG5mdW5jdGlvbiBudWxsX3RvX2VtcHR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X3N0b3JlX3ZhbHVlKHN0b3JlLCByZXQsIHZhbHVlID0gcmV0KSB7XG4gICAgc3RvcmUuc2V0KHZhbHVlKTtcbiAgICByZXR1cm4gcmV0O1xufVxuY29uc3QgaGFzX3Byb3AgPSAob2JqLCBwcm9wKSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbmZ1bmN0aW9uIGFjdGlvbl9kZXN0cm95ZXIoYWN0aW9uX3Jlc3VsdCkge1xuICAgIHJldHVybiBhY3Rpb25fcmVzdWx0ICYmIGlzX2Z1bmN0aW9uKGFjdGlvbl9yZXN1bHQuZGVzdHJveSkgPyBhY3Rpb25fcmVzdWx0LmRlc3Ryb3kgOiBub29wO1xufVxuXG5jb25zdCBpc19jbGllbnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbmxldCBub3cgPSBpc19jbGllbnRcbiAgICA/ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKVxuICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCByYWYgPSBpc19jbGllbnQgPyBjYiA9PiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2IpIDogbm9vcDtcbi8vIHVzZWQgaW50ZXJuYWxseSBmb3IgdGVzdGluZ1xuZnVuY3Rpb24gc2V0X25vdyhmbikge1xuICAgIG5vdyA9IGZuO1xufVxuZnVuY3Rpb24gc2V0X3JhZihmbikge1xuICAgIHJhZiA9IGZuO1xufVxuXG5jb25zdCB0YXNrcyA9IG5ldyBTZXQoKTtcbmZ1bmN0aW9uIHJ1bl90YXNrcyhub3cpIHtcbiAgICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBpZiAoIXRhc2suYyhub3cpKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgICAgICB0YXNrLmYoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0YXNrcy5zaXplICE9PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbn1cbi8qKlxuICogRm9yIHRlc3RpbmcgcHVycG9zZXMgb25seSFcbiAqL1xuZnVuY3Rpb24gY2xlYXJfbG9vcHMoKSB7XG4gICAgdGFza3MuY2xlYXIoKTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB0YXNrIHRoYXQgcnVucyBvbiBlYWNoIHJhZiBmcmFtZVxuICogdW50aWwgaXQgcmV0dXJucyBhIGZhbHN5IHZhbHVlIG9yIGlzIGFib3J0ZWRcbiAqL1xuZnVuY3Rpb24gbG9vcChjYWxsYmFjaykge1xuICAgIGxldCB0YXNrO1xuICAgIGlmICh0YXNrcy5zaXplID09PSAwKVxuICAgICAgICByYWYocnVuX3Rhc2tzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9taXNlOiBuZXcgUHJvbWlzZShmdWxmaWxsID0+IHtcbiAgICAgICAgICAgIHRhc2tzLmFkZCh0YXNrID0geyBjOiBjYWxsYmFjaywgZjogZnVsZmlsbCB9KTtcbiAgICAgICAgfSksXG4gICAgICAgIGFib3J0KCkge1xuICAgICAgICAgICAgdGFza3MuZGVsZXRlKHRhc2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kKHRhcmdldCwgbm9kZSkge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yIHx8IG51bGwpO1xufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSk7XG4gICAgZWxzZSBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKSAhPT0gdmFsdWUpXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gc2V0X2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG5vZGUuX19wcm90b19fKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdfX3ZhbHVlJykge1xuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNjcmlwdG9yc1trZXldICYmIGRlc2NyaXB0b3JzW2tleV0uc2V0KSB7XG4gICAgICAgICAgICBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdmdfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBhdHRyKG5vZGUsIGtleSwgYXR0cmlidXRlc1trZXldKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YShub2RlLCBwcm9wLCB2YWx1ZSkge1xuICAgIGlmIChwcm9wIGluIG5vZGUpIHtcbiAgICAgICAgbm9kZVtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYXR0cihub2RlLCBwcm9wLCB2YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24geGxpbmtfYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuZnVuY3Rpb24gZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUoZ3JvdXAsIF9fdmFsdWUsIGNoZWNrZWQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChncm91cFtpXS5jaGVja2VkKVxuICAgICAgICAgICAgdmFsdWUuYWRkKGdyb3VwW2ldLl9fdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoIWNoZWNrZWQpIHtcbiAgICAgICAgdmFsdWUuZGVsZXRlKF9fdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gQXJyYXkuZnJvbSh2YWx1ZSk7XG59XG5mdW5jdGlvbiB0b19udW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gbnVsbCA6ICt2YWx1ZTtcbn1cbmZ1bmN0aW9uIHRpbWVfcmFuZ2VzX3RvX2FycmF5KHJhbmdlcykge1xuICAgIGNvbnN0IGFycmF5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgYXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY2hpbGRyZW4oZWxlbWVudCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgIGxldCBqID0gMDtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2orK107XG4gICAgICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmUucHVzaChhdHRyaWJ1dGUubmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmUubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShyZW1vdmVba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3ZnID8gc3ZnX2VsZW1lbnQobmFtZSkgOiBlbGVtZW50KG5hbWUpO1xufVxuZnVuY3Rpb24gY2xhaW1fdGV4dChub2RlcywgZGF0YSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gJycgKyBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGV4dChkYXRhKTtcbn1cbmZ1bmN0aW9uIGNsYWltX3NwYWNlKG5vZGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX3RleHQobm9kZXMsICcgJyk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YSh0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgIT09IGRhdGEpXG4gICAgICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiBzZXRfaW5wdXRfdmFsdWUoaW5wdXQsIHZhbHVlKSB7XG4gICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF90eXBlKGlucHV0LCB0eXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3R5bGUobm9kZSwga2V5LCB2YWx1ZSwgaW1wb3J0YW50KSB7XG4gICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG4gICAgICAgIGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF92YWx1ZShzZWxlY3QpIHtcbiAgICBjb25zdCBzZWxlY3RlZF9vcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcbiAgICByZXR1cm4gc2VsZWN0ZWRfb3B0aW9uICYmIHNlbGVjdGVkX29wdGlvbi5fX3ZhbHVlO1xufVxuZnVuY3Rpb24gc2VsZWN0X211bHRpcGxlX3ZhbHVlKHNlbGVjdCkge1xuICAgIHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgb3B0aW9uID0+IG9wdGlvbi5fX3ZhbHVlKTtcbn1cbi8vIHVuZm9ydHVuYXRlbHkgdGhpcyBjYW4ndCBiZSBhIGNvbnN0YW50IGFzIHRoYXQgd291bGRuJ3QgYmUgdHJlZS1zaGFrZWFibGVcbi8vIHNvIHdlIGNhY2hlIHRoZSByZXN1bHQgaW5zdGVhZFxubGV0IGNyb3Nzb3JpZ2luO1xuZnVuY3Rpb24gaXNfY3Jvc3NvcmlnaW4oKSB7XG4gICAgaWYgKGNyb3Nzb3JpZ2luID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY3Jvc3NvcmlnaW4gPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm9pZCB3aW5kb3cucGFyZW50LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY3Jvc3NvcmlnaW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjcm9zc29yaWdpbjtcbn1cbmZ1bmN0aW9uIGFkZF9yZXNpemVfbGlzdGVuZXIobm9kZSwgZm4pIHtcbiAgICBjb25zdCBjb21wdXRlZF9zdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgY29uc3Qgel9pbmRleCA9IChwYXJzZUludChjb21wdXRlZF9zdHlsZS56SW5kZXgpIHx8IDApIC0gMTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICBgb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogJHt6X2luZGV4fTtgKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgY29uc3QgY3Jvc3NvcmlnaW4gPSBpc19jcm9zc29yaWdpbigpO1xuICAgIGxldCB1bnN1YnNjcmliZTtcbiAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9IFwiZGF0YTp0ZXh0L2h0bWwsPHNjcmlwdD5vbnJlc2l6ZT1mdW5jdGlvbigpe3BhcmVudC5wb3N0TWVzc2FnZSgwLCcqJyl9PC9zY3JpcHQ+XCI7XG4gICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKHdpbmRvdywgJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5zb3VyY2UgPT09IGlmcmFtZS5jb250ZW50V2luZG93KVxuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuayc7XG4gICAgICAgIGlmcmFtZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3RlbihpZnJhbWUuY29udGVudFdpbmRvdywgJ3Jlc2l6ZScsIGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXBwZW5kKG5vZGUsIGlmcmFtZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVuc3Vic2NyaWJlICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRldGFjaChpZnJhbWUpO1xuICAgIH07XG59XG5mdW5jdGlvbiB0b2dnbGVfY2xhc3MoZWxlbWVudCwgbmFtZSwgdG9nZ2xlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3RbdG9nZ2xlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG59XG5mdW5jdGlvbiBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKSB7XG4gICAgY29uc3QgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGUuaW5pdEN1c3RvbUV2ZW50KHR5cGUsIGZhbHNlLCBmYWxzZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5jbGFzcyBIdG1sVGFnIHtcbiAgICBjb25zdHJ1Y3RvcihhbmNob3IgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuYSA9IGFuY2hvcjtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICB9XG4gICAgbShodG1sLCB0YXJnZXQsIGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgaWYgKCF0aGlzLmUpIHtcbiAgICAgICAgICAgIHRoaXMuZSA9IGVsZW1lbnQodGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICAgICAgICAgIHRoaXMudCA9IHRhcmdldDtcbiAgICAgICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmkoYW5jaG9yKTtcbiAgICB9XG4gICAgaChodG1sKSB7XG4gICAgICAgIHRoaXMuZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB0aGlzLm4gPSBBcnJheS5mcm9tKHRoaXMuZS5jaGlsZE5vZGVzKTtcbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydCh0aGlzLnQsIHRoaXMubltpXSwgYW5jaG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwKGh0bWwpIHtcbiAgICAgICAgdGhpcy5kKCk7XG4gICAgICAgIHRoaXMuaChodG1sKTtcbiAgICAgICAgdGhpcy5pKHRoaXMuYSk7XG4gICAgfVxuICAgIGQoKSB7XG4gICAgICAgIHRoaXMubi5mb3JFYWNoKGRldGFjaCk7XG4gICAgfVxufVxuZnVuY3Rpb24gYXR0cmlidXRlX3RvX29iamVjdChhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgICByZXN1bHRbYXR0cmlidXRlLm5hbWVdID0gYXR0cmlidXRlLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cyhlbGVtZW50KSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgcmVzdWx0W25vZGUuc2xvdCB8fCAnZGVmYXVsdCddID0gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBhY3RpdmVfZG9jcyA9IG5ldyBTZXQoKTtcbmxldCBhY3RpdmUgPSAwO1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG4gICAgbGV0IGhhc2ggPSA1MzgxO1xuICAgIGxldCBpID0gc3RyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gaGFzaCA+Pj4gMDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGFjdGl2ZV9kb2NzLmFkZChkb2MpO1xuICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBkb2MuX19zdmVsdGVfc3R5bGVzaGVldCB8fCAoZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQgPSBkb2MuaGVhZC5hcHBlbmRDaGlsZChlbGVtZW50KCdzdHlsZScpKS5zaGVldCk7XG4gICAgY29uc3QgY3VycmVudF9ydWxlcyA9IGRvYy5fX3N2ZWx0ZV9ydWxlcyB8fCAoZG9jLl9fc3ZlbHRlX3J1bGVzID0ge30pO1xuICAgIGlmICghY3VycmVudF9ydWxlc1tuYW1lXSkge1xuICAgICAgICBjdXJyZW50X3J1bGVzW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgc3R5bGVzaGVldC5pbnNlcnRSdWxlKGBAa2V5ZnJhbWVzICR7bmFtZX0gJHtydWxlfWAsIHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJyc7XG4gICAgbm9kZS5zdHlsZS5hbmltYXRpb24gPSBgJHthbmltYXRpb24gPyBgJHthbmltYXRpb259LCBgIDogJyd9JHtuYW1lfSAke2R1cmF0aW9ufW1zIGxpbmVhciAke2RlbGF5fW1zIDEgYm90aGA7XG4gICAgYWN0aXZlICs9IDE7XG4gICAgcmV0dXJuIG5hbWU7XG59XG5mdW5jdGlvbiBkZWxldGVfcnVsZShub2RlLCBuYW1lKSB7XG4gICAgY29uc3QgcHJldmlvdXMgPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpLnNwbGl0KCcsICcpO1xuICAgIGNvbnN0IG5leHQgPSBwcmV2aW91cy5maWx0ZXIobmFtZVxuICAgICAgICA/IGFuaW0gPT4gYW5pbS5pbmRleE9mKG5hbWUpIDwgMCAvLyByZW1vdmUgc3BlY2lmaWMgYW5pbWF0aW9uXG4gICAgICAgIDogYW5pbSA9PiBhbmltLmluZGV4T2YoJ19fc3ZlbHRlJykgPT09IC0xIC8vIHJlbW92ZSBhbGwgU3ZlbHRlIGFuaW1hdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBwcmV2aW91cy5sZW5ndGggLSBuZXh0Lmxlbmd0aDtcbiAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5leHQuam9pbignLCAnKTtcbiAgICAgICAgYWN0aXZlIC09IGRlbGV0ZWQ7XG4gICAgICAgIGlmICghYWN0aXZlKVxuICAgICAgICAgICAgY2xlYXJfcnVsZXMoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhcl9ydWxlcygpIHtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBhY3RpdmVfZG9jcy5mb3JFYWNoKGRvYyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZXNoZWV0ID0gZG9jLl9fc3ZlbHRlX3N0eWxlc2hlZXQ7XG4gICAgICAgICAgICBsZXQgaSA9IHN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG4gICAgICAgICAgICBkb2MuX19zdmVsdGVfcnVsZXMgPSB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFjdGl2ZV9kb2NzLmNsZWFyKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9hbmltYXRpb24obm9kZSwgZnJvbSwgZm4sIHBhcmFtcykge1xuICAgIGlmICghZnJvbSlcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgY29uc3QgdG8gPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChmcm9tLmxlZnQgPT09IHRvLmxlZnQgJiYgZnJvbS5yaWdodCA9PT0gdG8ucmlnaHQgJiYgZnJvbS50b3AgPT09IHRvLnRvcCAmJiBmcm9tLmJvdHRvbSA9PT0gdG8uYm90dG9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86IHNob3VsZCB0aGlzIGJlIHNlcGFyYXRlZCBmcm9tIGRlc3RydWN0dXJpbmc/IE9yIHN0YXJ0L2VuZCBhZGRlZCB0byBwdWJsaWMgYXBpIGFuZCBkb2N1bWVudGF0aW9uP1xuICAgIHN0YXJ0OiBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheSwgXG4gICAgLy8gQHRzLWlnbm9yZSB0b2RvOlxuICAgIGVuZCA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbiwgdGljayA9IG5vb3AsIGNzcyB9ID0gZm4obm9kZSwgeyBmcm9tLCB0byB9LCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gdHJ1ZTtcbiAgICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuICAgIGxldCBuYW1lO1xuICAgIGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICBuYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMCwgMSwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWxheSkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpO1xuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGxvb3Aobm93ID0+IHtcbiAgICAgICAgaWYgKCFzdGFydGVkICYmIG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhcnRlZCAmJiBub3cgPj0gZW5kKSB7XG4gICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gbm93IC0gc3RhcnRfdGltZTtcbiAgICAgICAgICAgIGNvbnN0IHQgPSAwICsgMSAqIGVhc2luZyhwIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgc3RhcnQoKTtcbiAgICB0aWNrKDAsIDEpO1xuICAgIHJldHVybiBzdG9wO1xufVxuZnVuY3Rpb24gZml4X3Bvc2l0aW9uKG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgaWYgKHN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHN0eWxlLnBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gc3R5bGU7XG4gICAgICAgIGNvbnN0IGEgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgbm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgYWRkX3RyYW5zZm9ybShub2RlLCBhKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpIHtcbiAgICBjb25zdCBiID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoYS5sZWZ0ICE9PSBiLmxlZnQgfHwgYS50b3AgIT09IGIudG9wKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtID09PSAnbm9uZScgPyAnJyA6IHN0eWxlLnRyYW5zZm9ybTtcbiAgICAgICAgbm9kZS5zdHlsZS50cmFuc2Zvcm0gPSBgJHt0cmFuc2Zvcm19IHRyYW5zbGF0ZSgke2EubGVmdCAtIGIubGVmdH1weCwgJHthLnRvcCAtIGIudG9wfXB4KWA7XG4gICAgfVxufVxuXG5sZXQgY3VycmVudF9jb21wb25lbnQ7XG5mdW5jdGlvbiBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KSB7XG4gICAgY3VycmVudF9jb21wb25lbnQgPSBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBnZXRfY3VycmVudF9jb21wb25lbnQoKSB7XG4gICAgaWYgKCFjdXJyZW50X2NvbXBvbmVudClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiBjYWxsZWQgb3V0c2lkZSBjb21wb25lbnQgaW5pdGlhbGl6YXRpb24nKTtcbiAgICByZXR1cm4gY3VycmVudF9jb21wb25lbnQ7XG59XG5mdW5jdGlvbiBiZWZvcmVVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5iZWZvcmVfdXBkYXRlLnB1c2goZm4pO1xufVxuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gYWZ0ZXJVcGRhdGUoZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5hZnRlcl91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCkge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgIHJldHVybiAodHlwZSwgZGV0YWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCk7XG4gICAgICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbXBvbmVudCwgZXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xufVxuZnVuY3Rpb24gZ2V0Q29udGV4dChrZXkpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dC5nZXQoa2V5KTtcbn1cbi8vIFRPRE8gZmlndXJlIG91dCBpZiB3ZSBzdGlsbCB3YW50IHRvIHN1cHBvcnRcbi8vIHNob3J0aGFuZCBldmVudHMsIG9yIGlmIHdlIHdhbnQgdG8gaW1wbGVtZW50XG4vLyBhIHJlYWwgYnViYmxpbmcgbWVjaGFuaXNtXG5mdW5jdGlvbiBidWJibGUoY29tcG9uZW50LCBldmVudCkge1xuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbZXZlbnQudHlwZV07XG4gICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFja3Muc2xpY2UoKS5mb3JFYWNoKGZuID0+IGZuKGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG5sZXQgZmx1c2hpbmcgPSBmYWxzZTtcbmNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgaWYgKGZsdXNoaW5nKVxuICAgICAgICByZXR1cm47XG4gICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgIGRvIHtcbiAgICAgICAgLy8gZmlyc3QsIGNhbGwgYmVmb3JlVXBkYXRlIGZ1bmN0aW9uc1xuICAgICAgICAvLyBhbmQgdXBkYXRlIGNvbXBvbmVudHNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICB1cGRhdGUoY29tcG9uZW50LiQkKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgd2hpbGUgKGJpbmRpbmdfY2FsbGJhY2tzLmxlbmd0aClcbiAgICAgICAgICAgIGJpbmRpbmdfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgICAgIC8vIHRoZW4sIG9uY2UgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgY2FsbFxuICAgICAgICAvLyBhZnRlclVwZGF0ZSBmdW5jdGlvbnMuIFRoaXMgbWF5IGNhdXNlXG4gICAgICAgIC8vIHN1YnNlcXVlbnQgdXBkYXRlcy4uLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gcmVuZGVyX2NhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICghc2Vlbl9jYWxsYmFja3MuaGFzKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIC8vIC4uLnNvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgbG9vcHNcbiAgICAgICAgICAgICAgICBzZWVuX2NhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIH0gd2hpbGUgKGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoKTtcbiAgICB3aGlsZSAoZmx1c2hfY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICBmbHVzaF9jYWxsYmFja3MucG9wKCkoKTtcbiAgICB9XG4gICAgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgc2Vlbl9jYWxsYmFja3MuY2xlYXIoKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgkJCkge1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAkJC51cGRhdGUoKTtcbiAgICAgICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAgICAgY29uc3QgZGlydHkgPSAkJC5kaXJ0eTtcbiAgICAgICAgJCQuZGlydHkgPSBbLTFdO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5wKCQkLmN0eCwgZGlydHkpO1xuICAgICAgICAkJC5hZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbiAgICB9XG59XG5cbmxldCBwcm9taXNlO1xuZnVuY3Rpb24gd2FpdCgpIHtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICBwcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIGRpc3BhdGNoKG5vZGUsIGRpcmVjdGlvbiwga2luZCkge1xuICAgIG5vZGUuZGlzcGF0Y2hFdmVudChjdXN0b21fZXZlbnQoYCR7ZGlyZWN0aW9uID8gJ2ludHJvJyA6ICdvdXRybyd9JHtraW5kfWApKTtcbn1cbmNvbnN0IG91dHJvaW5nID0gbmV3IFNldCgpO1xubGV0IG91dHJvcztcbmZ1bmN0aW9uIGdyb3VwX291dHJvcygpIHtcbiAgICBvdXRyb3MgPSB7XG4gICAgICAgIHI6IDAsXG4gICAgICAgIGM6IFtdLFxuICAgICAgICBwOiBvdXRyb3MgLy8gcGFyZW50IGdyb3VwXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNoZWNrX291dHJvcygpIHtcbiAgICBpZiAoIW91dHJvcy5yKSB7XG4gICAgICAgIHJ1bl9hbGwob3V0cm9zLmMpO1xuICAgIH1cbiAgICBvdXRyb3MgPSBvdXRyb3MucDtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25faW4oYmxvY2ssIGxvY2FsKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLmkpIHtcbiAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgYmxvY2suaShsb2NhbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9vdXQoYmxvY2ssIGxvY2FsLCBkZXRhY2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGJsb2NrICYmIGJsb2NrLm8pIHtcbiAgICAgICAgaWYgKG91dHJvaW5nLmhhcyhibG9jaykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG91dHJvaW5nLmFkZChibG9jayk7XG4gICAgICAgIG91dHJvcy5jLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgb3V0cm9pbmcuZGVsZXRlKGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChkZXRhY2gpXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmQoMSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJsb2NrLm8obG9jYWwpO1xuICAgIH1cbn1cbmNvbnN0IG51bGxfdHJhbnNpdGlvbiA9IHsgZHVyYXRpb246IDAgfTtcbmZ1bmN0aW9uIGNyZWF0ZV9pbl90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IGZhbHNlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdWlkID0gMDtcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdvKCkge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzLCB1aWQrKyk7XG4gICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgaWYgKHRhc2spXG4gICAgICAgICAgICB0YXNrLmFib3J0KCk7XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBhZGRfcmVuZGVyX2NhbGxiYWNrKCgpID0+IGRpc3BhdGNoKG5vZGUsIHRydWUsICdzdGFydCcpKTtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBlbmRfdGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCB0cnVlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oZ28pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9vdXRfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlbmQocmVzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZXNldCAmJiBjb25maWcudGljaykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy50aWNrKDEsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX2JpZGlyZWN0aW9uYWxfdHJhbnNpdGlvbihub2RlLCBmbiwgcGFyYW1zLCBpbnRybykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSBwcm9ncmFtLmIgLSB0O1xuICAgICAgICBkdXJhdGlvbiAqPSBNYXRoLmFicyhkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGE6IHQsXG4gICAgICAgICAgICBiOiBwcm9ncmFtLmIsXG4gICAgICAgICAgICBkLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBzdGFydDogcHJvZ3JhbS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogcHJvZ3JhbS5zdGFydCArIGR1cmF0aW9uLFxuICAgICAgICAgICAgZ3JvdXA6IHByb2dyYW0uZ3JvdXBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oYikge1xuICAgICAgICBjb25zdCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSAzMDAsIGVhc2luZyA9IGlkZW50aXR5LCB0aWNrID0gbm9vcCwgY3NzIH0gPSBjb25maWcgfHwgbnVsbF90cmFuc2l0aW9uO1xuICAgICAgICBjb25zdCBwcm9ncmFtID0ge1xuICAgICAgICAgICAgc3RhcnQ6IG5vdygpICsgZGVsYXksXG4gICAgICAgICAgICBiXG4gICAgICAgIH07XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIHByb2dyYW0uZ3JvdXAgPSBvdXRyb3M7XG4gICAgICAgICAgICBvdXRyb3MuciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICBwZW5kaW5nX3Byb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhbiBpbnRybywgYW5kIHRoZXJlJ3MgYSBkZWxheSwgd2UgbmVlZCB0byBkb1xuICAgICAgICAgICAgLy8gYW4gaW5pdGlhbCB0aWNrIGFuZC9vciBhcHBseSBDU1MgYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uX25hbWUgPSBjcmVhdGVfcnVsZShub2RlLCB0LCBiLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChiKVxuICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBpbml0KHByb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgYiwgJ3N0YXJ0JykpO1xuICAgICAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nX3Byb2dyYW0gJiYgbm93ID4gcGVuZGluZ19wcm9ncmFtLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocGVuZGluZ19wcm9ncmFtLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnc3RhcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIHJ1bm5pbmdfcHJvZ3JhbS5iLCBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24sIDAsIGVhc2luZywgY29uZmlnLmNzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCA9IHJ1bm5pbmdfcHJvZ3JhbS5iLCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChub2RlLCBydW5uaW5nX3Byb2dyYW0uYiwgJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBkb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbS5iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludHJvIOKAlCB3ZSBjYW4gdGlkeSB1cCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG91dHJvIOKAlCBuZWVkcyB0byBiZSBjb29yZGluYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIS0tcnVubmluZ19wcm9ncmFtLmdyb3VwLnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKHJ1bm5pbmdfcHJvZ3JhbS5ncm91cC5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vdyA+PSBydW5uaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBydW5uaW5nX3Byb2dyYW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gcnVubmluZ19wcm9ncmFtLmEgKyBydW5uaW5nX3Byb2dyYW0uZCAqIGVhc2luZyhwIC8gcnVubmluZ19wcm9ncmFtLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhIShydW5uaW5nX3Byb2dyYW0gfHwgcGVuZGluZ19wcm9ncmFtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJ1bihiKSB7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ja3NbaV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgICAgICBpZiAoIWluZm8uaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5cbmNvbnN0IGdsb2JhbHMgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICA/IHdpbmRvd1xuICAgIDogdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gZ2xvYmFsVGhpc1xuICAgICAgICA6IGdsb2JhbCk7XG5cbmZ1bmN0aW9uIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmQoMSk7XG4gICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xufVxuZnVuY3Rpb24gb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIGRlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCk7XG59XG5mdW5jdGlvbiB1cGRhdGVfa2V5ZWRfZWFjaChvbGRfYmxvY2tzLCBkaXJ0eSwgZ2V0X2tleSwgZHluYW1pYywgY3R4LCBsaXN0LCBsb29rdXAsIG5vZGUsIGRlc3Ryb3ksIGNyZWF0ZV9lYWNoX2Jsb2NrLCBuZXh0LCBnZXRfY29udGV4dCkge1xuICAgIGxldCBvID0gb2xkX2Jsb2Nrcy5sZW5ndGg7XG4gICAgbGV0IG4gPSBsaXN0Lmxlbmd0aDtcbiAgICBsZXQgaSA9IG87XG4gICAgY29uc3Qgb2xkX2luZGV4ZXMgPSB7fTtcbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBvbGRfaW5kZXhlc1tvbGRfYmxvY2tzW2ldLmtleV0gPSBpO1xuICAgIGNvbnN0IG5ld19ibG9ja3MgPSBbXTtcbiAgICBjb25zdCBuZXdfbG9va3VwID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlbHRhcyA9IG5ldyBNYXAoKTtcbiAgICBpID0gbjtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkX2N0eCA9IGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSk7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IGJsb2NrID0gbG9va3VwLmdldChrZXkpO1xuICAgICAgICBpZiAoIWJsb2NrKSB7XG4gICAgICAgICAgICBibG9jayA9IGNyZWF0ZV9lYWNoX2Jsb2NrKGtleSwgY2hpbGRfY3R4KTtcbiAgICAgICAgICAgIGJsb2NrLmMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkeW5hbWljKSB7XG4gICAgICAgICAgICBibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xuICAgICAgICB9XG4gICAgICAgIG5ld19sb29rdXAuc2V0KGtleSwgbmV3X2Jsb2Nrc1tpXSA9IGJsb2NrKTtcbiAgICAgICAgaWYgKGtleSBpbiBvbGRfaW5kZXhlcylcbiAgICAgICAgICAgIGRlbHRhcy5zZXQoa2V5LCBNYXRoLmFicyhpIC0gb2xkX2luZGV4ZXNba2V5XSkpO1xuICAgIH1cbiAgICBjb25zdCB3aWxsX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZGlkX21vdmUgPSBuZXcgU2V0KCk7XG4gICAgZnVuY3Rpb24gaW5zZXJ0KGJsb2NrKSB7XG4gICAgICAgIHRyYW5zaXRpb25faW4oYmxvY2ssIDEpO1xuICAgICAgICBibG9jay5tKG5vZGUsIG5leHQpO1xuICAgICAgICBsb29rdXAuc2V0KGJsb2NrLmtleSwgYmxvY2spO1xuICAgICAgICBuZXh0ID0gYmxvY2suZmlyc3Q7XG4gICAgICAgIG4tLTtcbiAgICB9XG4gICAgd2hpbGUgKG8gJiYgbikge1xuICAgICAgICBjb25zdCBuZXdfYmxvY2sgPSBuZXdfYmxvY2tzW24gLSAxXTtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvIC0gMV07XG4gICAgICAgIGNvbnN0IG5ld19rZXkgPSBuZXdfYmxvY2sua2V5O1xuICAgICAgICBjb25zdCBvbGRfa2V5ID0gb2xkX2Jsb2NrLmtleTtcbiAgICAgICAgaWYgKG5ld19ibG9jayA9PT0gb2xkX2Jsb2NrKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICBuZXh0ID0gbmV3X2Jsb2NrLmZpcnN0O1xuICAgICAgICAgICAgby0tO1xuICAgICAgICAgICAgbi0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBibG9ja1xuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWxvb2t1cC5oYXMobmV3X2tleSkgfHwgd2lsbF9tb3ZlLmhhcyhuZXdfa2V5KSkge1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGlkX21vdmUuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVsdGFzLmdldChuZXdfa2V5KSA+IGRlbHRhcy5nZXQob2xkX2tleSkpIHtcbiAgICAgICAgICAgIGRpZF9tb3ZlLmFkZChuZXdfa2V5KTtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lsbF9tb3ZlLmFkZChvbGRfa2V5KTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAoby0tKSB7XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3Nbb107XG4gICAgICAgIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2Jsb2NrLmtleSkpXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICB9XG4gICAgd2hpbGUgKG4pXG4gICAgICAgIGluc2VydChuZXdfYmxvY2tzW24gLSAxXSk7XG4gICAgcmV0dXJuIG5ld19ibG9ja3M7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2tleXMoY3R4LCBsaXN0LCBnZXRfY29udGV4dCwgZ2V0X2tleSkge1xuICAgIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldF9rZXkoZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKSk7XG4gICAgICAgIGlmIChrZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBoYXZlIGR1cGxpY2F0ZSBrZXlzIGluIGEga2V5ZWQgZWFjaCcpO1xuICAgICAgICB9XG4gICAgICAgIGtleXMuYWRkKGtleSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRfc3ByZWFkX3VwZGF0ZShsZXZlbHMsIHVwZGF0ZXMpIHtcbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcbiAgICBjb25zdCB0b19udWxsX291dCA9IHt9O1xuICAgIGNvbnN0IGFjY291bnRlZF9mb3IgPSB7ICQkc2NvcGU6IDEgfTtcbiAgICBsZXQgaSA9IGxldmVscy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBvID0gbGV2ZWxzW2ldO1xuICAgICAgICBjb25zdCBuID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbikpXG4gICAgICAgICAgICAgICAgICAgIHRvX251bGxfb3V0W2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgICAgICAgIGlmICghYWNjb3VudGVkX2ZvcltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gbltrZXldO1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldmVsc1tpXSA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0b19udWxsX291dCkge1xuICAgICAgICBpZiAoIShrZXkgaW4gdXBkYXRlKSlcbiAgICAgICAgICAgIHVwZGF0ZVtrZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlO1xufVxuZnVuY3Rpb24gZ2V0X3NwcmVhZF9vYmplY3Qoc3ByZWFkX3Byb3BzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzcHJlYWRfcHJvcHMgPT09ICdvYmplY3QnICYmIHNwcmVhZF9wcm9wcyAhPT0gbnVsbCA/IHNwcmVhZF9wcm9wcyA6IHt9O1xufVxuXG4vLyBzb3VyY2U6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbFxuY29uc3QgYm9vbGVhbl9hdHRyaWJ1dGVzID0gbmV3IFNldChbXG4gICAgJ2FsbG93ZnVsbHNjcmVlbicsXG4gICAgJ2FsbG93cGF5bWVudHJlcXVlc3QnLFxuICAgICdhc3luYycsXG4gICAgJ2F1dG9mb2N1cycsXG4gICAgJ2F1dG9wbGF5JyxcbiAgICAnY2hlY2tlZCcsXG4gICAgJ2NvbnRyb2xzJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlZmVyJyxcbiAgICAnZGlzYWJsZWQnLFxuICAgICdmb3Jtbm92YWxpZGF0ZScsXG4gICAgJ2hpZGRlbicsXG4gICAgJ2lzbWFwJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG5jb25zdCBpbnZhbGlkX2F0dHJpYnV0ZV9uYW1lX2NoYXJhY3RlciA9IC9bXFxzJ1wiPi89XFx1e0ZERDB9LVxcdXtGREVGfVxcdXtGRkZFfVxcdXtGRkZGfVxcdXsxRkZGRX1cXHV7MUZGRkZ9XFx1ezJGRkZFfVxcdXsyRkZGRn1cXHV7M0ZGRkV9XFx1ezNGRkZGfVxcdXs0RkZGRX1cXHV7NEZGRkZ9XFx1ezVGRkZFfVxcdXs1RkZGRn1cXHV7NkZGRkV9XFx1ezZGRkZGfVxcdXs3RkZGRX1cXHV7N0ZGRkZ9XFx1ezhGRkZFfVxcdXs4RkZGRn1cXHV7OUZGRkV9XFx1ezlGRkZGfVxcdXtBRkZGRX1cXHV7QUZGRkZ9XFx1e0JGRkZFfVxcdXtCRkZGRn1cXHV7Q0ZGRkV9XFx1e0NGRkZGfVxcdXtERkZGRX1cXHV7REZGRkZ9XFx1e0VGRkZFfVxcdXtFRkZGRn1cXHV7RkZGRkV9XFx1e0ZGRkZGfVxcdXsxMEZGRkV9XFx1ezEwRkZGRn1dL3U7XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9zeW50YXguaHRtbCNhdHRyaWJ1dGVzLTJcbi8vIGh0dHBzOi8vaW5mcmEuc3BlYy53aGF0d2cub3JnLyNub25jaGFyYWN0ZXJcbmZ1bmN0aW9uIHNwcmVhZChhcmdzLCBjbGFzc2VzX3RvX2FkZCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKHt9LCAuLi5hcmdzKTtcbiAgICBpZiAoY2xhc3Nlc190b19hZGQpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyA9IGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cmlidXRlcy5jbGFzcyArPSAnICcgKyBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RyID0gJyc7XG4gICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgaWYgKGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLnRlc3QobmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKVxuICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIGVsc2UgaWYgKGJvb2xlYW5fYXR0cmlidXRlcy5oYXMobmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHN0ciArPSAnICcgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBgICR7bmFtZX09XCIke1N0cmluZyh2YWx1ZSkucmVwbGFjZSgvXCIvZywgJyYjMzQ7JykucmVwbGFjZSgvJy9nLCAnJiMzOTsnKX1cImA7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgZXNjYXBlZCA9IHtcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5mdW5jdGlvbiBlc2NhcGUoaHRtbCkge1xuICAgIHJldHVybiBTdHJpbmcoaHRtbCkucmVwbGFjZSgvW1wiJyY8Pl0vZywgbWF0Y2ggPT4gZXNjYXBlZFttYXRjaF0pO1xufVxuZnVuY3Rpb24gZWFjaChpdGVtcywgZm4pIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBzdHIgKz0gZm4oaXRlbXNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuY29uc3QgbWlzc2luZ19jb21wb25lbnQgPSB7XG4gICAgJCRyZW5kZXI6ICgpID0+ICcnXG59O1xuZnVuY3Rpb24gdmFsaWRhdGVfY29tcG9uZW50KGNvbXBvbmVudCwgbmFtZSkge1xuICAgIGlmICghY29tcG9uZW50IHx8ICFjb21wb25lbnQuJCRyZW5kZXIpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdzdmVsdGU6Y29tcG9uZW50JylcbiAgICAgICAgICAgIG5hbWUgKz0gJyB0aGlzPXsuLi59JztcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGA8JHtuYW1lfT4gaXMgbm90IGEgdmFsaWQgU1NSIGNvbXBvbmVudC4gWW91IG1heSBuZWVkIHRvIHJldmlldyB5b3VyIGJ1aWxkIGNvbmZpZyB0byBlbnN1cmUgdGhhdCBkZXBlbmRlbmNpZXMgYXJlIGNvbXBpbGVkLCByYXRoZXIgdGhhbiBpbXBvcnRlZCBhcyBwcmUtY29tcGlsZWQgbW9kdWxlc2ApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cykge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgICAgIC8vIHRoZXNlIHdpbGwgYmUgaW1tZWRpYXRlbHkgZGlzY2FyZGVkXG4gICAgICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBjYWxsYmFja3M6IGJsYW5rX29iamVjdCgpXG4gICAgICAgIH07XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudCh7ICQkIH0pO1xuICAgICAgICBjb25zdCBodG1sID0gZm4ocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyOiAocHJvcHMgPSB7fSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgICAgICAgICBvbl9kZXN0cm95ID0gW107XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IHRpdGxlOiAnJywgaGVhZDogJycsIGNzczogbmV3IFNldCgpIH07XG4gICAgICAgICAgICBjb25zdCBodG1sID0gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywge30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgcnVuX2FsbChvbl9kZXN0cm95KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogQXJyYXkuZnJvbShyZXN1bHQuY3NzKS5tYXAoY3NzID0+IGNzcy5jb2RlKS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBudWxsIC8vIFRPRE9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWQ6IHJlc3VsdC50aXRsZSArIHJlc3VsdC5oZWFkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAkJHJlbmRlclxuICAgIH07XG59XG5mdW5jdGlvbiBhZGRfYXR0cmlidXRlKG5hbWUsIHZhbHVlLCBib29sZWFuKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwgfHwgKGJvb2xlYW4gJiYgIXZhbHVlKSlcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIHJldHVybiBgICR7bmFtZX0ke3ZhbHVlID09PSB0cnVlID8gJycgOiBgPSR7dHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KGVzY2FwZSh2YWx1ZSkpIDogYFwiJHt2YWx1ZX1cImB9YH1gO1xufVxuZnVuY3Rpb24gYWRkX2NsYXNzZXMoY2xhc3Nlcykge1xuICAgIHJldHVybiBjbGFzc2VzID8gYCBjbGFzcz1cIiR7Y2xhc3Nlc31cImAgOiAnJztcbn1cblxuZnVuY3Rpb24gYmluZChjb21wb25lbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaW5kZXggPSBjb21wb25lbnQuJCQucHJvcHNbbmFtZV07XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50LiQkLmJvdW5kW2luZGV4XSA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnQuJCQuY3R4W2luZGV4XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlX2NvbXBvbmVudChibG9jaykge1xuICAgIGJsb2NrICYmIGJsb2NrLmMoKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2NvbXBvbmVudChibG9jaywgcGFyZW50X25vZGVzKSB7XG4gICAgYmxvY2sgJiYgYmxvY2subChwYXJlbnRfbm9kZXMpO1xufVxuZnVuY3Rpb24gbW91bnRfY29tcG9uZW50KGNvbXBvbmVudCwgdGFyZ2V0LCBhbmNob3IpIHtcbiAgICBjb25zdCB7IGZyYWdtZW50LCBvbl9tb3VudCwgb25fZGVzdHJveSwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgLy8gb25Nb3VudCBoYXBwZW5zIGJlZm9yZSB0aGUgaW5pdGlhbCBhZnRlclVwZGF0ZVxuICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IG9uX21vdW50Lm1hcChydW4pLmZpbHRlcihpc19mdW5jdGlvbik7XG4gICAgICAgIGlmIChvbl9kZXN0cm95KSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LnB1c2goLi4ubmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRWRnZSBjYXNlIC0gY29tcG9uZW50IHdhcyBkZXN0cm95ZWQgaW1tZWRpYXRlbHksXG4gICAgICAgICAgICAvLyBtb3N0IGxpa2VseSBhcyBhIHJlc3VsdCBvZiBhIGJpbmRpbmcgaW5pdGlhbGlzaW5nXG4gICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQuJCQub25fbW91bnQgPSBbXTtcbiAgICB9KTtcbiAgICBhZnRlcl91cGRhdGUuZm9yRWFjaChhZGRfcmVuZGVyX2NhbGxiYWNrKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfY29tcG9uZW50KGNvbXBvbmVudCwgZGV0YWNoaW5nKSB7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQ7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHJ1bl9hbGwoJCQub25fZGVzdHJveSk7XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LmQoZGV0YWNoaW5nKTtcbiAgICAgICAgLy8gVE9ETyBudWxsIG91dCBvdGhlciByZWZzLCBpbmNsdWRpbmcgY29tcG9uZW50LiQkIChidXQgbmVlZCB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBmaW5hbCBzdGF0ZT8pXG4gICAgICAgICQkLm9uX2Rlc3Ryb3kgPSAkJC5mcmFnbWVudCA9IG51bGw7XG4gICAgICAgICQkLmN0eCA9IFtdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKSB7XG4gICAgaWYgKGNvbXBvbmVudC4kJC5kaXJ0eVswXSA9PT0gLTEpIHtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgICAgICBjb21wb25lbnQuJCQuZGlydHkuZmlsbCgwKTtcbiAgICB9XG4gICAgY29tcG9uZW50LiQkLmRpcnR5WyhpIC8gMzEpIHwgMF0gfD0gKDEgPDwgKGkgJSAzMSkpO1xufVxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMsIGluc3RhbmNlLCBjcmVhdGVfZnJhZ21lbnQsIG5vdF9lcXVhbCwgcHJvcHMsIGRpcnR5ID0gWy0xXSkge1xuICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICBjb25zdCBwcm9wX3ZhbHVlcyA9IG9wdGlvbnMucHJvcHMgfHwge307XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IG51bGwsXG4gICAgICAgIC8vIHN0YXRlXG4gICAgICAgIHByb3BzLFxuICAgICAgICB1cGRhdGU6IG5vb3AsXG4gICAgICAgIG5vdF9lcXVhbCxcbiAgICAgICAgYm91bmQ6IGJsYW5rX29iamVjdCgpLFxuICAgICAgICAvLyBsaWZlY3ljbGVcbiAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICBvbl9kZXN0cm95OiBbXSxcbiAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgIGFmdGVyX3VwZGF0ZTogW10sXG4gICAgICAgIGNvbnRleHQ6IG5ldyBNYXAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSxcbiAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIGRpcnR5LFxuICAgICAgICBza2lwX2JvdW5kOiBmYWxzZVxuICAgIH07XG4gICAgbGV0IHJlYWR5ID0gZmFsc2U7XG4gICAgJCQuY3R4ID0gaW5zdGFuY2VcbiAgICAgICAgPyBpbnN0YW5jZShjb21wb25lbnQsIHByb3BfdmFsdWVzLCAoaSwgcmV0LCAuLi5yZXN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJlc3QubGVuZ3RoID8gcmVzdFswXSA6IHJldDtcbiAgICAgICAgICAgIGlmICgkJC5jdHggJiYgbm90X2VxdWFsKCQkLmN0eFtpXSwgJCQuY3R4W2ldID0gdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkJC5za2lwX2JvdW5kICYmICQkLmJvdW5kW2ldKVxuICAgICAgICAgICAgICAgICAgICAkJC5ib3VuZFtpXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KVxuICAgICAgICAgICAgICAgICAgICBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9KVxuICAgICAgICA6IFtdO1xuICAgICQkLnVwZGF0ZSgpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgIC8vIGBmYWxzZWAgYXMgYSBzcGVjaWFsIGNhc2Ugb2Ygbm8gRE9NIGNvbXBvbmVudFxuICAgICQkLmZyYWdtZW50ID0gY3JlYXRlX2ZyYWdtZW50ID8gY3JlYXRlX2ZyYWdtZW50KCQkLmN0eCkgOiBmYWxzZTtcbiAgICBpZiAob3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaHlkcmF0ZSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBjaGlsZHJlbihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChub2Rlcyk7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGRldGFjaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IpO1xuICAgICAgICBmbHVzaCgpO1xuICAgIH1cbiAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG59XG5sZXQgU3ZlbHRlRWxlbWVudDtcbmlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBTdmVsdGVFbGVtZW50ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gfHwgKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdID0gW10pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuJCRzZXQgJiYgIWlzX2VtcHR5KCQkcHJvcHMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICB9XG4gICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgICRzZXQoJCRwcm9wcykge1xuICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLiQkc2V0KCQkcHJvcHMpO1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoX2Rldih0eXBlLCBkZXRhaWwpIHtcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudCh0eXBlLCBPYmplY3QuYXNzaWduKHsgdmVyc2lvbjogJzMuMjkuNycgfSwgZGV0YWlsKSkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0X2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnQodGFyZ2V0LCBub2RlLCBhbmNob3IpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2Rldihub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmUnLCB7IG5vZGUgfSk7XG4gICAgZGV0YWNoKG5vZGUpO1xufVxuZnVuY3Rpb24gZGV0YWNoX2JldHdlZW5fZGV2KGJlZm9yZSwgYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9iZWZvcmVfZGV2KGFmdGVyKSB7XG4gICAgd2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGFmdGVyLnByZXZpb3VzU2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2FmdGVyX2RldihiZWZvcmUpIHtcbiAgICB3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBsaXN0ZW5fZGV2KG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zLCBoYXNfcHJldmVudF9kZWZhdWx0LCBoYXNfc3RvcF9wcm9wYWdhdGlvbikge1xuICAgIGNvbnN0IG1vZGlmaWVycyA9IG9wdGlvbnMgPT09IHRydWUgPyBbJ2NhcHR1cmUnXSA6IG9wdGlvbnMgPyBBcnJheS5mcm9tKE9iamVjdC5rZXlzKG9wdGlvbnMpKSA6IFtdO1xuICAgIGlmIChoYXNfcHJldmVudF9kZWZhdWx0KVxuICAgICAgICBtb2RpZmllcnMucHVzaCgncHJldmVudERlZmF1bHQnKTtcbiAgICBpZiAoaGFzX3N0b3BfcHJvcGFnYXRpb24pXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdzdG9wUHJvcGFnYXRpb24nKTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUFkZEV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgY29uc3QgZGlzcG9zZSA9IGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHJfZGV2KG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBwcm9wX2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0UHJvcGVydHknLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIGRhdGFzZXRfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGUuZGF0YXNldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGFzZXQnLCB7IG5vZGUsIHByb3BlcnR5LCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhX2Rldih0ZXh0LCBkYXRhKSB7XG4gICAgZGF0YSA9ICcnICsgZGF0YTtcbiAgICBpZiAodGV4dC53aG9sZVRleHQgPT09IGRhdGEpXG4gICAgICAgIHJldHVybjtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldERhdGEnLCB7IG5vZGU6IHRleHQsIGRhdGEgfSk7XG4gICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnICYmICEoYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmICdsZW5ndGgnIGluIGFyZykpIHtcbiAgICAgICAgbGV0IG1zZyA9ICd7I2VhY2h9IG9ubHkgaXRlcmF0ZXMgb3ZlciBhcnJheS1saWtlIG9iamVjdHMuJztcbiAgICAgICAgaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgYXJnICYmIFN5bWJvbC5pdGVyYXRvciBpbiBhcmcpIHtcbiAgICAgICAgICAgIG1zZyArPSAnIFlvdSBjYW4gdXNlIGEgc3ByZWFkIHRvIGNvbnZlcnQgdGhpcyBpdGVyYWJsZSBpbnRvIGFuIGFycmF5Lic7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVfc2xvdHMobmFtZSwgc2xvdCwga2V5cykge1xuICAgIGZvciAoY29uc3Qgc2xvdF9rZXkgb2YgT2JqZWN0LmtleXMoc2xvdCkpIHtcbiAgICAgICAgaWYgKCF+a2V5cy5pbmRleE9mKHNsb3Rfa2V5KSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGA8JHtuYW1lfT4gcmVjZWl2ZWQgYW4gdW5leHBlY3RlZCBzbG90IFwiJHtzbG90X2tleX1cIi5gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIid0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbiAgICAkY2FwdHVyZV9zdGF0ZSgpIHsgfVxuICAgICRpbmplY3Rfc3RhdGUoKSB7IH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSBsb29wIGRldGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlRWxlbWVudCwgYWN0aW9uX2Rlc3Ryb3llciwgYWRkX2F0dHJpYnV0ZSwgYWRkX2NsYXNzZXMsIGFkZF9mbHVzaF9jYWxsYmFjaywgYWRkX2xvY2F0aW9uLCBhZGRfcmVuZGVyX2NhbGxiYWNrLCBhZGRfcmVzaXplX2xpc3RlbmVyLCBhZGRfdHJhbnNmb3JtLCBhZnRlclVwZGF0ZSwgYXBwZW5kLCBhcHBlbmRfZGV2LCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9zcGFjZSwgY2xhaW1fdGV4dCwgY2xlYXJfbG9vcHMsIGNvbXBvbmVudF9zdWJzY3JpYmUsIGNvbXB1dGVfcmVzdF9wcm9wcywgY29tcHV0ZV9zbG90cywgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBjcmVhdGVfYW5pbWF0aW9uLCBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uLCBjcmVhdGVfY29tcG9uZW50LCBjcmVhdGVfaW5fdHJhbnNpdGlvbiwgY3JlYXRlX291dF90cmFuc2l0aW9uLCBjcmVhdGVfc2xvdCwgY3JlYXRlX3Nzcl9jb21wb25lbnQsIGN1cnJlbnRfY29tcG9uZW50LCBjdXN0b21fZXZlbnQsIGRhdGFzZXRfZGV2LCBkZWJ1ZywgZGVzdHJveV9ibG9jaywgZGVzdHJveV9jb21wb25lbnQsIGRlc3Ryb3lfZWFjaCwgZGV0YWNoLCBkZXRhY2hfYWZ0ZXJfZGV2LCBkZXRhY2hfYmVmb3JlX2RldiwgZGV0YWNoX2JldHdlZW5fZGV2LCBkZXRhY2hfZGV2LCBkaXJ0eV9jb21wb25lbnRzLCBkaXNwYXRjaF9kZXYsIGVhY2gsIGVsZW1lbnQsIGVsZW1lbnRfaXMsIGVtcHR5LCBlc2NhcGUsIGVzY2FwZWQsIGV4Y2x1ZGVfaW50ZXJuYWxfcHJvcHMsIGZpeF9hbmRfZGVzdHJveV9ibG9jaywgZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jaywgZml4X3Bvc2l0aW9uLCBmbHVzaCwgZ2V0Q29udGV4dCwgZ2V0X2JpbmRpbmdfZ3JvdXBfdmFsdWUsIGdldF9jdXJyZW50X2NvbXBvbmVudCwgZ2V0X2N1c3RvbV9lbGVtZW50c19zbG90cywgZ2V0X3Nsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dCwgZ2V0X3NwcmVhZF9vYmplY3QsIGdldF9zcHJlYWRfdXBkYXRlLCBnZXRfc3RvcmVfdmFsdWUsIGdsb2JhbHMsIGdyb3VwX291dHJvcywgaGFuZGxlX3Byb21pc2UsIGhhc19wcm9wLCBpZGVudGl0eSwgaW5pdCwgaW5zZXJ0LCBpbnNlcnRfZGV2LCBpbnRyb3MsIGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyLCBpc19jbGllbnQsIGlzX2Nyb3Nzb3JpZ2luLCBpc19lbXB0eSwgaXNfZnVuY3Rpb24sIGlzX3Byb21pc2UsIGxpc3RlbiwgbGlzdGVuX2RldiwgbG9vcCwgbG9vcF9ndWFyZCwgbWlzc2luZ19jb21wb25lbnQsIG1vdW50X2NvbXBvbmVudCwgbm9vcCwgbm90X2VxdWFsLCBub3csIG51bGxfdG9fZW1wdHksIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMsIG9uRGVzdHJveSwgb25Nb3VudCwgb25jZSwgb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2ssIHByZXZlbnRfZGVmYXVsdCwgcHJvcF9kZXYsIHF1ZXJ5X3NlbGVjdG9yX2FsbCwgcmFmLCBydW4sIHJ1bl9hbGwsIHNhZmVfbm90X2VxdWFsLCBzY2hlZHVsZV91cGRhdGUsIHNlbGVjdF9tdWx0aXBsZV92YWx1ZSwgc2VsZWN0X29wdGlvbiwgc2VsZWN0X29wdGlvbnMsIHNlbGVjdF92YWx1ZSwgc2VsZiwgc2V0Q29udGV4dCwgc2V0X2F0dHJpYnV0ZXMsIHNldF9jdXJyZW50X2NvbXBvbmVudCwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEsIHNldF9kYXRhLCBzZXRfZGF0YV9kZXYsIHNldF9pbnB1dF90eXBlLCBzZXRfaW5wdXRfdmFsdWUsIHNldF9ub3csIHNldF9yYWYsIHNldF9zdG9yZV92YWx1ZSwgc2V0X3N0eWxlLCBzZXRfc3ZnX2F0dHJpYnV0ZXMsIHNwYWNlLCBzcHJlYWQsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50LCB2YWxpZGF0ZV9lYWNoX2tleXMsIHZhbGlkYXRlX3Nsb3RzLCB2YWxpZGF0ZV9zdG9yZSwgeGxpbmtfYXR0ciB9O1xuIiwiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCB0eXBlID0gJydcbiAgZXhwb3J0IGxldCBwYWNrID0gJ2ZhcydcbiAgZXhwb3J0IGxldCBpY29uXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG4gIGV4cG9ydCBsZXQgY3VzdG9tQ2xhc3MgPSAnJ1xuICBleHBvcnQgbGV0IGN1c3RvbVNpemUgPSAnJ1xuICBleHBvcnQgbGV0IGlzQ2xpY2thYmxlID0gZmFsc2VcbiAgZXhwb3J0IGxldCBpc0xlZnQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzUmlnaHQgPSBmYWxzZVxuXG4gIGxldCBuZXdDdXN0b21TaXplID0gJydcbiAgbGV0IG5ld1R5cGUgPSAnJ1xuXG4gICQ6IG5ld1BhY2sgPSBwYWNrIHx8ICdmYXMnXG5cbiAgJDoge1xuICAgIGlmIChjdXN0b21TaXplKSBuZXdDdXN0b21TaXplID0gY3VzdG9tU2l6ZVxuICAgIGVsc2Uge1xuICAgICAgc3dpdGNoIChzaXplKSB7XG4gICAgICAgIGNhc2UgJ2lzLXNtYWxsJzpcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpcy1tZWRpdW0nOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtbGcnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaXMtbGFyZ2UnOlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnZmEtM3gnXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBuZXdDdXN0b21TaXplID0gJydcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAkOiB7XG4gICAgaWYgKCF0eXBlKSBuZXdUeXBlID0gJydcbiAgICBsZXQgc3BsaXRUeXBlID0gW11cbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBzcGxpdFR5cGUgPSB0eXBlLnNwbGl0KCctJylcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQga2V5IGluIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVba2V5XSkge1xuICAgICAgICAgIHNwbGl0VHlwZSA9IGtleS5zcGxpdCgnLScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3BsaXRUeXBlLmxlbmd0aCA8PSAxKSBuZXdUeXBlID0gJydcbiAgICBlbHNlIG5ld1R5cGUgPSBgaGFzLXRleHQtJHtzcGxpdFR5cGVbMV19YFxuICB9XG48L3NjcmlwdD5cblxuPHNwYW4gY2xhc3M9XCJpY29uIHtzaXplfSB7bmV3VHlwZX0geyhpc0xlZnQgJiYgJ2lzLWxlZnQnKSB8fCAnJ30geyhpc1JpZ2h0ICYmICdpcy1yaWdodCcpIHx8ICcnfVwiIGNsYXNzOmlzLWNsaWNrYWJsZT17aXNDbGlja2FibGV9IG9uOmNsaWNrPlxuICA8aSBjbGFzcz1cIntuZXdQYWNrfSBmYS17aWNvbn0ge2N1c3RvbUNsYXNzfSB7bmV3Q3VzdG9tU2l6ZX1cIiAvPlxuPC9zcGFuPlxuIiwiaW1wb3J0IHsgbm9vcCwgc2FmZV9ub3RfZXF1YWwsIHN1YnNjcmliZSwgcnVuX2FsbCwgaXNfZnVuY3Rpb24gfSBmcm9tICcuLi9pbnRlcm5hbC9pbmRleC5tanMnO1xuZXhwb3J0IHsgZ2V0X3N0b3JlX3ZhbHVlIGFzIGdldCB9IGZyb20gJy4uL2ludGVybmFsL2luZGV4Lm1qcyc7XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0gdmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcn1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmxlKHZhbHVlLCBzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogd3JpdGFibGUodmFsdWUsIHN0YXJ0KS5zdWJzY3JpYmVcbiAgICB9O1xufVxuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUpIHtcbiAgICAgICAgaWYgKHNhZmVfbm90X2VxdWFsKHZhbHVlLCBuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgICAgIGlmIChzdG9wKSB7IC8vIHN0b3JlIGlzIHJlYWR5XG4gICAgICAgICAgICAgICAgY29uc3QgcnVuX3F1ZXVlID0gIXN1YnNjcmliZXJfcXVldWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBzWzFdKCk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUucHVzaChzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChydW5fcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlW2ldWzBdKHN1YnNjcmliZXJfcXVldWVbaSArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmbikge1xuICAgICAgICBzZXQoZm4odmFsdWUpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKHJ1biwgaW52YWxpZGF0ZSA9IG5vb3ApIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9IFtydW4sIGludmFsaWRhdGVdO1xuICAgICAgICBzdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQoc2V0KSB8fCBub29wO1xuICAgICAgICB9XG4gICAgICAgIHJ1bih2YWx1ZSk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHN1YnNjcmliZXJzLmluZGV4T2Yoc3Vic2NyaWJlcik7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cbmZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuICAgIGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG4gICAgY29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlXG4gICAgICAgID8gW3N0b3Jlc11cbiAgICAgICAgOiBzdG9yZXM7XG4gICAgY29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG4gICAgcmV0dXJuIHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIChzZXQpID0+IHtcbiAgICAgICAgbGV0IGluaXRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgbGV0IHBlbmRpbmcgPSAwO1xuICAgICAgICBsZXQgY2xlYW51cCA9IG5vb3A7XG4gICAgICAgIGNvbnN0IHN5bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0KTtcbiAgICAgICAgICAgIGlmIChhdXRvKSB7XG4gICAgICAgICAgICAgICAgc2V0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcnMgPSBzdG9yZXNfYXJyYXkubWFwKChzdG9yZSwgaSkgPT4gc3Vic2NyaWJlKHN0b3JlLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICAgICAgcGVuZGluZyAmPSB+KDEgPDwgaSk7XG4gICAgICAgICAgICBpZiAoaW5pdGVkKSB7XG4gICAgICAgICAgICAgICAgc3luYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBwZW5kaW5nIHw9ICgxIDw8IGkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGluaXRlZCA9IHRydWU7XG4gICAgICAgIHN5bmMoKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBkZXJpdmVkLCByZWFkYWJsZSwgd3JpdGFibGUgfTtcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnLi4vc3RvcmUvaW5kZXgubWpzJztcbmltcG9ydCB7IG5vdywgbG9vcCwgYXNzaWduIH0gZnJvbSAnLi4vaW50ZXJuYWwvaW5kZXgubWpzJztcbmltcG9ydCB7IGxpbmVhciB9IGZyb20gJy4uL2Vhc2luZy9pbmRleC5tanMnO1xuXG5mdW5jdGlvbiBpc19kYXRlKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiB0aWNrX3NwcmluZyhjdHgsIGxhc3RfdmFsdWUsIGN1cnJlbnRfdmFsdWUsIHRhcmdldF92YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgY3VycmVudF92YWx1ZSA9PT0gJ251bWJlcicgfHwgaXNfZGF0ZShjdXJyZW50X3ZhbHVlKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGRlbHRhID0gdGFyZ2V0X3ZhbHVlIC0gY3VycmVudF92YWx1ZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB2ZWxvY2l0eSA9IChjdXJyZW50X3ZhbHVlIC0gbGFzdF92YWx1ZSkgLyAoY3R4LmR0IHx8IDEgLyA2MCk7IC8vIGd1YXJkIGRpdiBieSAwXG4gICAgICAgIGNvbnN0IHNwcmluZyA9IGN0eC5vcHRzLnN0aWZmbmVzcyAqIGRlbHRhO1xuICAgICAgICBjb25zdCBkYW1wZXIgPSBjdHgub3B0cy5kYW1waW5nICogdmVsb2NpdHk7XG4gICAgICAgIGNvbnN0IGFjY2VsZXJhdGlvbiA9IChzcHJpbmcgLSBkYW1wZXIpICogY3R4Lmludl9tYXNzO1xuICAgICAgICBjb25zdCBkID0gKHZlbG9jaXR5ICsgYWNjZWxlcmF0aW9uKSAqIGN0eC5kdDtcbiAgICAgICAgaWYgKE1hdGguYWJzKGQpIDwgY3R4Lm9wdHMucHJlY2lzaW9uICYmIE1hdGguYWJzKGRlbHRhKSA8IGN0eC5vcHRzLnByZWNpc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldF92YWx1ZTsgLy8gc2V0dGxlZFxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY3R4LnNldHRsZWQgPSBmYWxzZTsgLy8gc2lnbmFsIGxvb3AgdG8ga2VlcCB0aWNraW5nXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByZXR1cm4gaXNfZGF0ZShjdXJyZW50X3ZhbHVlKSA/XG4gICAgICAgICAgICAgICAgbmV3IERhdGUoY3VycmVudF92YWx1ZS5nZXRUaW1lKCkgKyBkKSA6IGN1cnJlbnRfdmFsdWUgKyBkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudF92YWx1ZSkpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gY3VycmVudF92YWx1ZS5tYXAoKF8sIGkpID0+IHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZVtpXSwgY3VycmVudF92YWx1ZVtpXSwgdGFyZ2V0X3ZhbHVlW2ldKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBjdXJyZW50X3ZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCBuZXh0X3ZhbHVlID0ge307XG4gICAgICAgIGZvciAoY29uc3QgayBpbiBjdXJyZW50X3ZhbHVlKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBuZXh0X3ZhbHVlW2tdID0gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2tdLCBjdXJyZW50X3ZhbHVlW2tdLCB0YXJnZXRfdmFsdWVba10pO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIG5leHRfdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzcHJpbmcgJHt0eXBlb2YgY3VycmVudF92YWx1ZX0gdmFsdWVzYCk7XG4gICAgfVxufVxuZnVuY3Rpb24gc3ByaW5nKHZhbHVlLCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBzdG9yZSA9IHdyaXRhYmxlKHZhbHVlKTtcbiAgICBjb25zdCB7IHN0aWZmbmVzcyA9IDAuMTUsIGRhbXBpbmcgPSAwLjgsIHByZWNpc2lvbiA9IDAuMDEgfSA9IG9wdHM7XG4gICAgbGV0IGxhc3RfdGltZTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgY3VycmVudF90b2tlbjtcbiAgICBsZXQgbGFzdF92YWx1ZSA9IHZhbHVlO1xuICAgIGxldCB0YXJnZXRfdmFsdWUgPSB2YWx1ZTtcbiAgICBsZXQgaW52X21hc3MgPSAxO1xuICAgIGxldCBpbnZfbWFzc19yZWNvdmVyeV9yYXRlID0gMDtcbiAgICBsZXQgY2FuY2VsX3Rhc2sgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlLCBvcHRzID0ge30pIHtcbiAgICAgICAgdGFyZ2V0X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICBjb25zdCB0b2tlbiA9IGN1cnJlbnRfdG9rZW4gPSB7fTtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgfHwgb3B0cy5oYXJkIHx8IChzcHJpbmcuc3RpZmZuZXNzID49IDEgJiYgc3ByaW5nLmRhbXBpbmcgPj0gMSkpIHtcbiAgICAgICAgICAgIGNhbmNlbF90YXNrID0gdHJ1ZTsgLy8gY2FuY2VsIGFueSBydW5uaW5nIGFuaW1hdGlvblxuICAgICAgICAgICAgbGFzdF90aW1lID0gbm93KCk7XG4gICAgICAgICAgICBsYXN0X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gdGFyZ2V0X3ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRzLnNvZnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhdGUgPSBvcHRzLnNvZnQgPT09IHRydWUgPyAuNSA6ICtvcHRzLnNvZnQ7XG4gICAgICAgICAgICBpbnZfbWFzc19yZWNvdmVyeV9yYXRlID0gMSAvIChyYXRlICogNjApO1xuICAgICAgICAgICAgaW52X21hc3MgPSAwOyAvLyBpbmZpbml0ZSBtYXNzLCB1bmFmZmVjdGVkIGJ5IHNwcmluZyBmb3JjZXNcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2spIHtcbiAgICAgICAgICAgIGxhc3RfdGltZSA9IG5vdygpO1xuICAgICAgICAgICAgY2FuY2VsX3Rhc2sgPSBmYWxzZTtcbiAgICAgICAgICAgIHRhc2sgPSBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbmNlbF90YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbF90YXNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRhc2sgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGludl9tYXNzID0gTWF0aC5taW4oaW52X21hc3MgKyBpbnZfbWFzc19yZWNvdmVyeV9yYXRlLCAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdHggPSB7XG4gICAgICAgICAgICAgICAgICAgIGludl9tYXNzLFxuICAgICAgICAgICAgICAgICAgICBvcHRzOiBzcHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIHNldHRsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGR0OiAobm93IC0gbGFzdF90aW1lKSAqIDYwIC8gMTAwMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dF92YWx1ZSA9IHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZSwgdmFsdWUsIHRhcmdldF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgbGFzdF90aW1lID0gbm93O1xuICAgICAgICAgICAgICAgIGxhc3RfdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBuZXh0X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoY3R4LnNldHRsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhY3R4LnNldHRsZWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVsZmlsID0+IHtcbiAgICAgICAgICAgIHRhc2sucHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4gPT09IGN1cnJlbnRfdG9rZW4pXG4gICAgICAgICAgICAgICAgICAgIGZ1bGZpbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBzcHJpbmcgPSB7XG4gICAgICAgIHNldCxcbiAgICAgICAgdXBkYXRlOiAoZm4sIG9wdHMpID0+IHNldChmbih0YXJnZXRfdmFsdWUsIHZhbHVlKSwgb3B0cyksXG4gICAgICAgIHN1YnNjcmliZTogc3RvcmUuc3Vic2NyaWJlLFxuICAgICAgICBzdGlmZm5lc3MsXG4gICAgICAgIGRhbXBpbmcsXG4gICAgICAgIHByZWNpc2lvblxuICAgIH07XG4gICAgcmV0dXJuIHNwcmluZztcbn1cblxuZnVuY3Rpb24gZ2V0X2ludGVycG9sYXRvcihhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIgfHwgYSAhPT0gYSlcbiAgICAgICAgcmV0dXJuICgpID0+IGE7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBhO1xuICAgIGlmICh0eXBlICE9PSB0eXBlb2YgYiB8fCBBcnJheS5pc0FycmF5KGEpICE9PSBBcnJheS5pc0FycmF5KGIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGludGVycG9sYXRlIHZhbHVlcyBvZiBkaWZmZXJlbnQgdHlwZScpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICBjb25zdCBhcnIgPSBiLm1hcCgoYmksIGkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBnZXRfaW50ZXJwb2xhdG9yKGFbaV0sIGJpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ID0+IGFyci5tYXAoZm4gPT4gZm4odCkpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKCFhIHx8ICFiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPYmplY3QgY2Fubm90IGJlIG51bGwnKTtcbiAgICAgICAgaWYgKGlzX2RhdGUoYSkgJiYgaXNfZGF0ZShiKSkge1xuICAgICAgICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBiIC0gYTtcbiAgICAgICAgICAgIHJldHVybiB0ID0+IG5ldyBEYXRlKGEgKyB0ICogZGVsdGEpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhiKTtcbiAgICAgICAgY29uc3QgaW50ZXJwb2xhdG9ycyA9IHt9O1xuICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIGludGVycG9sYXRvcnNba2V5XSA9IGdldF9pbnRlcnBvbGF0b3IoYVtrZXldLCBiW2tleV0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHQgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IGludGVycG9sYXRvcnNba2V5XSh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYiAtIGE7XG4gICAgICAgIHJldHVybiB0ID0+IGEgKyB0ICogZGVsdGE7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGludGVycG9sYXRlICR7dHlwZX0gdmFsdWVzYCk7XG59XG5mdW5jdGlvbiB0d2VlbmVkKHZhbHVlLCBkZWZhdWx0cyA9IHt9KSB7XG4gICAgY29uc3Qgc3RvcmUgPSB3cml0YWJsZSh2YWx1ZSk7XG4gICAgbGV0IHRhc2s7XG4gICAgbGV0IHRhcmdldF92YWx1ZSA9IHZhbHVlO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUsIG9wdHMpIHtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IG5ld192YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICBsZXQgcHJldmlvdXNfdGFzayA9IHRhc2s7XG4gICAgICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIGxldCB7IGRlbGF5ID0gMCwgZHVyYXRpb24gPSA0MDAsIGVhc2luZyA9IGxpbmVhciwgaW50ZXJwb2xhdGUgPSBnZXRfaW50ZXJwb2xhdG9yIH0gPSBhc3NpZ24oYXNzaWduKHt9LCBkZWZhdWx0cyksIG9wdHMpO1xuICAgICAgICBpZiAoZHVyYXRpb24gPT09IDApIHtcbiAgICAgICAgICAgIGlmIChwcmV2aW91c190YXNrKSB7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzay5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX3Rhc2sgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gdGFyZ2V0X3ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGFydCA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGxldCBmbjtcbiAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgIGlmIChub3cgPCBzdGFydClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgIGZuID0gaW50ZXJwb2xhdGUodmFsdWUsIG5ld192YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbih2YWx1ZSwgbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmV2aW91c190YXNrKSB7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzay5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX3Rhc2sgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IG5vdyAtIHN0YXJ0O1xuICAgICAgICAgICAgaWYgKGVsYXBzZWQgPiBkdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IG5ld192YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gZm4oZWFzaW5nKGVsYXBzZWQgLyBkdXJhdGlvbikpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhc2sucHJvbWlzZTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2V0LFxuICAgICAgICB1cGRhdGU6IChmbiwgb3B0cykgPT4gc2V0KGZuKHRhcmdldF92YWx1ZSwgdmFsdWUpLCBvcHRzKSxcbiAgICAgICAgc3Vic2NyaWJlOiBzdG9yZS5zdWJzY3JpYmVcbiAgICB9O1xufVxuXG5leHBvcnQgeyBzcHJpbmcsIHR3ZWVuZWQgfTtcbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IHNldENvbnRleHQsIGdldENvbnRleHQsIG9uTW91bnQsIG9uRGVzdHJveSwgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJ1xuICBpbXBvcnQgeyBnZXQsIHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xuICBpbXBvcnQgSWNvbiBmcm9tICcuLi9JY29uLnN2ZWx0ZSdcblxuICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpXG5cbiAgLyoqIEluZGV4IG9mIHRoZSBhY3RpdmUgdGFiICh6ZXJvLWJhc2VkKVxuICAgKiBAc3ZlbHRlLXByb3Age051bWJlcn0gW3ZhbHVlPTBdXG4gICAqICovXG4gIGV4cG9ydCBsZXQgdmFsdWUgPSAwXG5cbiAgLyoqIFNpemUgb2YgdGFic1xuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW3NpemVdXG4gICAqIEB2YWx1ZXMgJCRzaXplcyQkXG4gICAqICovXG4gIGV4cG9ydCBsZXQgc2l6ZSA9ICcnXG5cbiAgLyoqIFBvc2l0aW9uIG9mIHRhYnMgbGlzdCwgaG9yaXpvbnRhbGx5LiBCeSBkZWZhdWx0IHRoZXkncmUgcG9zaXRpb25lZCB0byB0aGUgbGVmdFxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW3Bvc2l0aW9uXVxuICAgKiBAdmFsdWVzIGlzLWNlbnRlcmVkLCBpcy1yaWdodFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHBvc2l0aW9uID0gJydcblxuICAvKiogU3R5bGUgb2YgdGFic1xuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW3N0eWxlXVxuICAgKiBAdmFsdWVzIGlzLWJveGVkLCBpcy10b2dnbGUsIGlzLXRvZ2dsZS1yb3VuZGVkLCBpcy1mdWxsd2lkdGhcbiAgICogKi9cbiAgZXhwb3J0IGxldCBzdHlsZSA9ICcnXG5cbiAgZXhwb3J0IGxldCBleHBhbmRlZCA9IGZhbHNlXG5cbiAgbGV0IGFjdGl2ZVRhYiA9IDBcbiAgJDogY2hhbmdlVGFiKHZhbHVlKVxuXG4gIGNvbnN0IHRhYnMgPSB3cml0YWJsZShbXSlcblxuICBjb25zdCB0YWJDb25maWcgPSB7XG4gICAgYWN0aXZlVGFiLFxuICAgIHRhYnMsXG4gIH1cblxuICBzZXRDb250ZXh0KCd0YWJzJywgdGFiQ29uZmlnKVxuXG4gIC8vIFRoaXMgb25seSBydW5zIGFzIHRhYnMgYXJlIGFkZGVkL3JlbW92ZWRcbiAgY29uc3QgdW5zdWJzY3JpYmUgPSB0YWJzLnN1YnNjcmliZSh0cyA9PiB7XG4gICAgaWYgKHRzLmxlbmd0aCA+IDAgJiYgdHMubGVuZ3RoID4gdmFsdWUgLSAxKSB7XG4gICAgICB0cy5mb3JFYWNoKHQgPT4gdC5kZWFjdGl2YXRlKCkpXG4gICAgICBpZiAodHNbdmFsdWVdKSB0c1t2YWx1ZV0uYWN0aXZhdGUoKVxuICAgIH1cbiAgfSlcblxuICBmdW5jdGlvbiBjaGFuZ2VUYWIodGFiTnVtYmVyKSB7XG4gICAgY29uc3QgdHMgPSBnZXQodGFicylcbiAgICAvLyBOT1RFOiBjaGFuZ2UgdGhpcyBiYWNrIHRvIHVzaW5nIGNoYW5nZVRhYiBpbnN0ZWFkIG9mIGFjdGl2YXRlL2RlYWN0aXZhdGUgb25jZSB0cmFuc2l0aW9ucy9hbmltYXRpb25zIGFyZSB3b3JraW5nXG4gICAgaWYgKHRzW2FjdGl2ZVRhYl0pIHRzW2FjdGl2ZVRhYl0uZGVhY3RpdmF0ZSgpXG4gICAgaWYgKHRzW3RhYk51bWJlcl0pIHRzW3RhYk51bWJlcl0uYWN0aXZhdGUoKVxuICAgIC8vIHRzLmZvckVhY2godCA9PiB0LmNoYW5nZVRhYih7IGZyb206IGFjdGl2ZVRhYiwgdG86IHRhYk51bWJlciB9KSlcbiAgICBhY3RpdmVUYWIgPSB0YWJDb25maWcuYWN0aXZlVGFiID0gdGFiTnVtYmVyXG4gICAgZGlzcGF0Y2goJ2FjdGl2ZVRhYkNoYW5nZWQnLCB0YWJOdW1iZXIpXG4gIH1cblxuICBvbk1vdW50KCgpID0+IHtcbiAgICBjaGFuZ2VUYWIoYWN0aXZlVGFiKVxuICB9KVxuXG4gIG9uRGVzdHJveSgoKSA9PiB7XG4gICAgdW5zdWJzY3JpYmUoKVxuICB9KVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSBsYW5nPVwic2Nzc1wiPlxuICAudGFicy13cmFwcGVyIHtcbiAgICAmLmlzLWZ1bGx3aWR0aCB7XG4gICAgICAvKiBUT0RPICovXG4gICAgfVxuXG4gICAgLnRhYi1jb250ZW50IHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgICAgZmxleC13cmFwOiBub3dyYXA7XG4gICAgICBvdmVyZmxvdy14OiBoaWRkZW47XG4gICAgfVxuICB9XG48L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwidGFicy13cmFwcGVyXCIgY2xhc3M6aXMtZnVsbHdpZHRoPXtleHBhbmRlZH0+XG4gIDxuYXYgY2xhc3M9XCJ0YWJzIHtzaXplfSB7cG9zaXRpb259IHtzdHlsZX1cIj5cbiAgICA8dWw+XG4gICAgICB7I2VhY2ggJHRhYnMgYXMgdGFiLCBpbmRleH1cbiAgICAgICAgPGxpIGNsYXNzOmlzLWFjdGl2ZT17aW5kZXggPT09IGFjdGl2ZVRhYn0+XG4gICAgICAgICAgPGEgaHJlZiBvbjpjbGlja3xwcmV2ZW50RGVmYXVsdD17KCkgPT4gY2hhbmdlVGFiKGluZGV4KX0+XG4gICAgICAgICAgICB7I2lmIHRhYi5pY29ufVxuICAgICAgICAgICAgICA8SWNvbiBwYWNrPXt0YWIuaWNvblBhY2t9IGljb249e3RhYi5pY29ufSAvPlxuICAgICAgICAgICAgey9pZn1cblxuICAgICAgICAgICAgPHNwYW4+e3RhYi5sYWJlbH08L3NwYW4+XG4gICAgICAgICAgPC9hPlxuICAgICAgICA8L2xpPlxuICAgICAgey9lYWNofVxuICAgIDwvdWw+XG4gIDwvbmF2PlxuICA8c2VjdGlvbiBjbGFzcz1cInRhYi1jb250ZW50XCI+XG4gICAgPHNsb3QgLz5cbiAgPC9zZWN0aW9uPlxuPC9kaXY+XG4iLCI8c2NyaXB0PlxuICBpbXBvcnQgeyBiZWZvcmVVcGRhdGUsIHNldENvbnRleHQsIGdldENvbnRleHQsIHRpY2ssIG9uTW91bnQgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJ1xuXG4gIC8qKiBMYWJlbCBmb3IgdGFiXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBsYWJlbFxuICAgKiAqL1xuICBleHBvcnQgbGV0IGxhYmVsXG5cbiAgLyoqIFNob3cgdGhpcyBpY29uIG9uIGxlZnQtc2lkZSBvZiB0aGUgdGFiXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbaWNvbl1cbiAgICogKi9cbiAgZXhwb3J0IGxldCBpY29uID0gJydcblxuICAvKiogRm9udGF3ZXNvbWUgaWNvbiBwYWNrIHRvIHVzZS4gQnkgZGVmYXVsdCB0aGUgPGNvZGU+SWNvbjwvY29kZT4gY29tcG9uZW50IHVzZXMgPGNvZGU+ZmFzPC9jb2RlPlxuICAgKiBAc3ZlbHRlLXByb3Age1N0cmluZ30gW2ljb25QYWNrXVxuICAgKiBAdmFsdWVzIDxjb2RlPmZhczwvY29kZT4sIDxjb2RlPmZhYjwvY29kZT4sIGV0Yy4uLlxuICAgKiAqL1xuICBleHBvcnQgbGV0IGljb25QYWNrID0gJydcblxuICBsZXQgYWN0aXZlID0gZmFsc2VcblxuICBsZXQgZWxcbiAgbGV0IGluZGV4XG4gIGxldCBzdGFydGluZyA9IGZhbHNlXG4gIGxldCBkaXJlY3Rpb24gPSAnJ1xuICBsZXQgaXNJbiA9IGZhbHNlXG5cbiAgY29uc3QgdGFiQ29uZmlnID0gZ2V0Q29udGV4dCgndGFicycpXG5cbiAgZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoYW5nZVRhYih7IGZyb20sIHRvIH0pIHtcbiAgICBpZiAoZnJvbSA9PT0gdG8pIHJldHVyblxuXG4gICAgLy8gY29uc29sZS5sb2coeyBpbmRleCwgZnJvbSwgdG8gfSwgdG8gPT09IGluZGV4KVxuICAgIGlmIChmcm9tID09PSBpbmRleCkge1xuICAgICAgLy8gVHJhbnNpdGlvbiBvdXRcbiAgICAgIGRpcmVjdGlvbiA9IGluZGV4IDwgdG8gPyAnbGVmdCcgOiAncmlnaHQnXG4gICAgfSBlbHNlIGlmICh0byA9PT0gaW5kZXgpIHtcbiAgICAgIC8vIFRyYW5zaXRpb24gaW47IHN0YXJ0IGF0IGRpcmVjdGlvbiB3aGVuIHJlbmRlcmVkLCB0aGVuIHJlbW92ZSBpdFxuICAgICAgLy8gY29uc29sZS5sb2coJ1RSQU5TSVRJT04nLCB7IGluZGV4LCB0bywgYWN0aXZlIH0pXG4gICAgICBhY3RpdmUgPSB0cnVlXG4gICAgICBkaXJlY3Rpb24gPSBpbmRleCA+IGZyb20gPyAncmlnaHQnIDogJ2xlZnQnXG4gICAgICAvLyBhd2FpdCB0aWNrKClcbiAgICAgIC8vIGRpcmVjdGlvbiA9ICcnXG4gICAgfSBlbHNlIGRpcmVjdGlvbiA9ICcnXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVJbmRleCgpIHtcbiAgICBpZiAoIWVsKSByZXR1cm5cbiAgICBpbmRleCA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoZWwucGFyZW50Tm9kZS5jaGlsZHJlbiwgZWwpXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiB0cmFuc2l0aW9uZW5kKGV2ZW50KSB7XG4gICAgLy8gY29uc29sZS5sb2coeyBpbmRleCwgYWN0aXZlLCBhY3RpdmVUYWI6IHRhYkNvbmZpZy5hY3RpdmVUYWIgfSlcbiAgICAvLyBjb25zb2xlLmxvZyhldmVudC50YXJnZXQpXG4gICAgYWN0aXZlID0gaW5kZXggPT09IHRhYkNvbmZpZy5hY3RpdmVUYWJcbiAgICBhd2FpdCB0aWNrKClcbiAgICBkaXJlY3Rpb24gPSAnJ1xuICB9XG5cbiAgdGFiQ29uZmlnLnRhYnMuc3Vic2NyaWJlKHRhYnMgPT4ge1xuICAgIHVwZGF0ZUluZGV4KClcbiAgfSlcblxuICBvbk1vdW50KCgpID0+IHtcbiAgICB1cGRhdGVJbmRleCgpXG5cbiAgICB0YWJDb25maWcudGFicy51cGRhdGUodGFicyA9PiBbXG4gICAgICAuLi50YWJzLFxuICAgICAge1xuICAgICAgICBpbmRleCxcbiAgICAgICAgbGFiZWwsXG4gICAgICAgIGljb24sXG4gICAgICAgIGljb25QYWNrLFxuICAgICAgICBhY3RpdmF0ZTogKCkgPT4gKGFjdGl2ZSA9IHRydWUpLFxuICAgICAgICBkZWFjdGl2YXRlOiAoKSA9PiAoYWN0aXZlID0gZmFsc2UpLFxuICAgICAgICBjaGFuZ2VUYWIsXG4gICAgICB9LFxuICAgIF0pXG4gIH0pXG5cbiAgYmVmb3JlVXBkYXRlKGFzeW5jICgpID0+IHtcbiAgICBpZiAoaW5kZXggPT09IHRhYkNvbmZpZy5hY3RpdmVUYWIgJiYgZGlyZWN0aW9uKSB7XG4gICAgICBhd2FpdCB0aWNrKClcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkaXJlY3Rpb24gPSAnJ1xuICAgICAgfSlcbiAgICB9XG4gIH0pXG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC8vIE5PVEU6IGFkZCB0cmFuc2l0aW9ucy9hbmltYXRpb25zIGJhY2sgb25jZSB0aGV5J3JlIHdvcmtpbmdcbiAgLnRhYiB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgICBmbGV4OiAxIDAgMTAwJTtcbiAgICAvLyB3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xuICAgIC8vIHRyYW5zaXRpb246IHRyYW5zZm9ybSA0MDBtcyBlYXNlLWluO1xuXG4gICAgJi5pcy1hY3RpdmUge1xuICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgLy8gdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDApO1xuICAgIH1cblxuICAgIC8vICYuc3RhcnRpbmcge1xuICAgIC8vICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICAvLyB9XG5cbiAgICAvLyAmLmxlZnQge1xuICAgIC8vICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC0xMDAlKTtcbiAgICAvLyB9XG5cbiAgICAvLyAmLnJpZ2h0IHtcbiAgICAvLyAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMDAlKTtcbiAgICAvLyB9XG5cbiAgICAvLyAmLnN0YXJ0aW5nIHtcbiAgICAvLyAgIHRyYW5zaXRpb246IG5vbmU7XG4gICAgLy8gfVxuICB9XG48L3N0eWxlPlxuXG48ZGl2XG4gIGNsYXNzPVwidGFiIHtkaXJlY3Rpb259XCJcbiAgY2xhc3M6aXMtYWN0aXZlPXthY3RpdmV9XG4gIGJpbmQ6dGhpcz17ZWx9XG4gIGFyaWEtaGlkZGVuPXshYWN0aXZlfVxuICBvbjp0cmFuc2l0aW9uZW5kPXt0cmFuc2l0aW9uZW5kfT5cbiAgPHNsb3Qge2xhYmVsfSB7aWNvblBhY2t9IHtpY29ufSAvPlxuPC9kaXY+XG4iLCJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcclxuXHJcbmV4cG9ydCBjb25zdCBzb3VyY2UgPSB3cml0YWJsZSh7XHJcbiAgb3BlbkRpc2FibGVkOiBmYWxzZSxcclxuICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgZ29EaXNhYmxlZDogdHJ1ZSxcclxuICBjb250ZW50OiAnJyxcclxuICBmcGF0aDogJycsXHJcbiAgcGF0aDogJydcclxufSlcclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCB0b3A7XHJcbmV4cG9ydCBsZXQgYmxvY2s9ZmFsc2U7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoKSB7XHJcbiAgcmV0dXJuIHRvcCA/IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke3RvcH1weCk7YCA6ICcnO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInZib3ggbGVmdFwiPlxyXG4gIHsjaWYgYmxvY2t9XHJcbiAgICA8c2xvdD48L3Nsb3Q+XHJcbiAgezplbHNlfVxyXG4gICAgPGRpdiBjbGFzcz1cInRhYmxlLWNvbnRhaW5lclwiIHN0eWxlPVwie3Jlc2l6ZSgpfVwiPlxyXG4gICAgICA8c2xvdD48L3Nsb3Q+XHJcbiAgICA8L2Rpdj5cclxuICB7L2lmfVxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnZib3gge1xyXG4gIGZsZXg6IGF1dG87XHJcbiAgZGlzcGxheTogZmxleDtcclxuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxufVxyXG4udmJveC5sZWZ0IHtcclxuICB3aWR0aDogMTAwJTtcclxufVxyXG4udGFibGUtY29udGFpbmVyIHtcclxuICBvdmVyZmxvdzogYXV0bztcclxuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAyN3B4KTtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IHRvcDtcclxuXHJcbmltcG9ydCB7c3ByaW5nfSBmcm9tICdzdmVsdGUvbW90aW9uJ1xyXG5pbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnO1xyXG5cclxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcclxuICBcclxubGV0IGRyb3BUYXJnZXQ7XHJcbmZ1bmN0aW9uIGRyYWdnYWJsZShub2RlLCBwYXJhbXMpIHtcclxuICBcclxuICBsZXQgbGFzdFg7XHJcbiAgbGV0IHBhcmVudFg7XHJcbiAgbGV0IG9mZnNldFggPSAwXHJcbiAgY29uc3Qgb2Zmc2V0ID0gc3ByaW5nKHt4OiBvZmZzZXRYLCB5OiAwfSwge1xyXG5cdFx0c3RpZmZuZXNzOiAwLjIsXHJcblx0XHRkYW1waW5nOiAwLjRcclxuXHR9KTtcclxuXHJcbiAgb2Zmc2V0LnN1YnNjcmliZShvZmZzZXQgPT4ge1xyXG4gICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgaWYgKHBhcmVudCkge1xyXG4gICAgICBjb25zdCBsZWZ0ID0gcGFyZW50WCArIG9mZnNldC54XHJcbiAgICAgIHBhcmVudC5zdHlsZS5sZWZ0ID0gYCR7bGVmdH1weGA7XHJcbiAgICAgIHBhcmVudC5zdHlsZS53aWR0aCA9IGBjYWxjKDEwMHZ3IC0gJHtsZWZ0fXB4YDtcclxuICAgIH1cclxuICB9KVxyXG5cclxuICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93bik7XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlZG93bihldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cdFx0bGFzdFggPSBldmVudC5jbGllbnRYO1xyXG4gICAgcGFyZW50WCA9IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0O1xyXG4gICAgbm9kZS5jbGFzc0xpc3QuYWRkKCdkcmFnZ2VkJylcclxuXHJcbiAgICBkaXNwYXRjaCgnZHJhZ3N0YXJ0Jywge3RhcmdldDpub2RlLCBsYXN0WH0pO1xyXG5cclxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUpO1xyXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVNb3VzZXVwKTtcclxuXHR9XHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZU1vdXNlbW92ZShlKSB7XHJcbiAgICBvZmZzZXRYICs9IGUuY2xpZW50WCAtIGxhc3RYO1xyXG4gICAgb2Zmc2V0LnNldCh7eDogb2Zmc2V0WCwgeTogMH0pO1xyXG4gICAgXHJcblx0XHRsYXN0WCA9IGUuY2xpZW50WDtcclxuICAgIGRpc3BhdGNoKCdkcmFnJywge3RhcmdldDpub2RlLCBsZWZ0OiBub2RlLnBhcmVudE5vZGUub2Zmc2V0TGVmdH0pO1xyXG5cdH1cclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2V1cChldmVudCkge1xyXG4gICAgb2Zmc2V0WCA9IDA7XHJcbiAgICBkcm9wVGFyZ2V0ID0gbnVsbDtcclxuICAgIGxhc3RYID0gdW5kZWZpbmVkO1xyXG4gICAgcGFyZW50WCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWdnZWQnKTtcclxuICAgIG9mZnNldC5zZXQoe3g6IG5vZGUub2Zmc2V0TGVmdCwgeTogMH0pO1xyXG4gICAgZGlzcGF0Y2goJ2RyYWdlbmQnLCB7dGFyZ2V0OiBub2RlLCBsZWZ0OiBub2RlLnBhcmVudE5vZGUub2Zmc2V0TGVmdH0pO1xyXG4gICAgXHJcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlKTtcclxuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2V1cCk7XHJcblx0fVxyXG4gIFxyXG4gIHJldHVybiB7XHJcblx0XHRkZXN0cm95KCkge1xyXG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93bik7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXNpemUoKSB7XHJcbiAgcmV0dXJuIHRvcCA/IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke3RvcH1weCk7YCA6ICcnO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInJlc2l6ZVwiIHVzZTpkcmFnZ2FibGUgc3R5bGU9XCJ7cmVzaXplKCl9XCI+IDwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4ucmVzaXplIHtcclxuICB3aWR0aDogMnB4O1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAyN3B4KTtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjNjNDlkO1xyXG4gIGN1cnNvcjogY29sLXJlc2l6ZTtcclxuICB6LWluZGV4OiA1O1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCB0b3A7XHJcbmV4cG9ydCBsZXQgbGVmdDtcclxuXHJcbmltcG9ydCB7Y3JlYXRlRXZlbnREaXNwYXRjaGVyfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgU3BsaXR0ZXIgZnJvbSAnLi9TcGxpdHRlci5zdmVsdGUnO1xyXG5cclxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcclxuXHJcbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcclxuICBsZXQgY3NzID0gYGxlZnQ6ICR7bGVmdH1weDt3aWR0aDogY2FsYygxMDB2dyAtICR7bGVmdH1weCk7YFxyXG4gIGlmICh0b3ApIHtcclxuICAgIGNzcyArPSBgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gJHt0b3B9cHgpO2A7XHJcbiAgfVxyXG4gIHJldHVybiBjc3M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYWdnZWQoZSkge1xyXG4gIGRpc3BhdGNoKCdkcmFnJywgIGUuZGV0YWlsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZHJhZ2VuZChlKSB7XHJcbiAgZGlzcGF0Y2goJ2RyYWdlbmQnLCAgZS5kZXRhaWwpO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInZib3ggcmlnaHRcIiBzdHlsZT1cIntyZXNpemUobGVmdCl9XCI+XHJcbiAgPFNwbGl0dGVyIG9uOmRyYWc9e2RyYWdnZWR9IG9uOmRyYWdlbmQ9e2RyYWdlbmR9IHt0b3B9Lz5cclxuICA8c2xvdD48L3Nsb3Q+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udmJveCB7XHJcbiAgZmxleDogYXV0bztcclxuICBkaXNwbGF5OiBmbGV4O1xyXG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG59XHJcbi52Ym94LnJpZ2h0IHtcclxuICByaWdodDogMDtcclxuICBsZWZ0OiAxNjNweDtcclxuICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgYmFja2dyb3VuZDogI2YxZjdmN2UzO1xyXG4gIHdpZHRoOiBjYWxjKDEwMHZ3IC0gMTYzcHgpO1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xyXG4gIG92ZXJmbG93OiBoaWRkZW47XHJcbn1cclxuXHJcblxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgbGVmdCA9IDA7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoKSB7XHJcbiAgbGV0IGNzcyA9ICcnXHJcbiAgaWYgKGxlZnQpIHtcclxuICAgIGNzcyArPSBgd2lkdGg6IGNhbGMoMTAwdncgLSAke2xlZnR9cHgpO2BcclxuICB9XHJcbiAgcmV0dXJuIGNzcztcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjx0YWJsZSBjbGFzcz1cInRhYmxlLWhlYWRlclwiIHN0eWxlPVwie3Jlc2l6ZShsZWZ0KX1cIj5cclxuICA8dHI+XHJcbiAgICA8dGQ+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ0ZC1oZWFkZXJcIj5cclxuICAgICAgICA8c2xvdD48L3Nsb3Q+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC90ZD5cclxuICA8L3RyPlxyXG48L3RhYmxlPlxyXG5cclxuPHN0eWxlPlxyXG4udGFibGUtaGVhZGVyIHtcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbn1cclxuLnRkLWhlYWRlciB7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbn1cclxudGFibGUge1xyXG4gIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XHJcbiAgZm9udC1mYW1pbHk6ICBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC1zaXplOiAxMnB4O1xyXG4gIHdpZHRoOiAxMDAlO1xyXG59XHJcbnRkIHtcclxuICAvKiBib3JkZXI6IDFweCBzb2xpZCAjOTk5OyAqL1xyXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzBkOGNjYTE7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogYWxpY2VibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gIHBhZGRpbmc6IDAuMXJlbTtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgTGlzdDtcclxuZXhwb3J0IGxldCBsZWZ0O1xyXG5leHBvcnQgbGV0IHRpdGxlO1xyXG5leHBvcnQgbGV0IGRyYWdlbmQ7XHJcbmV4cG9ydCBsZXQgc2hvdyA9IDE7XHJcbmV4cG9ydCBsZXQgcHJvcHMgPSB7fTtcclxuZXhwb3J0IGxldCB0b3AgPSBcIjBcIjtcclxuXHJcbmltcG9ydCBWQm94IGZyb20gJy4uL2JveC9WQm94LnN2ZWx0ZSc7XHJcbmltcG9ydCBCU3RhdGljIGZyb20gJy4uL2JveC9CU3RhdGljLnN2ZWx0ZSc7XHJcbmltcG9ydCBCUmVzaXplIGZyb20gJy4uL2JveC9CUmVzaXplLnN2ZWx0ZSc7XHJcbmltcG9ydCBCSGVhZGVyIGZyb20gJy4uL2JveC9CSGVhZGVyLnN2ZWx0ZSc7XHJcbmltcG9ydCBCVGFibGUgZnJvbSAnLi4vYm94L0JUYWJsZS5zdmVsdGUnO1xyXG48L3NjcmlwdD5cclxuXHJcbjxWQm94PlxyXG4gIDxCU3RhdGljIHt0b3B9PlxyXG4gICAgPEJIZWFkZXI+XHJcbiAgICAgIHsjaWYgdHlwZW9mIHRpdGxlID09PSAnc3RyaW5nJ31cclxuICAgICAgICB7dGl0bGV9XHJcbiAgICAgIHs6ZWxzZX1cclxuICAgICAgICA8c3ZlbHRlOmNvbXBvbmVudCB0aGlzPXt0aXRsZX0vPlxyXG4gICAgICB7L2lmfVxyXG4gICAgPC9CSGVhZGVyPlxyXG4gICAgPGRpdiBjbGFzcz1cImRldGFpbHMtbGlzdFwiPjxzdmVsdGU6Y29tcG9uZW50IHRoaXM9e0xpc3R9IHsuLi5wcm9wc30vPjwvZGl2PlxyXG4gIDwvQlN0YXRpYz5cclxuICB7I2lmIHNob3d9XHJcbiAgPEJSZXNpemUge2xlZnR9IG9uOmRyYWdlbmQ9e2RyYWdlbmR9IHt0b3B9PlxyXG4gICAgPHNsb3Q+PC9zbG90PlxyXG4gIDwvQlJlc2l6ZT5cclxuICB7L2lmfVxyXG48L1ZCb3g+XHJcblxyXG48c3R5bGU+XHJcbiAgLmRldGFpbHMtbGlzdCB7XHJcbiAgICBtYXJnaW4tdG9wOiAxOXB4O1xyXG4gICAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICB9XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBlZGl0b3I7XHJcbmV4cG9ydCBsZXQgc291cmNlO1xyXG5cclxuZnVuY3Rpb24gYnRuTWluKCkge1xyXG4gIGNvbnN0IG1vbmFjbyA9IHdpbmRvdy5taXRtLmVkaXRvcltlZGl0b3JdXHJcbiAgbW9uYWNvICYmIG1vbmFjby50cmlnZ2VyKCdmb2xkJywgJ2VkaXRvci5mb2xkQWxsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0blBsdXMoKSB7XHJcbiAgY29uc3QgbW9uYWNvID0gd2luZG93Lm1pdG0uZWRpdG9yW2VkaXRvcl1cclxuICBtb25hY28gJiYgbW9uYWNvLnRyaWdnZXIoJ3VuZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XHJcbiAgY29uc29sZS5sb2coc291cmNlKTtcclxuICB3c19fc2VuZCgnb3BlbkZvbGRlcicsIHNvdXJjZSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBPcGVuIScpO1xyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tbWluXCIgIG9uOmNsaWNrPVwie2J0bk1pbn1cIiA+Wy0tXTwvYnV0dG9uPiAtXHJcbjxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXBsdXNcIiBvbjpjbGljaz1cIntidG5QbHVzfVwiPlsrK108L2J1dHRvbj4gLVxyXG48YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1vcGVuXCIgZGlzYWJsZWQ9e3NvdXJjZS5vcGVuRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bk9wZW59XCI+T3BlbjwvYnV0dG9uPiAtXHJcblxyXG48c3R5bGU+XHJcbmJ1dHRvbiB7XHJcbiAgYm9yZGVyOiAwO1xyXG4gIHBhZGRpbmc6IDA7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC1zaXplOiAxMHB4O1xyXG59XHJcbi50bGIge1xyXG4gIGJvcmRlcjogbm9uZTtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBFeGJ1dHRvbiBmcm9tICcuLi9tb25hY28vRXhidXR0b24uc3ZlbHRlJztcclxuXHJcbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xyXG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9yb3V0ZSB9fSA9IHdpbmRvdy5taXRtO1xyXG4gIGlmIChfcm91dGUpIHtcclxuICAgIGNvbnN0IGNvbnRlbnQgPSBfcm91dGUuZ2V0VmFsdWUoKVxyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgc2F2ZURpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgIGVkaXRidWZmZXI6IGNvbnRlbnRcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xyXG4gICAgd3NfX3NlbmQoJ3NhdmVSb3V0ZScsICRzb3VyY2UsIGRhdGEgPT4ge1xyXG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7Li4ubiwgc2F2ZURpc2FibGVkOiB0cnVlfX0pO1xyXG4gICAgICBjb25zb2xlLmxvZygnRG9uZSBTYXZlIScpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidG5zKGlkKSB7XHJcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1tpZF07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybHMpIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhyb3V0ZS51cmxzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYnRuVXJsKGlkKSB7XHJcbiAgY29uc3Qgcm91dGUgPSBtaXRtLnJvdXRlc1skc291cmNlLml0ZW1dO1xyXG4gIGlmIChyb3V0ZSAmJiByb3V0ZS51cmxzKSB7XHJcbiAgICByZXR1cm4gcm91dGUudXJsc1tpZF07XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiAnJztcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0blRhZyhlKSB7XHJcbiAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IGUudGFyZ2V0LmRhdGFzZXQudXJsfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bkdvKGUpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzWyRzb3VyY2UuaXRlbV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybCkge1xyXG4gICAgY2hyb21lLnRhYnMudXBkYXRlKHt1cmw6IHJvdXRlLnVybH0pO1xyXG4gIH1cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjaWYgJHNvdXJjZS5wYXRofVxyXG5cdDxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XHJcbiAgeyNlYWNoIGJ0bnMoJHNvdXJjZS5pdGVtKSBhcyBpdGVtfVxyXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLWdvXCIgb246Y2xpY2s9XCJ7YnRuVGFnfVwiXHJcbiAgZGF0YS11cmw9XCJ7YnRuVXJsKGl0ZW0pfVwiPntpdGVtfTwvYnV0dG9uPiAtIFxyXG4gIHsvZWFjaH1cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIGRpc2FibGVkPXskc291cmNlLmdvRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0bkdvfVwiPkdvPC9idXR0b24+LlxyXG4gIDwvZGl2PlxyXG57L2lmfVxyXG48ZGl2IGNsYXNzPVwiZmlsZS1wYXRoXCI+XHJcblBhdGg6eyRzb3VyY2UucGF0aH1cclxueyNpZiAkc291cmNlLnBhdGh9XHJcblx0PGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICA8RXhidXR0b24gc291cmNlPXskc291cmNlfSBlZGl0b3I9XCJfcm91dGVcIi8+XHJcbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tc2F2ZVwiIGRpc2FibGVkPXskc291cmNlLnNhdmVEaXNhYmxlZH0gb246Y2xpY2s9XCJ7YnRuU2F2ZX1cIj5TYXZlPC9idXR0b24+XHJcbiAgPC9kaXY+XHJcbnsvaWZ9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uZmlsZS1wYXRoIHtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgZm9udC1mYW1pbHk6IGF1dG87XHJcbiAgZm9udC1zaXplOiAwLjllbTtcclxuICBjb2xvcjogYmx1ZTtcclxufVxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IC0ycHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG59XHJcbi5idG4tY29udGFpbmVyIGJ1dHRvbjpkaXNhYmxlZCB7XHJcbiAgY3Vyc29yOiBhdXRvO1xyXG59XHJcbi50bGIge1xyXG4gIGJvcmRlcjogbm9uZTtcclxufVxyXG48L3N0eWxlPiIsImV4cG9ydCBjb25zdCBjZmcgPSAge1xyXG4gIGxhbmd1YWdlOiAnamF2YXNjcmlwdCcsXHJcbiAgLy8gdGhlbWU6IFwidnMtZGFya1wiLFxyXG4gIG1pbmltYXA6IHtcclxuICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gIH0sXHJcbiAgdmFsdWU6ICcnLFxyXG4gIGZvbnRGYW1pbHk6IFsnQ2FzY2FkaWEgQ29kZScsICdDb25zb2xhcycsICdDb3VyaWVyIE5ldycsICdtb25vc3BhY2UnXSxcclxuICBmb250TGlnYXR1cmVzOiB0cnVlLFxyXG4gIGZvbnRTaXplOiAxMVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcmVzaXplID0gZWRpdG9yID0+IHtcclxuICByZXR1cm4gZW50cmllcyA9PiB7XHJcbiAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSBlbnRyaWVzWzBdLmNvbnRlbnRSZWN0XHJcbiAgICBlZGl0b3IubGF5b3V0KHt3aWR0aCwgaGVpZ2h0fSlcclxuICB9ICBcclxufVxyXG4iLCI8c2NyaXB0PlxyXG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG4gIGltcG9ydCB7IGNmZywgcmVzaXplIH0gZnJvbSAnLi4vbW9uYWNvL2luaXQnO1xyXG5cclxuICBleHBvcnQgbGV0IG9uQ2hhbmdlO1xyXG5cclxuICBvbk1vdW50KGFzeW5jICgpID0+IHtcclxuICAgIGZ1bmN0aW9uIGluaXRDb2RlRWRpdG9yKHNyYykge1xyXG4gICAgICBjb25zb2xlLmxvZygnbG9hZCBtb25hY286IHJvdXRlJylcclxuICAgICAgY29uc3QgZWxlbWVudCA9IHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9uYWNvJyk7XHJcbiAgICAgIGNvbnN0IF9yb3V0ZSA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUoZWxlbWVudCwgY2ZnKTtcclxuICAgICAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIocmVzaXplKF9yb3V0ZSkpXHJcbiAgICAgIHJvLm9ic2VydmUoZWxlbWVudCk7XHJcblxyXG4gICAgICB3aW5kb3cubWl0bS5lZGl0b3IuX3JvdXRlID0gX3JvdXRlO1xyXG4gICAgICB3aW5kb3cubWl0bS5lZGl0b3IuX3JvdXRlRWwgPSBlbGVtZW50O1xyXG5cclxuICAgICAgX3JvdXRlLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KG9uQ2hhbmdlKTtcclxuICAgICAgX3JvdXRlLnNldFZhbHVlKHNyYyk7XHJcbiAgICB9XHJcbiAgICB3aW5kb3cubWl0bS5lZGl0b3IuX3JvdXRlRWRpdCA9IGluaXRDb2RlRWRpdG9yO1xyXG4gIH0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJlZGl0LWNvbnRhaW5lclwiPlxyXG4gIDxkaXYgaWQ9XCJtb25hY29cIj48L2Rpdj5cclxuPC9kaXY+XHJcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IHJlcmVuZGVyID0gd3JpdGFibGUoe1xyXG4gIHRvZ2dsZTogdHJ1ZSxcclxufSlcclxuIiwiaW1wb3J0IHsgcmVyZW5kZXIgfSBmcm9tICcuL3JlcmVuZGVyLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1cmxzICgpIHtcclxuICBjb25zb2xlLmxvZygndXJscyBpcyBjYWxsZWQhJylcclxuICByZXJlbmRlci5zZXQoe1xyXG4gICAgdG9nZ2xlOiB0cnVlXHJcbiAgfSlcclxufVxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW07XHJcbmV4cG9ydCBsZXQgZ3JvdXAgPSAnJztcclxuZXhwb3J0IGxldCBvbkNoYW5nZTtcclxuXHJcbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XHJcbiAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gIGxldCB7ZWxlbWVudH0gPSBlLnRhcmdldC5kYXRhc2V0O1xyXG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9yb3V0ZSwgX3JvdXRlRWRpdCB9LCBmaWxlcyB9ID0gbWl0bTtcclxuICBjb25zdCB1cmwgPSBtaXRtLnJvdXRlc1tlbGVtZW50XS51cmw7XHJcbiAgY29uc3Qgb2JqID0gZmlsZXMucm91dGVbZWxlbWVudF07XHJcbiAgY29uc29sZS5sb2coaXRlbSwgZWxlbWVudCwgb2JqKTtcclxuXHJcbiAgaWYgKF9yb3V0ZT09PXVuZGVmaW5lZCkge1xyXG4gICAgX3JvdXRlRWRpdChvYmouY29udGVudClcclxuICB9IGVsc2Uge1xyXG4gICAgX3JvdXRlLnNldFZhbHVlKG9iai5jb250ZW50IHx8ICcnKTtcclxuICAgIF9yb3V0ZS5yZXZlYWxMaW5lKDEpO1xyXG4gIH1cclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIG9uQ2hhbmdlKGZhbHNlKTtcclxuXHJcbiAgICBzb3VyY2UudXBkYXRlKG4gPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLm4sXHJcbiAgICAgICAgZ29EaXNhYmxlZDogKHVybD09PXVuZGVmaW5lZCksXHJcbiAgICAgICAgY29udGVudDogb2JqLmNvbnRlbnQsXHJcbiAgICAgICAgZnBhdGg6IG9iai5mcGF0aCxcclxuICAgICAgICBwYXRoOiBvYmoucGF0aCxcclxuICAgICAgICBpdGVtOiBlbGVtZW50LFxyXG4gICAgICB9XHJcbiAgICB9LCAxKTtcclxuICB9KVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInRkLWl0ZW0ge2dyb3VwfSB7JHNvdXJjZS5mcGF0aD09PWl0ZW0uZnBhdGh9XCJcclxuICBkYXRhLWVsZW1lbnQ9e2l0ZW0uZWxlbWVudH1cclxuICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuPntpdGVtLnRpdGxlfTwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udGQtaXRlbSB7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIHBhZGRpbmc6IDAuMXJlbTtcclxuICBsaW5lLWhlaWdodDogMTVweDtcclxuICBwYWRkaW5nLWxlZnQ6IDEwcHg7XHJcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNjMGQ4Y2NhMTtcclxufVxyXG4udGQtaXRlbS50cnVlIHtcclxuICBjb2xvcjogYmx1ZTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xyXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjMzYzOGJmYTE7XHJcbn1cclxuZGl2LmNoaWxkIHtcclxuICBib3JkZXI6IG5vbmU7XHJcbiAgcGFkZGluZy1sZWZ0OiAxMnB4O1xyXG4gIGJhY2tncm91bmQ6IGJlaWdlO1xyXG59XHJcbmRpdi5ncm91cCB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG4gIHBhZGRpbmc6IDA7XHJcbiAgbWFyZ2luLWxlZnQ6IDlweDtcclxuICBtYXJnaW4tdG9wOiAtMTVweDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IG9uQ2hhbmdlO1xyXG5cclxuaW1wb3J0IHsgdXJscyB9IGZyb20gJy4uL3RhZ3MvdXJsLWRlYm91bmNlJztcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xyXG5cclxubGV0IHJlcmVuZGVyID0gMDtcclxubGV0IGRhdGEgPSBbXTtcclxuXHJcbiQ6IF9kYXRhID0gZGF0YTtcclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnNvbGUud2Fybignb25Nb3VudCByb3V0ZS9saXN0Jyk7XHJcbiAgX3dzX2Nvbm5lY3Qucm91dGVPbk1vdW50ID0gKCkgPT4gd3NfX3NlbmQoJ2dldFJvdXRlJywgJycsIHJvdXRlSGFuZGxlcik7XHJcbn0pO1xyXG5cclxuY29uc3Qgcm91dGVIYW5kbGVyID0gb2JqID0+IHtcclxuICBjb25zb2xlLndhcm4oJ3dzX19zZW5kKGdldFJvdXRlKScsIG9iaik7XHJcbiAgd2luZG93Lm1pdG0ucm91dGVzID0gb2JqLnJvdXRlc1xyXG4gIGNvbnN0IHtyb3V0ZXN9ID0gd2luZG93Lm1pdG1cclxuICBmb3IgKGNvbnN0IGlkIGluIG9iai5yb3V0ZXMpIHtcclxuICAgIGNvbnN0IFtzdWIsIG5zcGFjZV0gPSBpZC5zcGxpdCgnQCcpXHJcbiAgICBpZiAobnNwYWNlKSB7XHJcbiAgICAgIHJvdXRlc1tpZF0uX2NoaWxkbnMgPSByb3V0ZXNbbnNwYWNlXS5fY2hpbGRucyB8fCB7bGlzdDoge30sIF9zdWJuczogJyd9XHJcbiAgICAgIC8vIHJvdXRlc1tpZF0uX3N1Ym5zID0gcm91dGVzW25zcGFjZV0uX3N1Ym5zIHx8ICcnXHJcbiAgICB9ICAgICBcclxuICB9XHJcbiAgaWYgKG9iai5fdGFnc18pIHtcclxuICAgIHdpbmRvdy5taXRtLl9fdGFnMSA9IG9iai5fdGFnc18uX190YWcxO1xyXG4gICAgd2luZG93Lm1pdG0uX190YWcyID0gb2JqLl90YWdzXy5fX3RhZzI7XHJcbiAgICB3aW5kb3cubWl0bS5fX3RhZzMgPSBvYmouX3RhZ3NfLl9fdGFnMztcclxuICAgIHdpbmRvdy5taXRtLl9fdGFnNCA9IG9iai5fdGFnc18uX190YWc0O1xyXG4gICAgd2luZG93Lm1pdG0uX191cmxzID0gb2JqLl90YWdzXy5fX3VybHM7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHVybHMoKSwgMSlcclxuICB9XHJcbiAgaWYgKHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlPT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG9iai5maWxlcztcclxuICAgIGRhdGEgPSBvYmouZmlsZXM7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IHtyb3V0ZX0gPSB3aW5kb3cubWl0bS5maWxlcztcclxuICAgIGNvbnN0IHtmaWxlc30gPSBvYmo7XHJcbiAgICBjb25zdCBuZXdSb3V0ZSA9IHt9O1xyXG4gICAgZm9yIChsZXQgayBpbiBmaWxlcykge1xyXG4gICAgICBuZXdSb3V0ZVtrXSA9IHJvdXRlW2tdID8gcm91dGVba10gOiBmaWxlc1trXTtcclxuICAgICAgbmV3Um91dGVba10uY29udGVudCA9IGZpbGVzW2tdLmNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBkYXRhID0gbmV3Um91dGU7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG5ld1JvdXRlXHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRSb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XHJcbiAgICovXHJcbiAgY29uc3Qge2dldFJvdXRlX2V2ZW50c30gPSB3aW5kb3cubWl0bS5maWxlcztcclxuICBmb3IgKGxldCBrZXkgaW4gZ2V0Um91dGVfZXZlbnRzKSB7XHJcbiAgICBnZXRSb3V0ZV9ldmVudHNba2V5XShkYXRhKTtcclxuICB9XHJcbiAgcmVyZW5kZXIgPSByZXJlbmRlciArIDE7XHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cy5yb3V0ZVRhYmxlID0gKCkgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCdyb3V0ZVRhYmxlIGdldHRpbmcgY2FsbGVkISEhJyk7XHJcbiAgd2luZG93LndzX19zZW5kKCdnZXRSb3V0ZScsICcnLCByb3V0ZUhhbmRsZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB4bGlzdChhbGwpIHtcclxuICByZXR1cm4gT2JqZWN0LmtleXMoX2RhdGEpLmZpbHRlcih4ID0+ICF4Lm1hdGNoKCdAJykpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoaWxkcyhpdGVtKSB7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbaXRlbV1cclxuICByZXR1cm4gT2JqZWN0LmtleXMocm91dGUuX2NoaWxkbnMubGlzdClcclxufVxyXG5cclxuZnVuY3Rpb24gaXNHcm91cChpdGVtKSB7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbaXRlbV1cclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhyb3V0ZS5fY2hpbGRucy5saXN0KVxyXG4gIHJldHVybiBhcnIubGVuZ3RoXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG57I2VhY2ggeGxpc3QoX2RhdGEpIGFzIGl0ZW19XHJcbiAgeyNpZiBpc0dyb3VwKGl0ZW0pfVxyXG4gIDxkZXRhaWxzPlxyXG4gICAgPHN1bW1hcnkgY2xhc3M9XCJzcGFjZTFcIj5cclxuICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtLCAuLi5fZGF0YVtpdGVtXX19IHtvbkNoYW5nZX0gZ3JvdXA9XCJncm91cFwiLz5cclxuICAgIDwvc3VtbWFyeT5cclxuICAgIHsjZWFjaCBjaGlsZHMoaXRlbSkgYXMgaXRlbTJ9XHJcbiAgICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtMiwgLi4uX2RhdGFbaXRlbTJdfX0ge29uQ2hhbmdlfSBncm91cD1cImNoaWxkXCIvPlxyXG4gICAgey9lYWNofVxyXG4gIDwvZGV0YWlscz5cclxuICB7OmVsc2V9XHJcbiAgICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSB7b25DaGFuZ2V9Lz5cclxuICB7L2lmfVxyXG57L2VhY2h9XHJcblxyXG48c3R5bGU+XHJcbnN1bW1hcnkge1xyXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzBkOGNjYTE7XHJcbiAgcGFkZGluZy1sZWZ0OiAycHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxuaW1wb3J0IFZCb3gyIGZyb20gJy4uL2JveC9WQm94Mi5zdmVsdGUnO1xyXG5pbXBvcnQgQnV0dG9uIGZyb20gJy4vQnV0dG9uLnN2ZWx0ZSc7XHJcbmltcG9ydCBFZGl0b3IgZnJvbSAnLi9FZGl0b3Iuc3ZlbHRlJztcclxuaW1wb3J0IExpc3QgZnJvbSAnLi9MaXN0LnN2ZWx0ZSc7XHJcblxyXG5sZXQgbGVmdCA9IDE2NTtcclxuY29uc3QgdG9wID0gJzQ3JztcclxuY29uc3QgdGl0bGUgPSAnLVJvdXRlKHMpLScgXHJcbmNvbnN0IGlkID0gJ3JvdXRlTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcm91dGUvaW5kZXgnKTtcclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoaWQsIGZ1bmN0aW9uKG9wdCkge1xyXG4gICAgb3B0W2lkXSAmJiAobGVmdCA9IG9wdFtpZF0pXHJcbiAgfSk7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xyXG4gIGxlZnQgPSBkZXRhaWwubGVmdFxyXG4gIGNvbnN0IGRhdGEgPSB7fVxyXG4gIGRhdGFbaWRdID0gbGVmdFxyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldChkYXRhKVxyXG59XHJcblxyXG5sZXQgX3RpbWVvdXQgPSBudWxsO1xyXG5mdW5jdGlvbiBvbkNoYW5nZShlKSB7XHJcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH19ID0gd2luZG93Lm1pdG07XHJcbiAgbGV0IHNhdmVEaXNhYmxlZDtcclxuICBpZiAoZT09PWZhbHNlKSB7XHJcbiAgICBzYXZlRGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xyXG4gICAgICAuLi5uLFxyXG4gICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgIGVkaXRidWZmZXI6IF9yb3V0ZS5nZXRWYWx1ZSgpXHJcbiAgICB9fSlcclxuICB9XHJcbiAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KTtcclxuICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgaWYgKF9yb3V0ZSl7XHJcbiAgICAgIHNhdmVEaXNhYmxlZCA9IChfcm91dGUuZ2V0VmFsdWUoKT09PSRzb3VyY2UuZWRpdGJ1ZmZlcilcclxuICAgICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xyXG4gICAgICAgIC4uLm4sXHJcbiAgICAgICAgc2F2ZURpc2FibGVkXHJcbiAgICAgIH19KTtcclxuICAgICAgY29uc29sZS5sb2coZSk7XHJcbiAgICB9XHJcbiAgfSwgNTAwKSAgXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48QnV0dG9uLz5cclxuPFZCb3gyIHt0aXRsZX0ge3RvcH0ge2xlZnR9IHtkcmFnZW5kfSB7TGlzdH0gcHJvcHM9e3tvbkNoYW5nZX19PlxyXG4gIDxFZGl0b3Ige29uQ2hhbmdlfS8+XHJcbjwvVkJveDI+XHJcbiIsIi8vIGZlYXQ6IHByb2ZpbGVcclxuaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3Qgc291cmNlID0gd3JpdGFibGUoe1xyXG4gIG9wZW5EaXNhYmxlZDogZmFsc2UsXHJcbiAgc2F2ZURpc2FibGVkOiB0cnVlLFxyXG4gIGdvRGlzYWJsZWQ6IHRydWUsXHJcbiAgY29udGVudDogJycsXHJcbiAgZnBhdGg6ICcnLFxyXG4gIHBhdGg6ICcnXHJcbn0pXHJcbiIsIjxzY3JpcHQ+Ly8gZmVhdDogcHJvZmlsZVxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBFeGJ1dHRvbiBmcm9tICcuLi9tb25hY28vRXhidXR0b24uc3ZlbHRlJztcclxuXHJcbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xyXG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlIH19ID0gd2luZG93Lm1pdG07XHJcbiAgaWYgKF9wcm9maWxlKSB7XHJcbiAgICBjb25zdCBjb250ZW50ID0gX3Byb2ZpbGUuZ2V0VmFsdWUoKVxyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgc2F2ZURpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgIGVkaXRidWZmZXI6IGNvbnRlbnRcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xyXG4gICAgd3NfX3NlbmQoJ3NhdmVQcm9maWxlJywgJHNvdXJjZSwgZGF0YSA9PiB7XHJcbiAgICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHsuLi5uLCBzYXZlRGlzYWJsZWQ6IHRydWV9fSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdEb25lIFNhdmUhJyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XHJcbiAgY29uc29sZS5sb2coJHNvdXJjZSk7XHJcbiAgd3NfX3NlbmQoJ29wZW5Gb2xkZXInLCAkc291cmNlLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIE9wZW4hJyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bnMoaWQpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzW2lkXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJvdXRlLnVybHMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidG5VcmwoaWQpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzWyRzb3VyY2UuaXRlbV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybHMpIHtcclxuICAgIHJldHVybiByb3V0ZS51cmxzW2lkXTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYnRuVGFnKGUpIHtcclxuICBjaHJvbWUudGFicy51cGRhdGUoe3VybDogZS50YXJnZXQuZGF0YXNldC51cmx9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuR28oZSkge1xyXG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUudXJsKSB7XHJcbiAgICBjaHJvbWUudGFicy51cGRhdGUoe3VybDogcm91dGUudXJsfSk7XHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNpZiAkc291cmNlLnBhdGh9XHJcblx0PGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICB7I2VhY2ggYnRucygkc291cmNlLml0ZW0pIGFzIGl0ZW19XHJcbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5UYWd9XCJcclxuICBkYXRhLXVybD1cIntidG5VcmwoaXRlbSl9XCI+e2l0ZW19PC9idXR0b24+XHJcbiAgey9lYWNofVxyXG4gIDwhLS0gPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBkaXNhYmxlZD17JHNvdXJjZS5nb0Rpc2FibGVkfSBvbjpjbGljaz1cIntidG5Hb31cIj5HbzwvYnV0dG9uPi4gLS0+XHJcbiAgPC9kaXY+XHJcbnsvaWZ9XHJcbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cclxuUGF0aDp7JHNvdXJjZS5wYXRofVxyXG57I2lmICRzb3VyY2UucGF0aH1cclxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxyXG4gIDxFeGJ1dHRvbiBzb3VyY2U9eyRzb3VyY2V9IGVkaXRvcj1cIl9wcm9maWxlXCIvPlxyXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXNhdmVcIiBkaXNhYmxlZD17JHNvdXJjZS5zYXZlRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0blNhdmV9XCI+U2F2ZTwvYnV0dG9uPlxyXG4gIDwvZGl2PlxyXG57L2lmfVxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLmZpbGUtcGF0aCB7XHJcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gIGZvbnQtZmFtaWx5OiBhdXRvO1xyXG4gIGZvbnQtc2l6ZTogMC45ZW07XHJcbiAgY29sb3I6IGJsdWU7XHJcbn1cclxuLmJ0bi1jb250YWluZXIge1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBtYXJnaW4tdG9wOiAtMXB4O1xyXG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcclxuICBwYWRkaW5nLWJvdHRvbTogM3B4O1xyXG4gIHJpZ2h0OiAwO1xyXG4gIHotaW5kZXg6IDU7XHJcbiAgdG9wOiAtMnB4O1xyXG59XHJcbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XHJcbiAgZm9udC1zaXplOiAxMHB4O1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxufVxyXG4uYnRuLWNvbnRhaW5lciBidXR0b246ZGlzYWJsZWQge1xyXG4gIGN1cnNvcjogYXV0bztcclxufVxyXG4udGxiIHtcclxuICBib3JkZXI6IG5vbmU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG4gIGltcG9ydCB7IGNmZywgcmVzaXplIH0gZnJvbSAnLi4vbW9uYWNvL2luaXQnO1xyXG5cclxuICBleHBvcnQgbGV0IG9uQ2hhbmdlO1xyXG5cclxuICBvbk1vdW50KGFzeW5jICgpID0+IHtcclxuICAgIGZ1bmN0aW9uIGluaXRDb2RlRWRpdG9yKHNyYykge1xyXG4gICAgICBjb25zb2xlLmxvZygnbG9hZCBtb25hY286IHByb2ZpbGUnKVxyXG4gICAgICBjb25zdCBlbGVtZW50ID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9maWxlJyk7XHJcbiAgICAgIGNvbnN0IF9wcm9maWxlID0gIHdpbmRvdy5tb25hY28uZWRpdG9yLmNyZWF0ZShlbGVtZW50LCBjZmcpO1xyXG4gICAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoX3Byb2ZpbGUpKVxyXG4gICAgICByby5vYnNlcnZlKGVsZW1lbnQpO1xyXG5cclxuICAgICAgd2luZG93Lm1pdG0uZWRpdG9yLl9wcm9maWxlID0gX3Byb2ZpbGU7XHJcbiAgICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVsID0gZWxlbWVudDtcclxuXHJcbiAgICAgIF9wcm9maWxlLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KG9uQ2hhbmdlKTtcclxuICAgICAgX3Byb2ZpbGUuc2V0VmFsdWUoc3JjKTtcclxuICAgIH1cclxuICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVkaXQgPSBpbml0Q29kZUVkaXRvcjtcclxuICB9KTtcclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwiZWRpdC1jb250YWluZXJcIj5cclxuICA8ZGl2IGlkPVwicHJvZmlsZVwiPlxyXG4gIDwvZGl2PlxyXG48L2Rpdj5cclxuIiwiPHNjcmlwdD4gLy8gZmVhdDogcHJvZmlsZVxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW07XHJcbmV4cG9ydCBsZXQgb25DaGFuZ2U7XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGxldCB7aXRlbX0gPSBlLnRhcmdldC5kYXRhc2V0O1xyXG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlLCBfcHJvZmlsZUVkaXQgfSwgZmlsZXMgfSA9IG1pdG07XHJcbiAgY29uc3Qgb2JqID0gZmlsZXMucHJvZmlsZVtpdGVtXTtcclxuICBjb25zdCB1cmwgPSBpdGVtO1xyXG4gIGNvbnNvbGUubG9nKGl0ZW0sIG9iaik7XHJcblxyXG4gIGlmIChfcHJvZmlsZT09PXVuZGVmaW5lZCkge1xyXG4gICAgX3Byb2ZpbGVFZGl0KG9iai5jb250ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgX3Byb2ZpbGUuc2V0VmFsdWUob2JqLmNvbnRlbnQgfHwgJycpO1xyXG4gICAgX3Byb2ZpbGUucmV2ZWFsTGluZSgxKTtcclxuICB9XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBvbkNoYW5nZShmYWxzZSk7XHJcblxyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGdvRGlzYWJsZWQ6ICh1cmw9PT11bmRlZmluZWQpLFxyXG4gICAgICAgIGNvbnRlbnQ6IG9iai5jb250ZW50LFxyXG4gICAgICAgIGZwYXRoOiBvYmouZnBhdGgsXHJcbiAgICAgICAgcGF0aDogb2JqLnBhdGgsXHJcbiAgICAgICAgaXRlbSxcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSwgMSk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5mcGF0aD09PWl0ZW0uZnBhdGh9XCJcclxuICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cclxuICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuPntpdGVtLnRpdGxlfTwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udGQtaXRlbSB7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIHBhZGRpbmc6IDAuMXJlbTtcclxuICBsaW5lLWhlaWdodDogMTVweDtcclxuICBwYWRkaW5nLWxlZnQ6IDVweDtcclxuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2MwZDhjY2ExO1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBvbkNoYW5nZTtcclxuXHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcclxuXHJcbmxldCByZXJlbmRlciA9IDA7XHJcbmxldCBkYXRhID0gW107XHJcblxyXG4kOiBfZGF0YSA9IGRhdGE7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcHJvZmlsZS9saXN0Jyk7XHJcbiAgX3dzX2Nvbm5lY3QucHJvZmlsZU9uTW91bnQgPSAoKSA9PiB3c19fc2VuZCgnZ2V0UHJvZmlsZScsICcnLCBwcm9maWxlSGFuZGxlcik7XHJcbn0pO1xyXG5cclxuY29uc3QgcHJvZmlsZUhhbmRsZXIgPSBvYmogPT4ge1xyXG4gIGNvbnNvbGUud2Fybignd3NfX3NlbmQoZ2V0UHJvZmlsZSknLCBvYmopO1xyXG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlPT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlID0gb2JqO1xyXG4gICAgZGF0YSA9IG9iajtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3Qge3Byb2ZpbGV9ID0gd2luZG93Lm1pdG0uZmlsZXM7XHJcbiAgICBjb25zdCBuZXdwcm9maWxlID0ge307XHJcbiAgICBmb3IgKGxldCBrIGluIG9iaikge1xyXG4gICAgICBuZXdwcm9maWxlW2tdID0gcHJvZmlsZVtrXSA/IHByb2ZpbGVba10gOiBvYmpba107XHJcbiAgICAgIG5ld3Byb2ZpbGVba10uY29udGVudCA9IG9ialtrXS5jb250ZW50O1xyXG4gICAgfVxyXG4gICAgZGF0YSA9IG5ld3Byb2ZpbGU7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlID0gbmV3cHJvZmlsZVxyXG4gIH1cclxuICAvKipcclxuICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcclxuICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMuZ2V0UHJvZmlsZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XHJcbiAgICovXHJcbiAgY29uc3Qge2dldFByb2ZpbGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xyXG4gIGZvciAobGV0IGtleSBpbiBnZXRQcm9maWxlX2V2ZW50cykge1xyXG4gICAgZ2V0UHJvZmlsZV9ldmVudHNba2V5XShkYXRhKTtcclxuICB9XHJcbiAgcmVyZW5kZXIgPSByZXJlbmRlciArIDE7XHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZpbGVzLnByb2ZpbGVfZXZlbnRzLnByb2ZpbGVUYWJsZSA9ICgpID0+IHtcclxuICBjb25zb2xlLmxvZygncHJvZmlsZVRhYmxlIGdldHRpbmcgY2FsbGVkISEhJyk7XHJcbiAgd2luZG93LndzX19zZW5kKCdnZXRQcm9maWxlJywgJycsIHByb2ZpbGVIYW5kbGVyKTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YSkgYXMgaXRlbX1cclxuICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSB7b25DaGFuZ2V9Lz5cclxuey9lYWNofVxyXG4iLCI8c2NyaXB0PiAvLyBmZWF0OiBwcm9maWxlXHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XHJcbmltcG9ydCBCdXR0b24gZnJvbSAnLi9CdXR0b24uc3ZlbHRlJztcclxuaW1wb3J0IEVkaXRvciBmcm9tICcuL0VkaXRvci5zdmVsdGUnO1xyXG5pbXBvcnQgTGlzdCBmcm9tICcuL0xpc3Quc3ZlbHRlJztcclxuXHJcbmxldCBsZWZ0ID0gMTY1O1xyXG5jb25zdCB0b3AgPSAnNDcnO1xyXG5jb25zdCB0aXRsZSA9ICctUHJvZmlsZShzKS0nIFxyXG5jb25zdCBpZCA9ICdwcm9maWxlTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcHJvZmlsZS9pbmRleCcpO1xyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XHJcbiAgICBvcHRbaWRdICYmIChsZWZ0ID0gb3B0W2lkXSlcclxuICB9KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XHJcbiAgY29uc3QgZGF0YSA9IHt9XHJcbiAgZGF0YVtpZF0gPSBsZWZ0XHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXHJcbn1cclxuXHJcbmxldCBfdGltZW91dCA9IG51bGw7XHJcbmZ1bmN0aW9uIG9uQ2hhbmdlKGUpIHtcclxuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xyXG4gIGxldCBzYXZlRGlzYWJsZWQ7XHJcbiAgaWYgKGU9PT1mYWxzZSkge1xyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xyXG4gICAgICAuLi5uLFxyXG4gICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgIGVkaXRidWZmZXI6IF9wcm9maWxlLmdldFZhbHVlKClcclxuICAgIH19KVxyXG4gICAgXHJcbiAgfVxyXG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XHJcbiAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGlmIChfcHJvZmlsZSl7XHJcbiAgICAgIHNhdmVEaXNhYmxlZCA9IChfcHJvZmlsZS5nZXRWYWx1ZSgpPT09JHNvdXJjZS5lZGl0YnVmZmVyKVxyXG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7XHJcbiAgICAgICAgLi4ubixcclxuICAgICAgICBzYXZlRGlzYWJsZWRcclxuICAgICAgfX0pO1xyXG4gICAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgIH1cclxuICB9LCA1MDApICBcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24vPlxyXG48VkJveDIge3RpdGxlfSB7dG9wfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fSBwcm9wcz17e29uQ2hhbmdlfX0+XHJcbiAgPEVkaXRvciB7b25DaGFuZ2V9Lz5cclxuPC9WQm94Mj5cclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3QgbG9nc3RvcmUgPSB3cml0YWJsZSh7XHJcbiAgcmVzcEhlYWRlcjoge30sXHJcbiAgcmVzcG9uc2U6ICcnLFxyXG4gIGhlYWRlcnM6ICcnLFxyXG4gIGxvZ2lkOiAnJyxcclxuICB0aXRsZTogJycsXHJcbiAgcGF0aDogJycsXHJcbiAgdXJsOiAnJyxcclxuICBleHQ6ICcnXHJcbn0pXHJcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IGNsaWVudCA9IHdyaXRhYmxlKHtcclxuICAuLi53aW5kb3cubWl0bS5jbGllbnRcclxufSlcclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3Qgc3RhdGVzID0gd3JpdGFibGUoe1xyXG4gIGNoZXZyb246ICdbPj5dJyxcclxuICBzdGF0ZTI6IHt9LFxyXG4gIHN0YXRlMzoge30sXHJcbn0pXHJcbiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgcTtcclxuZXhwb3J0IGxldCBuYW1lO1xyXG5pbXBvcnQgeyBzdGF0ZXMgfSBmcm9tICcuL3N0YXRlcy5qcyc7XHJcbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSc7XHJcblxyXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG5cclxuZnVuY3Rpb24gYnRuQ2xvc2UoZSkge1xyXG4gIGNvbnN0IGFsbCA9IHsuLi4kc3RhdGVzfVxyXG4gIGFsbFtuYW1lXVtxXSA9IGZhbHNlXHJcbiAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAke3F9IGRldGFpbHNbb3Blbl1gKVxyXG4gIG5vZGVzLmZvckVhY2gobm9kZSA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpKVxyXG4gIHN0YXRlcy5zZXQoYWxsKVxyXG4gIGRpc3BhdGNoKCdtZXNzYWdlJywge2FsbCwgbmFtZX0pIC8vIGZlYXQ6IGF1dG8gY29sbGFwc2VkIGJldHdlZW4gdGFnMiAmIHRhZzNcclxuXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48YnV0dG9uIGNsYXNzPVwiY29sbGFwc2VcIiBvbjpjbGljaz1cIntidG5DbG9zZX1cIj5bLV08L2J1dHRvbj5cclxuXHJcbjxzdHlsZT5cclxuYnV0dG9uIHtcclxuICBib3JkZXI6IDA7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIGNvbG9yOiAjMDAyYWZmO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgbWFyZ2luLXJpZ2h0OiAtNXB4O1xyXG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgcGFkZGluZzogMXB4IDFweCAycHggMXB4O1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IHE7XHJcbmV4cG9ydCBsZXQgbmFtZTtcclxuaW1wb3J0IHsgc3RhdGVzIH0gZnJvbSAnLi9zdGF0ZXMuanMnO1xyXG5pbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnO1xyXG5cclxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oZSkge1xyXG4gIGNvbnN0IGFsbCA9IHsuLi4kc3RhdGVzfVxyXG4gIGFsbFtuYW1lXVtxXSA9ICFhbGxbbmFtZV1bcV1cclxuICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCR7cX0gZGV0YWlsc2ApXHJcbiAgaWYgKGFsbFtuYW1lXVtxXSkge1xyXG4gICAgbm9kZXMuZm9yRWFjaChub2RlID0+IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpKVxyXG4gIH0gZWxzZSB7XHJcbiAgICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4gbm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKSlcclxuICB9XHJcbiAgc3RhdGVzLnNldChhbGwpXHJcbiAgZGlzcGF0Y2goJ21lc3NhZ2UnLCB7YWxsLCBuYW1lfSkgLy8gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnM1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGJ1dHRvbiBvbjpjbGljayBjbGFzcz1cImV4cGFuZFwiIG9uOmNsaWNrPVwie2J0bk9wZW59XCI+WzxiPis8L2I+XTwvYnV0dG9uPlxyXG5cclxuPHN0eWxlPlxyXG5idXR0b24ge1xyXG4gIGJvcmRlcjogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgY29sb3I6ICMwMDJhZmY7XHJcbiAgbWFyZ2luLXRvcDogLTFweDtcclxuICBtYXJnaW4tcmlnaHQ6IC01cHg7XHJcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcclxuICBwYWRkaW5nOiAxcHggMXB4IDJweCAxcHg7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogNzAwO1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCAgQ29sbGFwc2UgZnJvbSAnLi4vYnV0dG9uL0NvbGxhcHNlLnN2ZWx0ZSc7XHJcbmltcG9ydCAgRXhwYW5kIGZyb20gJy4uL2J1dHRvbi9FeHBhbmQuc3ZlbHRlJztcclxubGV0IHN0ID0ge1xyXG4gIGNvbGxhcHNlOiB0cnVlLFxyXG4gIGV4cGFuZDogZmFsc2VcclxufTtcclxuXHJcbmZ1bmN0aW9uIGJ0bkNsZWFyKGUpIHtcclxuICBjb25zdCBkYXRhID0ge31cclxuICBjb25zdCBhcnIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzdW1tYXJ5LnRydWUnKTtcclxuICBpZiAoYXJyLmxlbmd0aCkge1xyXG4gICAgY29uc3QgZm9sZGVycyA9IFtdXHJcbiAgICBmb3IgKGxldCBub2RlIG9mIGFycikge1xyXG4gICAgICBmb2xkZXJzLnB1c2gobm9kZS5kYXRhc2V0LnBhdGgpXHJcbiAgICB9XHJcbiAgICBkYXRhLmZvbGRlcnMgPSBmb2xkZXJzXHJcbiAgfVxyXG4gIHdzX19zZW5kKCdjbGVhckxvZ3MnLCBkYXRhLCBkYXRhID0+IHtcclxuICAgIC8vIGxvZ3MgdmlldyB3aWxsIGJlIGNsb3NlIHdoZW4gLmxvZ19ldmVudHMuTG9nc1RhYmxlXHJcbiAgICAvLyBsb2dzdG9yZS5zZXQoKSB0byBlbXB0eSBvbiBUYWJsZS5zdmVsdGUgXHJcbiAgICB3aW5kb3cubWl0bS5jbGllbnQuY2xlYXIgPSB0cnVlO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgQ2xlYXIhJyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvb2dsZShwcm9wKSB7XHJcbiAgY2xpZW50LnVwZGF0ZShuID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLiRjbGllbnQsXHJcbiAgICAgIC4uLnByb3AsXHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgY29uc29sZS5sb2coJGNsaWVudCk7XHJcbiAgd3NfX3NlbmQoJ3NldENsaWVudCcsIHsuLi5wcm9wfSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBjaGFuZ2Ugc3RhdGUnLCBkYXRhKTtcclxuICAgIHdpbmRvdy5taXRtLmNsaWVudCA9IGRhdGE7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bkhvc3Rzd2NoKGUpIHtcclxuICB0b29nbGUoe25vaG9zdGxvZ3M6ICFlLnRhcmdldC5jaGVja2VkfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bkFyZ3N3Y2goZSkge1xyXG4gIHRvb2dsZSh7bm9hcmdsb2dzOiAhZS50YXJnZXQuY2hlY2tlZH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBob3N0ZmxhZygpIHtcclxuICByZXR1cm4gIXdpbmRvdy5taXRtLmNsaWVudC5ub2hvc3Rsb2dzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhcmdzZmxhZygpIHtcclxuICByZXR1cm4gIXdpbmRvdy5taXRtLmNsaWVudC5ub2FyZ2xvZ3M7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiIHN0eWxlPVwidG9wOiAxcHg7XCI+XHJcbiAgPGlucHV0IGNsYXNzPVwic3RvcFwiIG9uOmNsaWNrPVwie2J0bkNsZWFyfVwiIHR5cGU9XCJpbWFnZVwiIHNyYz1cImltYWdlcy9zdG9wLnN2Z1wiIGFsdD1cIlwiLz5cclxuICA8Q29sbGFwc2Uge3N0fSBxPVwiI2xpc3QtbG9nc1wiPjwvQ29sbGFwc2U+XHJcbiAgPEV4cGFuZCB7c3R9IHE9XCIjbGlzdC1sb2dzXCI+PC9FeHBhbmQ+XHJcbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj5cclxuICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuSG9zdHN3Y2h9IGNoZWNrZWQ9e2hvc3RmbGFnKCl9Pmhvc3RcclxuICA8L2xhYmVsPlxyXG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XHJcbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0bkFyZ3N3Y2h9IGNoZWNrZWQ9e2FyZ3NmbGFnKCl9PmFyZ3NcclxuICA8L2xhYmVsPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLmJ0bi1jb250YWluZXIge1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBtYXJnaW4tdG9wOiAtMXB4O1xyXG4gIGxlZnQ6IDQ4cHg7XHJcbiAgdG9wOiAtM3B4O1xyXG59XHJcbi5jaGVja2JveCB7XHJcbiAgdmVydGljYWwtYWxpZ246IHRvcDtcclxuICBwYWRkaW5nLXRvcDogMnB4O1xyXG59XHJcbi5jaGVja2JveCBpbnB1dCB7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIG1hcmdpbi1yaWdodDogMnB4O1xyXG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XHJcbn1cclxuaW5wdXQuc3RvcCB7XHJcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gIG1hcmdpbi1yaWdodDogMTBweDtcclxuICB0b3A6IDEuNXB4O1xyXG4gIGxlZnQ6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5cclxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XHJcblxyXG5jb25zdCBtID0ge1xyXG4gIFBPU1Q6ICAncG9zdCcsXHJcbiAgUFVUOiAgICdwdXQgJyxcclxuICBHRVQ6ICAgJ2dldCAnLFxyXG4gIERFTEVURTonZGVsICcsXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVtcHR5KCkge1xyXG4gIGxvZ3N0b3JlLnNldCh7XHJcbiAgICByZXNwSGVhZGVyOiB7fSxcclxuICAgIHJlc3BvbnNlOiAnJyxcclxuICAgIGhlYWRlcnM6ICcnLFxyXG4gICAgbG9naWQ6ICcnLFxyXG4gICAgdGl0bGU6ICcnLFxyXG4gICAgcGF0aDogJycsXHJcbiAgICB1cmw6ICcnLFxyXG4gICAgZXh0OiAnJyxcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGxldCB7bG9naWR9ID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQ7XHJcbiAgaWYgKGxvZ2lkPT09JGxvZ3N0b3JlLmxvZ2lkKSB7XHJcbiAgICBlbXB0eSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBlbXB0eSgpO1xyXG4gICAgY29uc3QgbyA9IHdpbmRvdy5taXRtLmZpbGVzLmxvZ1tpdGVtLmtleV1bbG9naWRdO1xyXG4gICAgY29uc3Qgc3JjID0ge1xyXG4gICAgICByZXNwSGVhZGVyOiBvLnJlc3BIZWFkZXIsXHJcbiAgICAgIHJlc3BvbnNlOiAnPGVtcHR5PicsXHJcbiAgICAgIGhlYWRlcnM6ICc8ZW1wdHk+JyxcclxuICAgICAgbG9naWQ6IGxvZ2lkLFxyXG4gICAgICB0aXRsZTogby50aXRsZSxcclxuICAgICAgcGF0aDogby5wYXRoLFxyXG4gICAgICB1cmw6IGxvZ2lkLnJlcGxhY2UoL14uK1xcLm1pdG0tcGxheS8sJ2h0dHBzOi8vbG9jYWxob3N0OjMwMDEnKSxcclxuICAgICAgZXh0OiBvLmV4dCxcclxuICAgIH1cclxuICAgIGlmIChvLnRpdGxlLm1hdGNoKCcucG5nJykpIHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgbG9nc3RvcmUudXBkYXRlKG4gPT4gc3JjKVxyXG4gICAgICB9LCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdzX19zZW5kKCdnZXRDb250ZW50Jywge2ZwYXRoOiBsb2dpZH0sICh7aGVhZGVycywgcmVzcG9uc2UsIGV4dH0pID0+IHtcclxuICAgICAgICBsb2dzdG9yZS51cGRhdGUobiA9PiB7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAuLi5zcmMsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICBoZWFkZXJzLFxyXG4gICAgICAgICAgICBleHQsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YXR1cyh7Z2VuZXJhbDpnfSkge1xyXG4gIGlmIChnPT09dW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gJydcclxuICB9XHJcbiAgcmV0dXJuIGBfJHtNYXRoLnRydW5jKGcuc3RhdHVzLzEwMCl9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhdHVzMih7Z2VuZXJhbDpnfSkge1xyXG4gIGlmIChnPT09dW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gJydcclxuICB9XHJcbiAgcmV0dXJuIGcuc3RhdHVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtZXRob2Qoe2dlbmVyYWw6Z30pIHtcclxuICBpZiAoZz09PXVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuICcnXHJcbiAgfVxyXG4gIHJldHVybiBgJHttW2cubWV0aG9kXX1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtZXRob2QyKHtnZW5lcmFsOmd9KSB7XHJcbiAgaWYgKGc9PT11bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnJ1xyXG4gIH1cclxuICByZXR1cm4gbVtnLm1ldGhvZF0gKyAoZy5leHQgPyBgPCR7Zy5leHQucGFkRW5kKDQsICcgJyl9PiBgIDogJycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cmwoe2dlbmVyYWw6Z30pIHtcclxuICBsZXQgbXNnXHJcbiAgaWYgKGc9PT11bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnJ1xyXG4gIH1cclxuICBpZiAoZy51cmwubWF0Y2goJy9sb2cvJykpIHtcclxuICAgIG1zZyA9IGcudXJsLnNwbGl0KCdAJylbMV07XHJcbiAgfSBlbHNlIGlmICgkY2xpZW50Lm5vaG9zdGxvZ3MpIHtcclxuICAgIG1zZyA9IGcucGF0aDtcclxuICB9IGVsc2Uge1xyXG4gICAgbXNnID0gYCR7Zy51cmwuc3BsaXQoJz8nKVswXX1gO1xyXG4gIH1cclxuICBpZiAoJGNsaWVudC5ub2hvc3Rsb2dzKSB7XHJcbiAgICBpZiAoZy51cmwubWF0Y2goJy1zc2hvdEAnKSkge1xyXG4gICAgICBtc2cgPSBnLnVybC5zcGxpdCgnficpLnBvcCgpXHJcbiAgICB9IGVsc2UgaWYgKGcuZXh0PT09JycpIHtcclxuICAgICAgY29uc3QgW2ExLGEyXSA9IG1zZy5zcGxpdCgnLS0nKTtcclxuICAgICAgbXNnID0gYTIgfHwgYTE7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChnLnVybC5tYXRjaCgnLXNzaG90QCcpKSB7XHJcbiAgICBtc2cgPSAobmV3IFVSTChtc2cpKS5wYXRobmFtZSBcclxuICB9XHJcbiAgcmV0dXJuIG1zZztcclxufVxyXG5cclxuZnVuY3Rpb24gcHRoKHtnZW5lcmFsOmd9KSB7XHJcbiAgaWYgKGc9PT11bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnJ1xyXG4gIH1cclxuICBpZiAoJGNsaWVudC5ub2FyZ2xvZ3MgfHwgZy51cmwubWF0Y2goJy9sb2cvJykpIHtcclxuICAgIHJldHVybiAnJztcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgcGFybXMgPSBnLnVybC5zcGxpdCgnPycpWzFdO1xyXG4gICAgcmV0dXJuIHBhcm1zID8gYD8ke3Bhcm1zfWAgOiAnJztcclxuICB9XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidGQtaXRlbSB7JGxvZ3N0b3JlLmxvZ2lkPT09aXRlbS5sb2dpZH1cIlxyXG5kYXRhLWxvZ2lkPXtpdGVtLmxvZ2lkfVxyXG5vbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuPlxyXG4gIDxzcGFuIGNsYXNzPVwic3RhdHVzIHtzdGF0dXMoaXRlbSl9XCI+e3N0YXR1czIoaXRlbSl9PC9zcGFuPlxyXG4gIDxzcGFuIGNsYXNzPVwibWV0aG9kIHttZXRob2QoaXRlbSl9XCI+e21ldGhvZDIoaXRlbSl9PC9zcGFuPlxyXG4gIDxzcGFuIGNsYXNzPVwidXJsXCI+e3VybChpdGVtKX08L3NwYW4+XHJcbiAgPHNwYW4gY2xhc3M9XCJwcm1cIj57cHRoKGl0ZW0pfTwvc3Bhbj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi50ZC1pdGVtOmhvdmVyIHtcclxuICBjb2xvcjogYmx1ZTtcclxuICBiYWNrZ3JvdW5kOiB5ZWxsb3dcclxuICAvKiBmb250LXdlaWdodDogYm9sZGVyOyAqL1xyXG59XHJcbi50ZC1pdGVtIHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xyXG59XHJcbi5zdGF0dXMge1xyXG4gIGNvbG9yOiBncmVlbjtcclxuICBmb250LXdlaWdodDogYm9sZDtcclxufVxyXG4uc3RhdHVzLl80LFxyXG4uc3RhdHVzLl81IHtcclxuICBjb2xvcjogcmVkO1xyXG59XHJcbi5tZXRob2Qge1xyXG4gIGNvbG9yOiBncmVlbjtcclxuICBmb250LXdlaWdodDogYm9sZDtcclxufVxyXG4ubWV0aG9kLnB1dCB7XHJcbiAgY29sb3I6ICM3ZTI2YTc7XHJcbn1cclxuLm1ldGhvZC5wb3N0IHtcclxuICBjb2xvcjogI2E3MjY3ZjtcclxufVxyXG4ubWV0aG9kLmRlbGV0ZSB7XHJcbiAgY29sb3I6IHJlZDtcclxufVxyXG4ucHJtIHtcclxuICBjb2xvcjogI2NjYjdiNztcclxuICBtYXJnaW4tbGVmdDogLTZweDtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgaXRlbTsgXHJcbmV4cG9ydCBsZXQga2V5O1xyXG5cclxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5sZXQgX2NoZWNrZWQgPSBmYWxzZTtcclxuXHJcbmZ1bmN0aW9uIGRhdGEoaSkge1xyXG4gIGNvbnN0IGlkID0gT2JqZWN0LmtleXMoaSlbMF1cclxuICBjb25zdCBhcnIgPSBpW2lkXS5wYXRoLnNwbGl0KCcvJylcclxuICBhcnIucG9wKClcclxuICByZXR1cm4gYXJyLmpvaW4oJy8nKVxyXG59XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGNvbnN0IG5vZGUgPSBlLmN1cnJlbnRUYXJnZXQ7XHJcbiAgbGV0IHtwYXRofSA9IG5vZGUucGFyZW50RWxlbWVudC5kYXRhc2V0O1xyXG4gIF9jaGVja2VkID0gbm9kZS5jaGVja2VkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBrbGFzcyhzdG9yZSkge1xyXG4gIGZvciAoY29uc3QgaXRtIGluIGl0ZW0pIHtcclxuICAgIGlmIChpdG09PT1zdG9yZS5sb2dpZCkge1xyXG4gICAgICByZXR1cm4gJyBjaGsnXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAnJ1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHN1bW1hcnlcclxuICBkYXRhLXBhdGg9e2RhdGEoaXRlbSl9XHJcbiAgY2xhc3M9XCJ7X2NoZWNrZWR9e2tsYXNzKCRsb2dzdG9yZSl9XCJcclxuPlxyXG4gIDxpbnB1dCBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCIgdHlwZT1cImNoZWNrYm94XCIgLz5cclxuICB7QGh0bWwga2V5fVxyXG48L3N1bW1hcnk+XHJcblxyXG48c3R5bGU+XHJcbiAgc3VtbWFyeS5jaGsge1xyXG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICAgIGJhY2tncm91bmQ6ICNlNmY3ZDk7XHJcbiAgfVxyXG4gIHN1bW1hcnkudHJ1ZSB7XHJcbiAgICBiYWNrZ3JvdW5kOiAjZjNkZGRkO1xyXG4gIH1cclxuICBzdW1tYXJ5OmhvdmVyIHtcclxuICAgIGJhY2tncm91bmQ6ICNlYWU0ZjE7XHJcbiAgfVxyXG4gIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXSB7XHJcbiAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xyXG4gIH1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xyXG5pbXBvcnQgU3VtbWFyeSBmcm9tICcuL1N1bW1hcnkuc3ZlbHRlJztcclxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSAnLi4vb3RoZXIvc3RvcmVzLmpzJztcclxuXHJcbmxldCByZXJlbmRlciA9IDA7XHJcbmxldCBkYXRhID0gW107XHJcblxyXG4kOiBfZGF0YSA9IGRhdGE7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncy9saXN0Jyk7XHJcbiAgX3dzX2Nvbm5lY3QubG9nT25Nb3VudCA9ICgpID0+IHdzX19zZW5kKCdnZXRMb2cnLCAnJywgbG9nSGFuZGxlcik7XHJcbn0pO1xyXG5cclxuY29uc3QgbG9nSGFuZGxlciA9IG9iaiA9PiB7XHJcbiAgY29uc29sZS53YXJuKCd3c19fc2VuZChnZXRMb2cpJywgb2JqKTtcclxuICBpZiAoIHdpbmRvdy5taXRtLmNsaWVudC5jbGVhcikge1xyXG4gICAgZGVsZXRlIHdpbmRvdy5taXRtLmNsaWVudC5jbGVhcjtcclxuICAgIGxvZ3N0b3JlLnNldCh7XHJcbiAgICAgIHJlc3BIZWFkZXI6IHt9LFxyXG4gICAgICByZXNwb25zZTogJycsXHJcbiAgICAgIGhlYWRlcnM6ICcnLFxyXG4gICAgICBsb2dpZDogJycsXHJcbiAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgcGF0aDogJycsXHJcbiAgICAgIHVybDogJycsXHJcbiAgICAgIGV4dDogJycsXHJcbiAgICB9KVxyXG4gIH1cclxuICBjb25zdCB7ZmlsZXN9ID0gd2luZG93Lm1pdG1cclxuICBpZiAoZmlsZXMubG9nPT09dW5kZWZpbmVkKSB7XHJcbiAgICBmaWxlcy5sb2cgPSBvYmo7XHJcbiAgICBkYXRhID0gb2JqO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCB7bG9nfSA9IGZpbGVzO1xyXG4gICAgY29uc3QgbmV3TG9nID0ge307XHJcbiAgICBmb3IgKGxldCBrIGluIG9iaikge1xyXG4gICAgICBuZXdMb2dba10gPSBvYmpba107XHJcbiAgICB9XHJcbiAgICBkYXRhID0gbmV3TG9nO1xyXG4gICAgY29uc3QgbG4xID0gT2JqZWN0LmtleXMobG9nKVxyXG4gICAgY29uc3QgbG4yID0gT2JqZWN0LmtleXMobmV3TG9nKVxyXG4gICAgaWYgKGxuMjxsbjEpIHtcclxuICAgICAgY29uc3Qgbm9kZXMxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QtbG9ncyBkZXRhaWxzW29wZW5dJylcclxuICAgICAgbm9kZXMxLmZvckVhY2gobm9kZSA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpKVxyXG5cclxuICAgICAgY29uc3Qgbm9kZXMyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QtbG9ncyBzdW1tYXJ5IGlucHV0OmNoZWNrZWQnKVxyXG4gICAgICBub2RlczIuZm9yRWFjaChub2RlID0+IG5vZGUuY2hlY2tlZCA9IGZhbHNlKVxyXG4gICAgfVxyXG4gICAgZmlsZXMubG9nID0gbmV3TG9nXHJcbiAgfVxyXG59XHJcblxyXG53aW5kb3cubWl0bS5maWxlcy5sb2dfZXZlbnRzLkxvZ3NUYWJsZSA9ICgpID0+IHtcclxuICB3c19fc2VuZCgnZ2V0TG9nJywgJycsIGxvZ0hhbmRsZXIpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vaG9zdGxvZ3MoZmxhZykge1xyXG4gIGNvbnNvbGUubG9nKCdub2hvc3Rsb2dzJywgZmxhZyk7XHJcbn1cclxuXHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBpZD1cImxpc3QtbG9nc1wiPlxyXG4gIHsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YSkgYXMga2V5LCBpfVxyXG4gICAgPGRldGFpbHM+PFN1bW1hcnkgaXRlbT17X2RhdGFba2V5XX0ge2tleX0gLz5cclxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhW2tleV0pIGFzIGxvZ2lkfVxyXG4gICAgICA8SXRlbSBpdGVtPXt7XHJcbiAgICAgICAga2V5LFxyXG4gICAgICAgIGxvZ2lkLFxyXG4gICAgICAgIC4uLl9kYXRhW2tleV1bbG9naWRdLFxyXG4gICAgICAgIG5vaG9zdGxvZ3M6ICRjbGllbnQubm9ob3N0bG9ncyxcclxuICAgICAgICB9fS8+XHJcbiAgICAgIHsvZWFjaH1cclxuICAgIDwvZGV0YWlscz4gIFxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IHRhYnN0b3JlID0gd3JpdGFibGUoe1xyXG4gIGVkaXRvcjoge30sXHJcbiAgdGFiOiAwXHJcbn0pXHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xyXG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIGJ0bk1pbigpIHtcclxuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xyXG4gIGNvbnN0IGlkID0gYGVkaXQke3RhYisxfWA7XHJcbiAgZWRpdG9yW2lkXS50cmlnZ2VyKCdmb2xkJywgJ2VkaXRvci5mb2xkQWxsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0blBsdXMoKSB7XHJcbiAgY29uc3Qge3RhYiwgZWRpdG9yfSA9ICR0YWJzdG9yZTtcclxuICBjb25zdCBpZCA9IGBlZGl0JHt0YWIrMX1gO1xyXG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XHJcbiAgbGV0IGFyciA9ICRsb2dzdG9yZS5wYXRoLnNwbGl0KCcvJylcclxuICBhcnIucG9wKCk7XHJcbiAgY29uc3QgcGF0aCA9IGFyci5qb2luKCcvJyk7XHJcbiAgY29uc29sZS5sb2coe3BhdGh9KTtcclxuICB3c19fc2VuZCgnb3BlbkZvbGRlcicsIHtwYXRofSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBPcGVuIScpO1xyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1wbHVzXCIgb246Y2xpY2s9XCJ7YnRuUGx1c31cIj5bKytdPC9idXR0b24+IC1cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1vcGVuXCIgb246Y2xpY2s9XCJ7YnRuT3Blbn1cIj5PcGVuPC9idXR0b24+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IC0ycHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcclxuICBib3JkZXI6IDA7XHJcbiAgcGFkZGluZzogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcclxuICBjdXJzb3I6IGF1dG87XHJcbn1cclxuLnRsYiB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgY2ZnLCByZXNpemUgfSBmcm9tICcuLi9tb25hY28vaW5pdCc7XHJcbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7IFRhYiB9IGZyb20gJ3N2ZWxtYSc7XHJcblxyXG5jb25zdCBvcHRpb24gPSB7XHJcbiAgLi4uY2ZnLFxyXG4gIHJlYWRPbmx5OiB0cnVlLFxyXG4gIGNvbnRleHRtZW51OiBmYWxzZSxcclxufVxyXG5cclxubGV0IG5vZGUxO1xyXG5sZXQgbm9kZTI7XHJcbmxldCBub2RlMztcclxuXHJcbmxldCBlZGl0MTtcclxubGV0IGVkaXQyO1xyXG5sZXQgZWRpdDM7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncyAtIEJhc2VUYWIuc3ZlbHRlJyk7XHJcbiAgY29uc29sZS5sb2coJGxvZ3N0b3JlKVxyXG4gIGNvbnN0IGV4dCA9ICRsb2dzdG9yZS5leHQ9PT0nanMnID8gJ2phdmFzY3JpcHQnIDogJGxvZ3N0b3JlLmV4dFxyXG4gIGNvbnN0IGhkcnMgPSBKU09OLnBhcnNlKCRsb2dzdG9yZS5oZWFkZXJzKTtcclxuICBjb25zdCBjc3AzID0gaGRycy5DU1AgfHwge307XHJcbiAgY29uc3QgdmFsMSA9IHtcclxuICAgIC4uLm9wdGlvbixcclxuICAgIGxhbmd1YWdlOiAnanNvbicsXHJcbiAgICB2YWx1ZTogJGxvZ3N0b3JlLmhlYWRlcnMsXHJcbiAgfTtcclxuICBjb25zdCB2YWwyID0ge1xyXG4gICAgLi4ub3B0aW9uLFxyXG4gICAgbGFuZ3VhZ2U6IGV4dCxcclxuICAgIHZhbHVlOiAkbG9nc3RvcmUucmVzcG9uc2UsXHJcbiAgfTtcclxuICBjb25zdCB2YWwzID0ge1xyXG4gICAgLi4ub3B0aW9uLFxyXG4gICAgbGFuZ3VhZ2U6ICdqc29uJyxcclxuICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeShjc3AzLCBudWxsLCAyKSxcclxuICB9O1xyXG4gIGNvbnN0IGN0eXBlID0gJGxvZ3N0b3JlLnJlc3BIZWFkZXJbXCJjb250ZW50LXR5cGVcIl0gfHwgJ3RleHQvcGxhaW4nO1xyXG4gIGlmIChjdHlwZS5tYXRjaCgnaHRtbCcpKSB7XHJcbiAgICB2YWwyLnZhbHVlID0gdmFsMi52YWx1ZS5cclxuICAgIHJlcGxhY2UoL1xcXFxuXFxcXG4vZywgJycpLlxyXG4gICAgcmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpLlxyXG4gICAgcmVwbGFjZSgvXFxcXHQvZywgJ1xcdCcpLlxyXG4gICAgcmVwbGFjZSgvXFxcXFwiL2csICdcIicpLlxyXG4gICAgcmVwbGFjZSgvXlwiLywgJycpLlxyXG4gICAgcmVwbGFjZSgvXCIkLywgJycpO1xyXG4gICAgdmFsMi5sYW5ndWFnZSA9ICdodG1sJztcclxuICB9XHJcblxyXG4gIG5vZGUxID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28xJyk7XHJcbiAgbm9kZTIgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbzInKTtcclxuICBub2RlMyA9IHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9uYWNvMycpO1xyXG5cclxuICBlZGl0MSA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUobm9kZTEsIHZhbDEpO1xyXG4gIGVkaXQyID0gIHdpbmRvdy5tb25hY28uZWRpdG9yLmNyZWF0ZShub2RlMiwgdmFsMik7XHJcbiAgZWRpdDMgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKG5vZGUzLCB2YWwzKTtcclxuXHJcbiAgY29uc29sZS5sb2coJ2xvYWQgbW9uYWNvOiBsb2dzIDEsMiwzJylcclxuICBjb25zdCBybzEgPSBuZXcgUmVzaXplT2JzZXJ2ZXIocmVzaXplKGVkaXQxKSk7XHJcbiAgY29uc3Qgcm8yID0gbmV3IFJlc2l6ZU9ic2VydmVyKHJlc2l6ZShlZGl0MikpO1xyXG4gIGNvbnN0IHJvMyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoZWRpdDMpKTtcclxuXHJcbiAgcm8xLm9ic2VydmUobm9kZTEpO1xyXG4gIHJvMi5vYnNlcnZlKG5vZGUyKTtcclxuICBybzMub2JzZXJ2ZShub2RlMyk7XHJcblxyXG4gIHRhYnN0b3JlLnNldCh7XHJcbiAgICAuLi4kdGFic3RvcmUsXHJcbiAgICAgIGVkaXRvcjoge1xyXG4gICAgICAgIGVkaXQxLFxyXG4gICAgICAgIGVkaXQyLFxyXG4gICAgICAgIGVkaXQzLFxyXG4gICAgICB9LFxyXG4gIH0pXHJcbn0pO1xyXG5mdW5jdGlvbiBpc0NTUCgpIHtcclxuICBjb25zdCBoID0gJGxvZ3N0b3JlLnJlc3BIZWFkZXI7XHJcbiAgY29uc3QgY3NwID0gaFsnY29udGVudC1zZWN1cml0eS1wb2xpY3knXSB8fCBoWydjb250ZW50LXNlY3VyaXR5LXBvbGljeS1yZXBvcnQtb25seSddO1xyXG4gIHJldHVybiBjc3A7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48VGFiIGxhYmVsPVwiSGVhZGVyc1wiPlxyXG4gIDxkaXYgY2xhc3M9XCJ2aWV3LWNvbnRhaW5lclwiPlxyXG4gICAgPGRpdiBpZD1cIm1vbmFjbzFcIj5cclxuICAgIDwvZGl2PlxyXG4gIDwvZGl2PlxyXG48L1RhYj5cclxuPFRhYiBsYWJlbD1cIlJlc3BvbnNlXCI+XHJcbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XHJcbiAgICA8ZGl2IGlkPVwibW9uYWNvMlwiPlxyXG4gICAgPC9kaXY+XHJcbiAgPC9kaXY+XHJcbjwvVGFiPlxyXG48VGFiIGxhYmVsPVwiQ1NQXCI+XHJcbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XHJcbiAgICA8ZGl2IGlkPVwibW9uYWNvM1wiPlxyXG4gIDwvZGl2PlxyXG48L1RhYj5cclxuXHJcbjxzdHlsZT5cclxuLnZpZXctY29udGFpbmVyIHtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XHJcbn1cclxuI21vbmFjbzEsXHJcbiNtb25hY28yLFxyXG4jbW9uYWNvMyB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIHRvcDogMDtcclxuICBsZWZ0OiAwO1xyXG4gIGJvdHRvbTogMDtcclxuICByaWdodDogMDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcclxuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XHJcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xyXG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcclxuXHJcbm9uTW91bnQoKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1qc29uIGEnKTtcclxuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xyXG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcclxuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcclxuICAgICAgICAgIHRhYjogaSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIDUwMCk7XHJcbn0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24yLz5cclxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWpzb25cIiBzaXplPVwiaXMtc21hbGxcIj5cclxuICA8QmFzZVRhYi8+XHJcbjwvVGFicz5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XHJcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xyXG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcclxuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XHJcblxyXG5vbk1vdW50KCgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItaHRtbCBhJyk7XHJcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcclxuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRhYnN0b3JlLnNldCh7XHJcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXHJcbiAgICAgICAgICB0YWI6IGksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCA1MDApO1xyXG59KTtcclxuPC9zY3JpcHQ+XHJcblxyXG48QnV0dG9uMi8+XHJcbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi1odG1sXCIgc2l6ZT1cImlzLXNtYWxsXCI+XHJcbiAgPEJhc2VUYWIvPlxyXG48L1RhYnM+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xyXG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcclxuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XHJcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xyXG5cclxub25Nb3VudCgoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLXRleHQgYScpO1xyXG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XHJcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0YWJzdG9yZS5zZXQoe1xyXG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxyXG4gICAgICAgICAgdGFiOiBpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgNTAwKTtcclxufSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPEJ1dHRvbjIvPlxyXG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItdGV4dFwiIHNpemU9XCJpcy1zbWFsbFwiPlxyXG4gIDxCYXNlVGFiLz5cclxuPC9UYWJzPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcclxuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XHJcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xyXG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcclxuXHJcbm9uTW91bnQoKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1jc3MgYScpO1xyXG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XHJcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0YWJzdG9yZS5zZXQoe1xyXG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxyXG4gICAgICAgICAgdGFiOiBpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgNTAwKTtcclxufSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPEJ1dHRvbjIvPlxyXG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItY3NzXCIgc2l6ZT1cImlzLXNtYWxsXCI+XHJcbiAgPEJhc2VUYWIvPlxyXG48L1RhYnM+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xyXG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcclxuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XHJcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xyXG5cclxub25Nb3VudCgoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWpzIGEnKTtcclxuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xyXG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcclxuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcclxuICAgICAgICAgIHRhYjogaSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIDUwMCk7XHJcbn0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24yLz5cclxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWpzXCIgc2l6ZT1cImlzLXNtYWxsXCI+XHJcbiAgPEJhc2VUYWIvPlxyXG48L1RhYnM+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgSnNvbiBmcm9tICcuL0pzb24uc3ZlbHRlJztcclxuaW1wb3J0IEh0bWwgZnJvbSAnLi9IdG1sLnN2ZWx0ZSc7XHJcbmltcG9ydCBUZXh0IGZyb20gJy4vVGV4dC5zdmVsdGUnO1xyXG5pbXBvcnQgQ3NzIGZyb20gJy4vQ3NzLnN2ZWx0ZSc7XHJcbmltcG9ydCBKcyBmcm9tICcuL0pzLnN2ZWx0ZSc7XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cIml0ZW0tc2hvd1wiPlxyXG4gIHsjaWYgJGxvZ3N0b3JlLnRpdGxlLm1hdGNoKCcucG5nJyl9XHJcbiAgICA8aW1nIHNyYz1cInskbG9nc3RvcmUudXJsfVwiIGFsdD1cImltYWdlXCIvPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2pzb24nfVxyXG4gICAgPEpzb24vPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2h0bWwnfVxyXG4gICAgPEh0bWwvPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J3R4dCd9XHJcbiAgICA8VGV4dC8+XHJcbiAgezplbHNlIGlmICRsb2dzdG9yZS5leHQ9PT0nY3NzJ31cclxuICAgIDxDc3MvPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2pzJ31cclxuICAgIDxKcy8+XHJcbiAgezplbHNlfVxyXG4gICAgPHByZT57JGxvZ3N0b3JlLnJlc3BvbnNlfTwvcHJlPlxyXG4gIHsvaWZ9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uaXRlbS1zaG93IHtcclxuICBtYXJnaW4tbGVmdDogMnB4O1xyXG59XHJcbi5pdGVtLXNob3cgcHJle1xyXG4gIHBhZGRpbmc6IDAgMCAwIDVweDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XHJcbmltcG9ydCB0aXRsZSBmcm9tICcuL1RpdGxlLnN2ZWx0ZSc7XHJcbmltcG9ydCBMaXN0IGZyb20gJy4vTGlzdC5zdmVsdGUnO1xyXG5pbXBvcnQgU2hvdyBmcm9tICcuL1Nob3cuc3ZlbHRlJztcclxuXHJcbmxldCBsZWZ0ID0gMTYzO1xyXG5jb25zdCB0b3AgPSAnNDcnO1xyXG5jb25zdCBpZCA9ICdsb2dzTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncy9pbmRleCcpO1xyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XHJcbiAgICBvcHRbaWRdICYmIChsZWZ0ID0gb3B0W2lkXSlcclxuICB9KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XHJcbiAgY29uc3QgZGF0YSA9IHt9XHJcbiAgZGF0YVtpZF0gPSBsZWZ0XHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48VkJveDIge3RpdGxlfSB7dG9wfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fSBzaG93PXskbG9nc3RvcmUubG9naWR9PlxyXG4gIDxTaG93Lz5cclxuPC9WQm94Mj5cclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3QgdGFncyA9IHdyaXRhYmxlKHtcclxuICBmaWx0ZXJVcmw6IHRydWUsXHJcbiAgX190YWcxOiB7fSxcclxuICBfX3RhZzI6IHt9LFxyXG4gIF9fdGFnMzoge30sXHJcbiAgdW5pcTogdHJ1ZSxcclxuICBsaXN0OiBmYWxzZVxyXG59KVxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyB1cmxzIH0gZnJvbSAnLi91cmwtZGVib3VuY2UnO1xyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxubGV0IGF1dG9TYXZlID0gdHJ1ZTtcclxubGV0IF90YWdzID0gJHRhZ3M7XHJcblxyXG5mdW5jdGlvbiBidG5SZXNldChlKSB7XHJcbiAgd2luZG93Lm1pdG0uZmlsZXMucm91dGVfZXZlbnRzLnJvdXRlVGFibGUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuU2F2ZShlKSB7XHJcbiAgY29uc3Qge19fdGFnMSwgX190YWcyLCBfX3RhZzMsIHJvdXRlc30gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCBfY2hpbGRucyA9IHt9XHJcbiAgZm9yIChjb25zdCBucyBpbiByb3V0ZXMpIHtcclxuICAgIF9jaGlsZG5zW25zXSA9IHJvdXRlc1tuc10uX2NoaWxkbnNcclxuICB9XHJcbiAgY29uc3QgdGFncyA9IHtcclxuICAgIF9jaGlsZG5zLFxyXG4gICAgX190YWcxLFxyXG4gICAgX190YWcyLFxyXG4gICAgX190YWczLFxyXG4gIH07XHJcbiAgY29uc29sZS5sb2coJ3NhdmVUYWdzJywgZS50YXJnZXQpO1xyXG4gIHdzX19zZW5kKCdzYXZlVGFncycsIHRhZ3MpO1xyXG4gIHVybHMoKVxyXG59XHJcblxyXG5vbk1vdW50KCgpID0+IHtcclxuICBsZXQgZGVib3VuY2UgPSBmYWxzZTtcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2V0LXRhZ3MnKS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xyXG4gICAgY29uc3Qge3R5cGV9ID0gZS50YXJnZXQuYXR0cmlidXRlcztcclxuICAgIGlmICh0eXBlKSB7XHJcbiAgICAgIGNvbnN0IHt2YWx1ZX0gPSB0eXBlO1xyXG4gICAgICBpZiAoYXV0b1NhdmUgJiYgdmFsdWU9PT0nY2hlY2tib3gnKSB7XHJcbiAgICAgICAgaWYgKGRlYm91bmNlKSB7XHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZGVib3VuY2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZWJvdW5jZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgZGVib3VuY2UgPSBmYWxzZTtcclxuICAgICAgICAgIGJ0blNhdmUoZSk7XHJcbiAgICAgICAgfSw1MClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHdpbmRvdy5taXRtLmJyb3dzZXIuY2hnVXJsX2V2ZW50cy50YWdzRXZlbnQgPSBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKCdVcGRhdGUgdGFncyEnKTtcclxuICAgIHRhZ3Muc2V0KHsuLi4kdGFnc30pO1xyXG4gIH1cclxufSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICA8bGFiZWwgY2xhc3M9XCJjaGVja2VyXCI+XHJcbiAgICA8aW5wdXRcclxuICAgIHR5cGU9XCJjaGVja2JveFwiXHJcbiAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLmxpc3R9Lz5cclxuICAgIGxpc3RcclxuICA8L2xhYmVsPlxyXG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cclxuICAgIDxpbnB1dFxyXG4gICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgIGJpbmQ6Y2hlY2tlZD17JHRhZ3MudW5pcX0vPlxyXG4gICAgZml0XHJcbiAgPC9sYWJlbD5cclxuICA8bGFiZWwgY2xhc3M9XCJjaGVja2VyXCI+XHJcbiAgICA8aW5wdXQgXHJcbiAgICB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgb246Y2xpY2s9XCJ7dXJsc31cIlxyXG4gICAgYmluZDpjaGVja2VkPXskdGFncy5maWx0ZXJVcmx9Lz5cclxuICAgIGN1cnJlbnQtdGFiXHJcbiAgPC9sYWJlbD5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blJlc2V0fVwiIGRpc2FibGVkPXthdXRvU2F2ZX0+UmVzZXQ8L2J1dHRvbj5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blNhdmV9XCIgIGRpc2FibGVkPXthdXRvU2F2ZX0+U2F2ZTwvYnV0dG9uPlxyXG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cclxuICAgIDxpbnB1dFxyXG4gICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgIGJpbmQ6Y2hlY2tlZD17YXV0b1NhdmV9Lz5cclxuICAgIGF1dG9zYXZlXHJcbiAgPC9sYWJlbD5cclxuICAuXHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IC0ycHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG59XHJcbi5idG4tY29udGFpbmVyIGJ1dHRvbjpkaXNhYmxlZCB7XHJcbiAgY3Vyc29yOiBhdXRvO1xyXG59XHJcbi5idG4tY29udGFpbmVyIGlucHV0IHtcclxuICB2ZXJ0aWNhbC1hbGlnbjogLTJweDtcclxufVxyXG4udGxiIHtcclxuICBib3JkZXI6IG5vbmU7XHJcbn1cclxuLmNoZWNrZXIge1xyXG4gIGNvbG9yOiBjaG9jb2xhdGU7XHJcbiAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICBmb250LXNpemU6IDEycHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IGNvbHM9M1xyXG5pbXBvcnQgeyBzdGF0ZXMgfSBmcm9tICcuL3N0YXRlcy5qcyc7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoZSkge1xyXG4gIGNvbnN0IGFsbCA9IHsuLi4kc3RhdGVzfVxyXG4gIGFsbC5jaGV2cm9uID0gYWxsLmNoZXZyb249PT0nWzw8XScgPyAnWz4+XScgOiAnWzw8XSdcclxuICBzdGF0ZXMuc2V0KGFsbClcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxidXR0b25cclxuY2xhc3M9XCJmLXJpZ2h0XCIgXHJcbm9uOmNsaWNrPVwie3Jlc2l6ZX1cIlxyXG5zdHlsZT1cIntjb2xzPT09MyA/ICcnIDogJ2Rpc3BsYXk6bm9uZTsnfVwiXHJcbj57JHN0YXRlcy5jaGV2cm9ufTwvYnV0dG9uPlxyXG5cclxuPHN0eWxlPlxyXG5idXR0b24ge1xyXG4gIGJvcmRlcjogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgY29sb3I6ICMwMDJhZmY7XHJcbiAgbWFyZ2luLXRvcDogLTVweDtcclxuICBtYXJnaW4tcmlnaHQ6IC01cHg7XHJcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcclxuICBwYWRkaW5nOiAycHggMXB4IDFweCAxcHg7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogNzAwO1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxufVxyXG4uZi1yaWdodCB7XHJcbiAgZmxvYXQ6cmlnaHQ7XHJcbiAgbWFyZ2luOiAwO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuZXhwb3J0IGxldCBjb2xzO1xyXG4vKioqXHJcbiogZXg6XHJcbiogX190YWcxW25zXVtyZW1vdmUtYWRzfjFdID0gdHJ1ZVxyXG4qIF9fdGFnMVtuc11bcmVtb3ZlLWFkc34yXSA9IGZhbHNlXHJcbioqKi9cclxubGV0IHRncyA9IFtdO1xyXG5sZXQgbGlzdCA9IHt9O1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgY29uc3QgeyByb3V0ZXMsIGZuIH0gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCB7IHJlc2V0UnVsZTMsIG9uZVNpdGUgfSA9IGZuO1xyXG4gIGNvbnN0IHRhZ3NTdG9yZSA9ICR0YWdzO1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IHtfX3RhZzEsX190YWcyLF9fdGFnM30gPSAkdGFncztcclxuICAgIGNvbnN0IHtkYXRhc2V0LCBjaGVja2VkfSA9IGUudGFyZ2V0O1xyXG4gICAgY29uc3Qge2l0ZW06IHRhZ30gPSBkYXRhc2V0O1xyXG4gICAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IHRhZy5zcGxpdCgnficpO1xyXG5cclxuICAgIGZvciAobGV0IG5zIGluIF9fdGFnMSkge1xyXG4gICAgICBpZiAob25lU2l0ZSh0YWdzU3RvcmUsIG5zKSkge1xyXG4gICAgICAgIG5zID0gcm91dGVzW25zXS5fY2hpbGRucy5fc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG4gICAgICAgIF9fdGFnMVtuc11bdGFnXSA9IGNoZWNrZWRcclxuICAgICAgICBpZiAoaWQxICYmIGNoZWNrZWQpIHtcclxuICAgICAgICAgIGZvciAobGV0IHRnIGluIGxpc3QpIHtcclxuICAgICAgICAgICAgY29uc3QgW2dyb3VwMiwgaWQyXSA9IHRnLnNwbGl0KCd+Jyk7XHJcbiAgICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIgJiYgaWQxIT09aWQyKSB7XHJcbiAgICAgICAgICAgICAgaWYgKF9fdGFnMVtuc11bZ3JvdXAxXSE9PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgX190YWcxW25zXVtncm91cDFdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgX190YWcxW25zXVt0Z10gPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xyXG4gICAgICBpZiAob25lU2l0ZSh0YWdzU3RvcmUsIG5zKSkge1xyXG4gICAgICAgIG5zID0gcm91dGVzW25zXS5fY2hpbGRucy5fc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG4gICAgICAgIGNvbnN0IHRhZ3MgPSBfX3RhZzJbbnNdO1xyXG4gICAgICAgIGZvciAobGV0IHRnIGluIHRhZ3MpIHtcclxuICAgICAgICAgIGNvbnN0IHR5cDIgPSB0Zy5zcGxpdCgnOicpWzFdIHx8IHRnO1xyXG4gICAgICAgICAgaWYgKHRhZz09PXR5cDIpIHtcclxuICAgICAgICAgICAgdGFnc1t0Z10uc3RhdGUgPSBjaGVja2VkOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgICAgICAgICB9IFxyXG4gICAgICAgICAgaWYgKGdyb3VwMT09PXR5cDIuc3BsaXQoJ34nKVswXSkge1xyXG4gICAgICAgICAgICB0YWdzW3RnXS5zdGF0ZSA9IF9fdGFnMVtuc11bdHlwMl0gfHwgZmFsc2U7IC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNldFJ1bGUzKCR0YWdzLCB0YWcpXHJcbiAgICBjb25zdCB7ZmlsdGVyVXJsLCB0Z3JvdXAsIHVuaXF9ID0gJHRhZ3M7XHJcbiAgICB0YWdzLnNldCh7XHJcbiAgICAgIGZpbHRlclVybCxcclxuICAgICAgX190YWcxLFxyXG4gICAgICBfX3RhZzIsXHJcbiAgICAgIF9fdGFnMyxcclxuICAgICAgdGdyb3VwLFxyXG4gICAgICB1bmlxXHJcbiAgICB9KVxyXG4gIH0sIDEwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcm91dGV0YWcoaXRlbSkge1xyXG4gIGNvbnN0IHsgYnJvd3NlciB9ID0gd2luZG93Lm1pdG07XHJcbiAgY29uc3Qgc2xjID0gJHRhZ3MuX190YWcxW2l0ZW1dID8gJ3NsYycgOiAnJztcclxuICBjb25zdCBncnAgPSAkdGFncy50Z3JvdXBbaXRlbV0gPyAnZ3JwJyA6ICcnO1xyXG4gIGxldCBpdG0gPSAnJ1xyXG4gIGlmICgkdGFncy50Z3JvdXBbaXRlbV0pIHtcclxuICAgIGZvciAoY29uc3QgbnMgb2YgYnJvd3Nlci5uc3MpIHtcclxuICAgICAgY29uc3QgdGFnMyA9ICR0YWdzLl9fdGFnM1tuc10gfHwgW11cclxuICAgICAgZm9yIChjb25zdCBpZCBpbiB0YWczKSB7XHJcbiAgICAgICAgY29uc3Qgc2VjcyA9IHRhZzNbaWRdXHJcbiAgICAgICAgZm9yIChjb25zdCBzZWMgaW4gc2Vjcykge1xyXG4gICAgICAgICAgY29uc3QgdGFncyA9IHNlY3Nbc2VjXS50YWdzIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzNcclxuICAgICAgICAgIGZvciAoY29uc3QgdGFnIGluIHRhZ3MpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW09PT10YWcuc3BsaXQoJzonKS5wb3AoKSkge1xyXG4gICAgICAgICAgICAgIGl0bSA9ICdpdG0nXHJcbiAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBsZXQgdXJsID0gJydcclxuICBmb3IgKGNvbnN0IG5zIG9mIGJyb3dzZXIubnNzKSB7XHJcbiAgICBjb25zdCB0YWczID0gJHRhZ3MuX190YWczW25zXSB8fCBbXSAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgICBmb3IgKGNvbnN0IGlkIGluIHRhZzMpIHtcclxuICAgICAgaWYgKGlkLm1hdGNoKGA6JHtpdGVtfTpgKSkge1xyXG4gICAgICAgIHVybCA9ICd1cmwnXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gYHJ0YWcgJHtncnB9ICR7c2xjfSAke2l0bX0gJHt1cmx9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gbGlzdFRhZ3ModGFncykge1xyXG4gIGNvbnNvbGUubG9nKCdyZXJlbmRlci4uLicpO1xyXG4gIGNvbnN0IHticm93c2VyLCByb3V0ZXMsIGZuOiB7b25lU2l0ZX19ID0gd2luZG93Lm1pdG07XHJcbiAgbGlzdCA9IHt9XHJcbiAgY29uc3QgbnNzID0gW11cclxuICBmb3IgKGxldCBucyBpbiB0YWdzLl9fdGFnMSkge1xyXG4gICAgbnNzLnB1c2gobnMpXHJcbiAgICBpZiAob25lU2l0ZSh0YWdzLCBucykpIHtcclxuICAgICAgbnMgPSByb3V0ZXNbbnNdLl9jaGlsZG5zLl9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbiAgICAgIGNvbnN0IHRhZzEgPSB0YWdzLl9fdGFnMVtuc11cclxuICAgICAgZm9yIChjb25zdCBpZCBpbiB0YWcxKSB7XHJcbiAgICAgICAgaWYgKGxpc3RbaWRdPT09dW5kZWZpbmVkIHx8IHRhZzFbaWRdKSB7XHJcbiAgICAgICAgICBsaXN0W2lkXSA9IHRhZzFbaWRdXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGJyb3dzZXIubnNzID0gbnNzO1xyXG4gIHRncyA9IE9iamVjdC5rZXlzKGxpc3QpLnNvcnQoKTtcclxuICByZXR1cm4gdGdzO1xyXG59XHJcbmZ1bmN0aW9uIGVudGVyKGUpIHtcclxuICBjb25zdCB7IHJjbGFzcyB9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCN1cmxzYClcclxuICBpZiAobm9kZSkge1xyXG4gICAgY29uc3Qge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICAgIGNvbnN0IGtsYXNzID0gaXRlbS5yZXBsYWNlKHJjbGFzcywgJy0nKVxyXG4gICAgY29uc3QgY3NzID0gYFxyXG4gICAgLnVybHMgLl8ke2tsYXNzfSxcclxuICAgIC5mYXJnIC5fJHtrbGFzc30sXHJcbiAgICAudDIgLnNwYWNleC5fJHtrbGFzc30sXHJcbiAgICAudDMgLnNwYWNlMy5fJHtrbGFzc30ge2JhY2tncm91bmQ6IHllbGxvdzt9XHJcbiAgICAudDIgLnNwYWNlMS5fJHtrbGFzc30sXHJcbiAgICAudDMgLnNwYWNlMS5fJHtrbGFzc30ge2JhY2tncm91bmQ6ICNkYmY2MDEgIWltcG9ydGFudDt9YFxyXG4gICAgbm9kZS5pbm5lckhUTUwgPSBjc3NcclxuICB9XHJcbn1cclxuZnVuY3Rpb24gbGVhdmUoZSkge1xyXG4gIGNvbnN0IHtpdGVtfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XHJcbiAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCN1cmxzYClcclxuICBpZiAobm9kZSkge1xyXG4gICAgbm9kZS5pbm5lckhUTUwgPSBgYFxyXG4gIH1cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjaWYgbGlzdFRhZ3MoJHRhZ3MpLmxlbmd0aH1cclxuPHRkIHN0eWxlPVwie2NvbHM+MSA/ICcnIDogJ2Rpc3BsYXk6bm9uZTsnfVwiPlxyXG4gIDxkaXYgY2xhc3M9XCJib3JkZXJcIj5cclxuICAgIHsjZWFjaCB0Z3MgYXMgaXRlbX1cclxuICAgIDxkaXYgY2xhc3M9XCJzcGFjZTAge3JvdXRldGFnKGl0ZW0pfVwiPlxyXG4gICAgICA8bGFiZWwgXHJcbiAgICAgIGRhdGEtaXRlbT17aXRlbX1cclxuICAgICAgb246bW91c2VlbnRlcj17ZW50ZXJ9XHJcbiAgICAgIG9uOm1vdXNlbGVhdmU9e2xlYXZlfVxyXG4gICAgICA+XHJcbiAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiXHJcbiAgICAgICAgZGF0YS1pdGVtPXtpdGVtfVxyXG4gICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfVxyXG4gICAgICAgIGJpbmQ6Y2hlY2tlZD17bGlzdFtpdGVtXX0vPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPVwiYmlnXCI+e2l0ZW19PC9zcGFuPlxyXG4gICAgICA8L2xhYmVsPlxyXG4gICAgPC9kaXY+XHJcbiAgICB7L2VhY2h9XHJcbiAgPC9kaXY+XHJcbjwvdGQ+XHJcbnsvaWZ9XHJcblxyXG48c3R5bGU+XHJcbiAgdGQge1xyXG4gICAgd2lkdGg6IDIwJTtcclxuICB9XHJcbi5ib3JkZXIge1xyXG4gIGJvcmRlcjogMXB4IGRvdHRlZDtcclxufVxyXG4uc3BhY2UwIHtcclxuICBmb250LXNpemU6IDEzcHg7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBjb2xvcjogZGFya2JsdWU7XHJcbiAgLyogYmFja2dyb3VuZDogZGVlcHNreWJsdWU7ICovXHJcbn1cclxuLnNwYWNlMCBzcGFuIHtcclxuICB2ZXJ0aWNhbC1hbGlnbjogMTUlO1xyXG59XHJcbi5zcGFjZTAgLmJpZyB7XHJcbiAgbWFyZ2luLWxlZnQ6IC00cHg7XHJcbiAgZm9udC1mYW1pbHk6IHNlcmlmO1xyXG59XHJcbi5zcGFjZTA+bGFiZWwge1xyXG4gIHBhZGRpbmctbGVmdDogNnB4O1xyXG59XHJcbi5zcGFjZTA+bGFiZWwgaW5wdXQge1xyXG4gIHZlcnRpY2FsLWFsaWduOiAtMC42cHg7XHJcbn1cclxuLnJ0YWcge1xyXG4gIGNvbG9yOiBncmV5O1xyXG59XHJcbi5ydGFnLnNsYyB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxuLnJ0YWcuc2xjLmdycCB7XHJcbiAgY29sb3I6IHJlZDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbi5ydGFnLnNsYy51cmwsXHJcbi5ydGFnLnNsYy5ncnAuaXRtLnVybCB7XHJcbiAgY29sb3I6ICNjMzZlMDE7XHJcbn1cclxuLnJ0YWcuc2xjLmdycC5pdG0ge1xyXG4gIGNvbG9yOiBncmVlbjtcclxufVxyXG4ucnRhZy5ncnAge1xyXG4gIGJhY2tncm91bmQtY29sb3I6IGJlaWdlO1xyXG59XHJcbi5ydGFnLmdycC5pdG0sIC5ydGFnLnVybCB7XHJcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IEV4cGFuZCBmcm9tICcuLi9idXR0b24vRXhwYW5kLnN2ZWx0ZSc7XHJcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi9idXR0b24vQ29sbGFwc2Uuc3ZlbHRlJztcclxuaW1wb3J0IHsgZGF0YXNldF9kZXYgfSBmcm9tICdzdmVsdGUvaW50ZXJuYWwnO1xyXG5cclxuZXhwb3J0IGxldCBucztcclxuY29uc3QgbGlzdCA9IHdpbmRvdy5taXRtLnJvdXRlc1tuc10uX2NoaWxkbnMubGlzdFxyXG5cclxuZnVuY3Rpb24gcShrZXkpIHtcclxuICByZXR1cm4ga2V5LnJlcGxhY2UoL1tALl0vZywgJy0nKVxyXG59XHJcbmZ1bmN0aW9uIGNoaWxkbnMoX25zKSB7XHJcbiAgY29uc3Qge19jaGlsZG5zfSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuc11cclxuICBpZiAoX2NoaWxkbnMgJiYgX2NoaWxkbnMubGlzdCE9PXVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKF9jaGlsZG5zLmxpc3QpXHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBbXVxyXG4gIH1cclxufVxyXG5mdW5jdGlvbiBzZXRTdWJucyhlKSB7XHJcbiAgY29uc3Qge2NoZWNrZWQsIGRhdGFzZXR9ID0gZS50YXJnZXRcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGNvbnN0IHtfY2hpbGRuc30gPSB3aW5kb3cubWl0bS5yb3V0ZXNbbnNdXHJcbiAgICBjb25zdCB7bGlzdH0gPSBfY2hpbGRuc1xyXG4gICAgY29uc3Qge2l0ZW19ID0gZGF0YXNldFxyXG4gICAgX2NoaWxkbnMuX3N1Ym5zID0gbGlzdFtpdGVtXSA/IGl0ZW0gOiAnJ1xyXG4gICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgZm9yIChjb25zdCBpZCBpbiBsaXN0KSB7XHJcbiAgICAgICAgaWYgKGlkIT09aXRlbSkge1xyXG4gICAgICAgICAgbGlzdFtpZF0gPSBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGFncy5zZXQoey4uLiR0YWdzfSlcclxuICB9LCAxKTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJzcGFjZTBcIj5cclxuICA8IS0tIGZlYXQ6IGF1dG8gY29sbGFwc2VkIGJldHdlZW4gdGFnMiAmIHRhZzMgLS0+XHJcbiAgPENvbGxhcHNlIG9uOm1lc3NhZ2UgbmFtZT1cInN0YXRlMlwiIHE9XCJ7YC50Mi4ke3EobnMpfWB9XCI+PC9Db2xsYXBzZT5cclxuICA8RXhwYW5kIG9uOm1lc3NhZ2UgbmFtZT1cInN0YXRlMlwiIHE9XCJ7YC50Mi4ke3EobnMpfWB9XCI+PC9FeHBhbmQ+XHJcbiAgPHNwYW4gY2xhc3M9XCJuc1wiPlxyXG4gICAgeyNpZiBucy5tYXRjaCgnX2dsb2JhbF8nKX1cclxuICAgICAgWzxzcGFuPnsnICogJ308L3NwYW4+XVxyXG4gICAgezplbHNlfVxyXG4gICAgICB7bnMuc3BsaXQoJ0AnKS5wb3AoKX1cclxuICAgIHsvaWZ9XHJcbiAgPC9zcGFuPlxyXG4gIHsjZWFjaCBjaGlsZG5zKG5zKSBhcyBpdGVtfVxyXG4gICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxyXG4gICAgICA8aW5wdXRcclxuICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgZGF0YS1pdGVtPVwie2l0ZW19XCJcclxuICAgICAgb246Y2xpY2s9XCJ7c2V0U3VibnN9XCJcclxuICAgICAgYmluZDpjaGVja2VkPXtsaXN0W2l0ZW1dfS8+XHJcbiAgICAgIHtpdGVtLnNwbGl0KCdAJylbMF19XHJcbiAgICA8L2xhYmVsPlxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5zcGFjZTAge1xyXG4gIGxpbmUtaGVpZ2h0OiAxLjU7XHJcbiAgZm9udC1zaXplOiAxNHB4O1xyXG4gIGZvbnQtZmFtaWx5OiBzZXJpZjtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBkYXJrYmx1ZTtcclxuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XHJcbn1cclxuc3Bhbi5ucyB7XHJcbiAgbWFyZ2luOiAwO1xyXG59XHJcbnNwYW4ubnMgc3BhbiB7XHJcbiAgdmVydGljYWwtYWxpZ246IC01cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDAuODtcclxuICBmb250LXNpemU6IDE4cHg7XHJcbn1cclxubGFiZWwge1xyXG4gIGRpc3BsYXk6IGNvbnRlbnRzICFpbXBvcnRhbnQ7XHJcbiAgZm9udC1zaXplOiBzbWFsbDtcclxuICBjb2xvcjogYnJvd247XHJcbn1cclxubGFiZWwgaW5wdXQge1xyXG4gIG1hcmdpbjogMCAtMnB4O1xyXG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgVGFnczJUaXRsZSBmcm9tICcuL1RhZ3MyX1RpdGxlLnN2ZWx0ZSc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW1zO1xyXG5leHBvcnQgbGV0IG5zO1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgY29uc3QgeyByZXNldFJ1bGUyLCByZXNldFJ1bGUzIH0gPSB3aW5kb3cubWl0bS5mbjtcclxuICBjb25zdCB7X190YWcxLF9fdGFnMixfX3RhZzN9ID0gJHRhZ3M7XHJcbiAgY29uc3Qge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICBjb25zdCBuYW1lc3BhY2UgPSBfX3RhZzJbbnNdO1xyXG4gIGNvbnN0IHRhZ3ggPSB7fTtcclxuICBmb3IgKGxldCBpdG0gaW4gbmFtZXNwYWNlKSB7XHJcbiAgICB0YWd4W2l0bV0gPSBuYW1lc3BhY2VbaXRtXVxyXG4gIH1cclxuICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICBjb25zb2xlLmxvZygnZScsIHtfX3RhZzIsX190YWczfSk7XHJcbiAgICByZXNldFJ1bGUyKCR0YWdzLCBpdGVtLCBucywgdGFneClcclxuICAgIHJlc2V0UnVsZTMoJHRhZ3MsIGl0ZW0sIG5zKVxyXG4gICAgY29uc3Qge2ZpbHRlclVybCwgdGdyb3VwLCB1bmlxfSA9ICR0YWdzO1xyXG4gICAgdGFncy5zZXQoe1xyXG4gICAgICBmaWx0ZXJVcmwsXHJcbiAgICAgIF9fdGFnMSxcclxuICAgICAgX190YWcyLFxyXG4gICAgICBfX3RhZzMsXHJcbiAgICAgIHRncm91cCxcclxuICAgICAgdW5pcVxyXG4gICAgfSlcclxuICB9LCAxMCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGl0ZW1saXN0KGl0ZW1zKSB7XHJcbiAgY29uc3Qge2ZuOiB7c29ydFRhZ319ID0gd2luZG93Lm1pdG07XHJcbiAgbGV0IGFyciA9IE9iamVjdC5rZXlzKGl0ZW1zKTtcclxuICBpZiAoJHRhZ3MudW5pcSkge1xyXG4gICAgYXJyID0gYXJyLmZpbHRlcih4ID0+IHgubWF0Y2goJzonKSkuZmlsdGVyKHggPT4gIXgubWF0Y2goJ3VybDonKSlcclxuICB9XHJcbiAgcmV0dXJuIGFyci5zb3J0KHNvcnRUYWcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyh0YWdzLCBpdGVtKSB7XHJcbiAgY29uc3Qge19fdGFnMSwgX190YWcyLCBmbjoge3JjbGFzc319ID0gd2luZG93Lm1pdG1cclxuICBjb25zdCBfdGFncyA9IF9fdGFnMltuc11baXRlbV0udGFncyB8fCBbXSAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgY29uc3QgdGFnMiA9IGl0ZW0uc3BsaXQoJzonKVxyXG5cclxuICBsZXQga2xhc1xyXG4gIGlmICh0YWcyWzFdKSB7XHJcbiAgICBrbGFzID0gaXRlbXNbaXRlbV0uc3RhdGUgPyAncnRhZyBzbGMnIDogJ3J0YWcnOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgfSBlbHNlIHtcclxuICAgIGtsYXMgPSBpdGVtc1tpdGVtXS5zdGF0ZSA/ICdzdGFnIHNsYycgOiAnJzsgLy8gZmVhdDogdXBkYXRlIF9fdGFnMlxyXG4gIH1cclxuICBpZiAoaXRlbS5tYXRjaCgndXJsOicpKSB7XHJcbiAgICBrbGFzICs9ICcgdXJsJ1xyXG4gIH1cclxuICBmb3IgKGNvbnN0IHRhZyBvZiBfdGFncykge1xyXG4gICAgaWYgKF9fdGFnMVtuc11bdGFnXT09PWZhbHNlKSB7XHJcbiAgICAgIGtsYXMgKz0gJyBncmV5J1xyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4ga2xhcyArIGAgXyR7dGFnMi5wb3AoKS5yZXBsYWNlKHJjbGFzcywgJy0nKX1gXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3coaXRlbSkge1xyXG4gIGNvbnN0IHNob3J0ID0ge3JlcXVlc3Q6ICdyZXFzJywgcmVzcG9uc2U6ICdyZXNwJ31cclxuICBjb25zdCBbayx2XSA9IGl0ZW0uc3BsaXQoJzonKTtcclxuICBpZiAodj09PXVuZGVmaW5lZCkgcmV0dXJuIGs7XHJcbiAgcmV0dXJuIGAke3Z9eyR7c2hvcnRba10gfHwga319YDtcclxufVxyXG5mdW5jdGlvbiBsaW5rVGFncyhpdGVtKSB7XHJcbiAgY29uc3Qge3RhZ3N9ID0gd2luZG93Lm1pdG0uX190YWcyW25zXVtpdGVtXSAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgY29uc3QgbGlua1RhZ3MgPSB0YWdzICYmIHRhZ3MubGVuZ3RoID8gYFske3RhZ3Muam9pbignLCcpfV1gIDogJydcclxuICByZXR1cm4gbGlua1RhZ3M7XHJcbn1cclxuZnVuY3Rpb24gaXNHcm91cChpdGVtKSB7XHJcbiAgY29uc3QgW3NlYywgdGFnXSA9IGl0ZW0uc3BsaXQoJzonKVxyXG4gIHJldHVybiB0YWcgJiYgc2VjIT09J3VybCdcclxufVxyXG5mdW5jdGlvbiB1cmxsaXN0KF90YWdzLCBpdGVtKSB7XHJcbiAgY29uc3Qge19fdGFnMiwgZm46IHsgbm9UYWdJblJ1bGUsIHVuaXEgfX0gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCB7dGFnc30gPSBfX3RhZzJbbnNdW2l0ZW1dIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICBpZiAodGFncyAmJiB0YWdzLmxlbmd0aCkge1xyXG4gICAgaXRlbSA9IGAke2l0ZW19ICR7dGFncy5qb2luKCcgJyl9YFxyXG4gIH1cclxuICBsZXQgb2JqID0gd2luZG93Lm1pdG0ucm91dGVzW25zXVtpdGVtXVxyXG4gIGlmIChvYmo9PT11bmRlZmluZWQpIHtcclxuICAgIG9iaiA9IFtdXHJcbiAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShvYmopKSB7XHJcbiAgICBvYmogPSBPYmplY3Qua2V5cyhvYmopXHJcbiAgfVxyXG4gIG9iaiA9IG9iai5tYXAobm9UYWdJblJ1bGUpLmZpbHRlcih1bmlxKVxyXG4gIHJldHVybiBvYmpcclxufVxyXG5mdW5jdGlvbiBhbGx0YWdzKHRhZ3MsIGl0ZW0sIHBhdGgpIHtcclxuICBjb25zdCB7IHRhZ3NJbl9fdGFnMyB9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgcmV0dXJuIHRhZ3NJbl9fdGFnMyh0YWdzLCBucywgcGF0aCwgaXRlbSlcclxufVxyXG5mdW5jdGlvbiBzcGFjZXgodGFncywgaXRlbSwgcGF0aCkge1xyXG4gIGxldCBrbGFzcyA9IGl0ZW1zW2l0ZW1dLnN0YXRlID8gJ3NsYycgOiAnJzsgLy8gZmVhdDogdXBkYXRlIF9fdGFnMlxyXG4gIGNvbnN0IHsgcmNsYXNzLCBpc1J1bGVPZmYgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGlzUnVsZU9mZih0YWdzLCBucywgcGF0aCkgJiYgKGtsYXNzICs9ICcgZ3JleScpO1xyXG4gIGNvbnN0IF90YWdzID0gYWxsdGFncyh0YWdzLCBpdGVtLCBwYXRoKVxyXG4gIF90YWdzLmxlbmd0aCAmJiAoa2xhc3MgKz0gYCBfJHtfdGFncy5qb2luKCcgXycpfWApXHJcbiAgcmV0dXJuIGAke2tsYXNzfSBfJHtpdGVtLnNwbGl0KCc6JylbMV0ucmVwbGFjZShyY2xhc3MsICctJyl9YFxyXG59XHJcbmZ1bmN0aW9uIHEoa2V5KSB7XHJcbiAgcmV0dXJuIGtleS5yZXBsYWNlKC9bQC5dL2csICctJylcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjaWYgT2JqZWN0LmtleXMoaXRlbXMpLmxlbmd0aH1cclxuPGRpdiBjbGFzcz1cImJvcmRlclwiPlxyXG4gIDwhLS0gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnMyAtLT5cclxuICA8VGFnczJUaXRsZSBvbjptZXNzYWdlIHtuc30vPlxyXG4gIHsjZWFjaCBpdGVtbGlzdChpdGVtcykgYXMgaXRlbX1cclxuICAgIDxkaXYgY2xhc3M9XCJ0MiB7cShucyl9XCI+XHJcbiAgICB7I2lmIGlzR3JvdXAoaXRlbSl9XHJcbiAgICAgIDxkZXRhaWxzPlxyXG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzPVwic3BhY2UxIHtyb3V0ZXRhZygkdGFncywgaXRlbSl9XCI+XHJcbiAgICAgICAgICA8bGFiZWw+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XHJcbiAgICAgICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfSBcclxuICAgICAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtc1tpdGVtXS5zdGF0ZX0vPiA8IS0tIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzIgLS0+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaXRtIHtpdGVtLm1hdGNoKCc6JykgPyAnYmlnJyA6ICcnfVwiPntzaG93KGl0ZW0pfTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaW5rLXRhZ3NcIj57bGlua1RhZ3MoaXRlbSl9PC9zcGFuPlxyXG4gICAgICAgICAgPC9sYWJlbD4gXHJcbiAgICAgICAgPC9zdW1tYXJ5PlxyXG4gICAgICAgIHsjZWFjaCB1cmxsaXN0KCR0YWdzLCBpdGVtKSBhcyBwYXRofVxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInNwYWNleCB7c3BhY2V4KCR0YWdzLCBpdGVtLCBwYXRoKX1cIj57cGF0aH08L2Rpdj5cclxuICAgICAgICB7L2VhY2h9XHJcbiAgICAgIDwvZGV0YWlscz5cclxuICAgIHs6ZWxzZX1cclxuICAgICAgPGRpdiBjbGFzcz1cInNwYWNlMSB7cm91dGV0YWcoJHRhZ3MsIGl0ZW0pfVwiPlxyXG4gICAgICAgIDxsYWJlbD5cclxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgICAgZGF0YS1pdGVtPXtpdGVtfVxyXG4gICAgICAgICAgb246Y2xpY2s9e2NsaWNrZWR9IFxyXG4gICAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtc1tpdGVtXS5zdGF0ZX0vPiA8IS0tIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzIgLS0+XHJcbiAgICAgICAgICA8c3BhbiBjbGFzcz1cIml0bSB7aXRlbS5tYXRjaCgnOicpID8gJ2JpZycgOiAnJ31cIj57c2hvdyhpdGVtKX08L3NwYW4+XHJcbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImxpbmstdGFnc1wiPntsaW5rVGFncyhpdGVtKX08L3NwYW4+XHJcbiAgICAgICAgPC9sYWJlbD5cclxuICAgICAgPC9kaXY+XHJcbiAgICB7L2lmfVxyXG4gICAgPC9kaXY+XHJcbiAgey9lYWNofVxyXG48L2Rpdj5cclxuey9pZn1cclxuXHJcbjxzdHlsZT5cclxuLm5zIHtcclxuICBtYXJnaW4tbGVmdDogLTNweDtcclxuICBmb250LXNpemU6IDE1cHg7XHJcbn1cclxuLmJvcmRlciB7XHJcbiAgYm9yZGVyOiAxcHggZ3JleSBzb2xpZDtcclxufVxyXG5zdW1tYXJ5IGxhYmVsIHtcclxuICBtYXJnaW4tbGVmdDogMTFweDtcclxuICBtYXJnaW4tdG9wOiAtMTVweDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xyXG59XHJcbnN1bW1hcnkgbGFiZWwgaW5wdXQge1xyXG4gIHZlcnRpY2FsLWFsaWduOiAtMC42cHg7XHJcbn1cclxuc3VtbWFyeS5zcGFjZTEge1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG59XHJcbnN1bW1hcnkuc3BhY2UxIC5saW5rLXRhZ3Mge1xyXG4gIC8qIHZlcnRpY2FsLWFsaWduOiAyNSU7ICovXHJcbiAgLyogZm9udC1zdHlsZTogaXRhbGljOyAqL1xyXG4gIG1hcmdpbi1sZWZ0OiAtNnB4O1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxuICBmb250LWZhbWlseTogcm9ib3RvO1xyXG4gIGNvbG9yOiBkYXJrbWFnZW50YTtcclxufVxyXG4uZ3JleSAubGluay10YWdzIHtcclxuICBjb2xvcjogZ3JheTtcclxuICBmb250LXdlaWdodDogMTAwO1xyXG59XHJcbi5zcGFjZTEge1xyXG4gIGNvbG9yOiBncmV5O1xyXG4gIHBhZGRpbmctbGVmdDogMTZweDtcclxufVxyXG4uc3BhY2UxIHNwYW4ge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogMnB4O1xyXG59XHJcbi5zcGFjZTEgLml0bSB7XHJcbiAgbWFyZ2luLWxlZnQ6IC0ycHg7XHJcbiAgZm9udC1mYW1pbHk6IHNlcmlmO1xyXG59XHJcbi5zcGFjZXgge1xyXG4gIHBhZGRpbmctbGVmdDogMzBweDtcclxuICBjb2xvcjogI2VjZDdkNztcclxuICBmb250LXNpemU6IDEycHg7XHJcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcclxufVxyXG4uc3BhY2UxLnJ0YWcuZ3JleSB7XHJcbiAgY29sb3I6ICNkMThhOGE7XHJcbn1cclxuLnNwYWNleC5zbGMge1xyXG4gIGNvbG9yOiBibHVldmlvbGV0O1xyXG59XHJcbi5zcGFjZXguZ3JleSB7XHJcbiAgY29sb3I6ICNlY2Q3ZDc7XHJcbn1cclxuLnJ0YWcge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICBjb2xvcjogY2FkZXRibHVlO1xyXG4gIGJhY2tncm91bmQtY29sb3I6IGJlaWdlO1xyXG59XHJcbi5ydGFnLnVybCB7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogaW5oZXJpdDtcclxufVxyXG4ucnRhZy5zbGMge1xyXG4gIGNvbG9yOiByZWQ7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxufVxyXG4ucnRhZy5zbGMudXJsIHtcclxuICBjb2xvcjogI2MzNmUwMTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbi5zdGFnLnNsYyB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBjb2xzO1xyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgVGFnczIxIGZyb20gJy4vVGFnczJfMS5zdmVsdGUnO1xyXG5pbXBvcnQgeyBzdGF0ZXMgfSBmcm9tICcuLi9idXR0b24vc3RhdGVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIG5zcGFjZShucykge1xyXG4gIGNvbnN0IHtfc3VibnN9ID0gd2luZG93Lm1pdG0ucm91dGVzW25zXS5fY2hpbGRuc1xyXG4gIHJldHVybiBfc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRkIHN0eWxlPVwid2lkdGg6eyRzdGF0ZXMuY2hldnJvbj09PSdbPDxdJyA/IDQ1IDogMzV9JTsge2NvbHM+MCA/ICcnIDogJ2Rpc3BsYXk6bm9uZTsnfVwiPlxyXG57I2VhY2ggT2JqZWN0LmtleXMoJHRhZ3MuX190YWcyKSBhcyBuc31cclxuICB7I2lmIHdpbmRvdy5taXRtLmZuLm9uZVNpdGUoJHRhZ3MsIG5zKX1cclxuICAgIDwhLS0gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnMyAtLT5cclxuICAgIDxUYWdzMjEgb246bWVzc2FnZSBpdGVtcz17JHRhZ3MuX190YWcyW25zcGFjZShucyldfSBucz17bnNwYWNlKG5zKX0vPlxyXG4gIHsvaWZ9XHJcbnsvZWFjaH1cclxuPC90ZD5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbXM7XHJcbmV4cG9ydCBsZXQgaXRlbTtcclxuZXhwb3J0IGxldCBwYXRoO1xyXG5leHBvcnQgbGV0IG5zO1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgY29uc3Qge19fdGFnM30gPSAkdGFncztcclxuICBjb25zdCBfaXRlbSA9IF9fdGFnM1tuc11bcGF0aF1baXRlbV1cclxuXHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qge2l0ZW06IGl9ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICAgIGNvbnN0IFtncm91cDEsIGlkMV0gPSBpLnNwbGl0KCd1cmw6JykucG9wKCkuc3BsaXQoJ34nKTtcclxuXHJcbiAgICBmb3IgKGxldCBpdG0gaW4gX2l0ZW0udGFncykgeyAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgICAgIGNvbnN0IFtncm91cDIsIGlkMl0gPSBpdG0uc3BsaXQoJ3VybDonKS5wb3AoKS5zcGxpdCgnficpO1xyXG4gICAgICBpZiAoZ3JvdXAxPT09Z3JvdXAyICYmIGl0ZW0hPT1pdG0pIHtcclxuICAgICAgICBpZiAoaWQyPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBfaXRlbS50YWdzW2l0bV0gPSBfaXRlbS50YWdzW2ldXHJcbiAgICAgICAgfSBlbHNlIGlmIChpZDEhPT11bmRlZmluZWQgJiYgaWQxIT09aWQyKSB7XHJcbiAgICAgICAgICBfaXRlbS50YWdzW2l0bV0gPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRhZ3Muc2V0KHtcclxuICAgICAgLi4uJHRhZ3MsXHJcbiAgICAgIF9fdGFnMyxcclxuICAgIH0pXHJcbiAgfSwgNTApO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyh0YWdzLCBpdGVtKSB7XHJcbiAgY29uc3QgeyByY2xhc3MgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGxldCBrbGFzID0gaXRlbXNbaXRlbV0gPyAncnRhZyBzbGMnIDogJ3J0YWcnO1xyXG4gIGlmIChpdGVtLmluZGV4T2YoJ3VybDonKT4tMSkge1xyXG4gICAga2xhcyArPSAnIHVybCdcclxuICB9IGVsc2UgaWYgKGl0ZW0uaW5kZXhPZignOicpPi0xKSB7XHJcbiAgICBrbGFzICs9IHRhZ3MuX190YWcyW25zXVtpdGVtXSA/ICcgc2xjJyA6ICcnXHJcbiAgICBrbGFzICs9ICcgcjInXHJcbiAgfVxyXG4gIHJldHVybiBgJHtrbGFzfSBfJHtpdGVtLnNwbGl0KCc6JykucG9wKCkucmVwbGFjZShyY2xhc3MsICctJyl9YFxyXG59XHJcblxyXG5mdW5jdGlvbiB0aXRsZShpdGVtKSB7XHJcbiAgY29uc3QgW2tleSwgdGFnXSA9IGl0ZW0uc3BsaXQoJzonKVxyXG4gIHJldHVybiB0YWcgPyBgJHt0YWd9eyR7a2V5fX1gIDoga2V5XHJcbn1cclxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcclxuICBjb25zdCB7dW5pcSwgc29ydFRhZ30gPSB3aW5kb3cubWl0bS5mbjtcclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhpdGVtcy50YWdzKSAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgaWYgKHRhZ3MuX190YWcyW25zXVtpdGVtXSE9PXVuZGVmaW5lZCkge1xyXG4gICAgYXJyLnB1c2goaXRlbSlcclxuICB9XHJcbiAgcmV0dXJuIGFyci5maWx0ZXIodW5pcSkuc29ydChzb3J0VGFnKVxyXG59XHJcbmZ1bmN0aW9uIGNoZWNrKGl0ZW0pIHtcclxuICByZXR1cm4gaXRlbS5pbmRleE9mKCd1cmw6Jyk9PT0tMSAmJiBpdGVtLmluZGV4T2YoJzonKT4tMVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNlYWNoIHhpdGVtcygkdGFncykgYXMgaXRlbX1cclxuICA8ZGl2IGNsYXNzPVwic3BhY2UzIHtyb3V0ZXRhZygkdGFncywgaXRlbSl9XCI+XHJcbiAgICB7I2lmIGNoZWNrKGl0ZW0pIH1cclxuICAgICAgPGxhYmVsPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgIGRhdGEtaXRlbT17aXRlbX1cclxuICAgICAgICBjaGVja2VkPXskdGFncy5fX3RhZzJbbnNdW2l0ZW1dfSBkaXNhYmxlZC8+XHJcbiAgICAgICAgPHNwYW4+e3RpdGxlKGl0ZW0pfTwvc3Bhbj5cclxuICAgICAgPC9sYWJlbD5cclxuICAgIHs6ZWxzZX1cclxuICAgICAgPGxhYmVsPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgIGRhdGEtaXRlbT17aXRlbX1cclxuICAgICAgICBvbjpjbGljaz17Y2xpY2tlZH0gXHJcbiAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtcy50YWdzW2l0ZW1dfS8+XHJcbiAgICAgICAgPHNwYW4+e3RpdGxlKGl0ZW0pfTwvc3Bhbj4gICAgICBcclxuICAgICAgPC9sYWJlbD5cclxuICAgIHsvaWZ9XHJcbiAgPC9kaXY+XHJcbnsvZWFjaH1cclxuXHJcbjxzdHlsZT5cclxuLnNwYWNlMyB7XHJcbiAgcGFkZGluZy1sZWZ0OiAyOHB4O1xyXG59XHJcbi5zcGFjZTMgc3BhbiB7XHJcbiAgdmVydGljYWwtYWxpZ246IDE1JTtcclxufVxyXG4ucnRhZyB7XHJcbiAgZm9udC1zaXplOiAxM3B4O1xyXG4gIGNvbG9yOiBjYWRldGJsdWU7XHJcbn1cclxuLnJ0YWcuc2xjIHtcclxuICBjb2xvcjogIzVkYWM3NTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbi5ydGFnLnNsYy51cmwge1xyXG4gIGNvbG9yOiAjYzM2ZTAxO1xyXG59XHJcbi5ydGFnLnNsYy5yMiB7XHJcbiAgY29sb3I6ICNmZjE2MTZcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgVGFnczMzIGZyb20gJy4vVGFnczNfMy5zdmVsdGUnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtcztcclxuZXhwb3J0IGxldCBwYXRoO1xyXG5leHBvcnQgbGV0IG5zO1xyXG5cclxuZnVuY3Rpb24gdGl0bGUoaXRlbSkge1xyXG4gIHJldHVybiBgJHtpdGVtLnNwbGl0KCc6JylbMF19OmA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFjdGl2ZShpdGVtKSB7XHJcbiAgbGV0IGVuYWJsZWQgPSAkdGFncy5fX3RhZzJbbnNdW2l0ZW1dPT09ZmFsc2UgPyBmYWxzZSA6IHRydWVcclxuICBmb3IgKGNvbnN0IGlkIGluIGl0ZW1zW2l0ZW1dKSB7XHJcbiAgICBpZiAoaXRlbXNbaXRlbV1baWRdPT09ZmFsc2UpIHtcclxuICAgICAgZW5hYmxlZCA9IGZhbHNlXHJcbiAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBlbmFibGVkID8gJ2F0YWcgc2xjJyA6ICdhdGFnJztcclxufVxyXG5cclxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcclxuICBjb25zdCB7X190YWczfSA9IHRhZ3M7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX190YWczW25zXTtcclxuICBjb25zdCB0eXBzID0gbmFtZXNwYWNlW3BhdGhdO1xyXG4gIGxldCBhcnIgPSBPYmplY3Qua2V5cyh0eXBzKTtcclxuICByZXR1cm4gYXJyO1xyXG59XHJcbmZ1bmN0aW9uIHh0YWdzKHRhZ3MsIGl0ZW0pIHtcclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhpdGVtc1tpdGVtXS50YWdzKSAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgY29uc3QgbWFwID0gYXJyLm1hcCh4ID0+IHguc3BsaXQoJzonKS5wb3AoKSlcclxuICByZXR1cm4gbWFwLnNvcnQoKS5qb2luKCcgJylcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjZWFjaCB4aXRlbXMoJHRhZ3MpIGFzIGl0ZW19XHJcbiAgPGRldGFpbHM+XHJcbiAgICA8c3VtbWFyeSBjbGFzcz1cInNwYWNlMiB7YWN0aXZlKGl0ZW0pfVwiPlxyXG4gICAgICB7dGl0bGUoaXRlbSl9XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwicHJvcFwiPntpdGVtc1tpdGVtXS5ub3RlfHwnJ308L3NwYW4+XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwidGFnc1wiPntgPCR7eHRhZ3MoJHRhZ3MsIGl0ZW0pfT5gfTwvc3Bhbj5cclxuICAgIDwvc3VtbWFyeT5cclxuICAgIDxUYWdzMzMgaXRlbXM9e2l0ZW1zW2l0ZW1dfSB7aXRlbX0ge3BhdGh9IHtuc30vPlxyXG4gIDwvZGV0YWlscz5cclxuey9lYWNofVxyXG5cclxuPHN0eWxlPlxyXG5kZXRhaWxzIHN1bW1hcnkgLnByb3AsXHJcbmRldGFpbHNbb3Blbl0gc3VtbWFyeSAudGFncyB7XHJcbiAgZGlzcGxheTogbm9uZTtcclxufVxyXG5kZXRhaWxzIHN1bW1hcnkgLnRhZ3MsXHJcbmRldGFpbHNbb3Blbl0gc3VtbWFyeSAucHJvcCB7XHJcbiAgZm9udC1mYW1pbHk6IFJvYm90bztcclxuICBmb250LXNpemU6IDExcHg7XHJcbiAgZGlzcGxheTogaW5saW5lO1xyXG59XHJcbmRldGFpbHMgc3VtbWFyeSAudGFncyB7XHJcbiAgbWFyZ2luLWxlZnQ6IC01cHg7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG59XHJcbmRldGFpbHMgc3VtbWFyeSAucHJvcCB7XHJcbiAgY29sb3I6ICNjNTk0OTRcclxufVxyXG5zdW1tYXJ5LnNwYWNlMSxcclxuc3VtbWFyeS5zcGFjZTIge1xyXG4gIG1hcmdpbi1ib3R0b206IDJweDtcclxufVxyXG4uc3BhY2UyIHtcclxuICBwYWRkaW5nLWxlZnQ6IDEycHg7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBjb2xvcjogZ3JlZW47XHJcbn1cclxuLmF0YWcge1xyXG4gIGNvbG9yOiAjZGFjNWM1XHJcbn1cclxuLmF0YWcuc2xjIHtcclxuICBjb2xvcjogcmVkO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogYmVpZ2U7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IFRhZ3MzMiBmcm9tICcuL1RhZ3MzXzIuc3ZlbHRlJztcclxuaW1wb3J0IEV4cGFuZCBmcm9tICcuLi9idXR0b24vRXhwYW5kLnN2ZWx0ZSc7XHJcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi9idXR0b24vQ29sbGFwc2Uuc3ZlbHRlJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbXM7XHJcbmV4cG9ydCBsZXQgbnM7XHJcblxyXG5sZXQgbmFtZXNwYWNlO1xyXG5cclxuZnVuY3Rpb24gcShrZXkpIHtcclxuICByZXR1cm4ga2V5LnJlcGxhY2UoL1tALl0vZywgJy0nKVxyXG59XHJcbmZ1bmN0aW9uIGJ0bkV4cGFuZChlKSB7XHJcbiAgY29uc3Qgbm9kZSA9IGUudGFyZ2V0LnBhcmVudEVsZW1lbnRcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGNvbnN0IGV4cCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdvcGVuJylcclxuICAgIGlmIChleHAhPT1udWxsKSB7XHJcbiAgICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgIyR7bm9kZS5pZH0gZGV0YWlsc2ApXHJcbiAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSlcclxuICAgIH1cclxuICB9LCAwKVxyXG59XHJcbmZ1bmN0aW9uIHhpdGVtcyh0YWdzKSB7XHJcbiAgY29uc3Qge19fdGFnM30gPSB0YWdzO1xyXG4gIG5hbWVzcGFjZSA9IF9fdGFnM1tuc107XHJcbiAgY29uc3QgYXJyID0gT2JqZWN0LmtleXMobmFtZXNwYWNlKS5zb3J0KCk7XHJcbiAgcmV0dXJuIGFycjtcclxufVxyXG5mdW5jdGlvbiB4dGFncyhwYXRoKSB7XHJcbiAgY29uc3QgeyByY2xhc3MgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGxldCBzZWNzID0gbmFtZXNwYWNlW3BhdGhdO1xyXG4gIGxldCBhcnIgPSBPYmplY3Qua2V5cyhzZWNzKS5maWx0ZXIoeD0+eFswXSE9PSc6Jyk7XHJcbiAgbGV0IHRhZzEgPSB7fVxyXG4gIGNvbnN0IGtsYXNzID0gYXJyLm1hcCh4PT4ge1xyXG4gICAgY29uc3QgYXJyID0gT2JqZWN0LmtleXMoc2Vjc1t4XSk7XHJcbiAgICBpZiAoc2Vjc1t4XS50YWdzKSB7XHJcbiAgICAgIHRhZzEgPSB7Li4udGFnMSwgLi4uc2Vjc1t4XS50YWdzfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyci5tYXAoeD0+eC5cclxuICAgICAgICBzcGxpdCgnOicpLlxyXG4gICAgICAgIHBvcCgpLlxyXG4gICAgICAgIHJlcGxhY2UocmNsYXNzLCAnLScpXHJcbiAgICApLmpvaW4oJyBfJylcclxuICB9KVxyXG4gIHRhZzEgPSBPYmplY3Qua2V5cyh0YWcxKVxyXG4gIHRhZzEgPSB0YWcxLmxlbmd0aCA/IGBfJHt0YWcxLmpvaW4oJyBfJykucmVwbGFjZSgvdXJsOi9nLCAnJykucmVwbGFjZShyY2xhc3MsICctJyl9YCA6ICcnXHJcbiAgcmV0dXJuIGAke3RhZzF9IF8ke2tsYXNzLmpvaW4oJyBfJyl9YDtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJib3JkZXJcIj5cclxuICA8ZGl2IGNsYXNzPVwic3BhY2UwXCI+XHJcbiAgICA8IS0tIGZlYXQ6IGF1dG8gY29sbGFwc2VkIGJldHdlZW4gdGFnMiAmIHRhZzMgLS0+XHJcbiAgICA8Q29sbGFwc2Ugb246bWVzc2FnZSBuYW1lPVwic3RhdGUzXCIgcT1cIntgLnQzLiR7cShucyl9YH1cIj48L0NvbGxhcHNlPlxyXG4gICAgPEV4cGFuZCBvbjptZXNzYWdlIG5hbWU9XCJzdGF0ZTNcIiBxPVwie2AudDMuJHtxKG5zKX1gfVwiPjwvRXhwYW5kPlxyXG4gICAgPHNwYW4gY2xhc3M9XCJuc1wiPlxyXG4gICAgICB7I2lmIG5zLm1hdGNoKCdfZ2xvYmFsXycpfVxyXG4gICAgICAgIFs8c3Bhbj57JyAqICd9PC9zcGFuPl1cclxuICAgICAgezplbHNlfVxyXG4gICAgICAgIHtucy5zcGxpdCgnQCcpLnBvcCgpfVxyXG4gICAgICB7L2lmfVxyXG4gICAgPC9zcGFuPlxyXG4gIDwvZGl2PlxyXG4gIDxkaXYgY2xhc3M9XCJ0MyB7cShucyl9XCI+XHJcbiAgICB7I2VhY2ggeGl0ZW1zKCR0YWdzKSBhcyBwYXRoLCBpfVxyXG4gICAgPGRldGFpbHMgaWQ9XCJwYXRoe2l9XCI+XHJcbiAgICAgIDxzdW1tYXJ5IG9uOmNsaWNrPVwie2J0bkV4cGFuZH1cIiBjbGFzcz1cInNwYWNlMSB7eHRhZ3MocGF0aCl9XCI+e3BhdGh9PC9zdW1tYXJ5PlxyXG4gICAgICA8VGFnczMyIGl0ZW1zPXtpdGVtc1twYXRoXX0ge3BhdGh9IHtuc30vPlxyXG4gICAgPC9kZXRhaWxzPlxyXG4gIHsvZWFjaH1cclxuXHJcbiAgPC9kaXY+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYm9yZGVyIHtcclxuICBib3JkZXI6IDFweCBzb2xpZDtcclxufVxyXG4uc3BhY2UwIHtcclxuICBsaW5lLWhlaWdodDogMS41O1xyXG4gIGZvbnQtc2l6ZTogMTRweDtcclxuICBmb250LWZhbWlseTogc2VyaWY7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XHJcbiAgY29sb3I6IGRhcmtibHVlO1xyXG59XHJcbi5zcGFjZTEge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBibHVldmlvbGV0O1xyXG4gIHBhZGRpbmctbGVmdDogM3B4O1xyXG59XHJcbnNwYW4ubnMgc3BhbiB7XHJcbiAgdmVydGljYWwtYWxpZ246IC01cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDAuODtcclxuICBmb250LXNpemU6IDE4cHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBjb2xzO1xyXG5leHBvcnQgbGV0IF9yZXNpemU7XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBUYWdzMzEgZnJvbSAnLi9UYWdzM18xLnN2ZWx0ZSc7XHJcblxyXG5mdW5jdGlvbiBpc3RhZyhucykge1xyXG4gIGNvbnN0IHt0b1JlZ2V4fSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGNvbnN0IGFyciA9IE9iamVjdC5rZXlzKCR0YWdzLl9fdGFnMltuc10pO1xyXG4gIGxldCBvayA9IGFyci5maWx0ZXIoeD0+IHgubWF0Y2goJ3VybDonKSB8fCAheC5tYXRjaCgnOicpKS5sZW5ndGg7XHJcbiAgaWYgKG5zLm1hdGNoKCdAJykpIHtcclxuICAgIG9rID0gZmFsc2VcclxuICB9IGVsc2UgIGlmICgkdGFncy5maWx0ZXJVcmwpIHtcclxuICAgIGNvbnN0IHJneCA9IHRvUmVnZXgobnMucmVwbGFjZSgvfi8sJ1teLl0qJykpO1xyXG4gICAgb2sgPSBvayAmJiBtaXRtLmJyb3dzZXIuYWN0aXZlVXJsLm1hdGNoKHJneCkgfHwgbnM9PT0nX2dsb2JhbF8nO1xyXG4gIH1cclxuICByZXR1cm4gb2s7XHJcbn1cclxuZnVuY3Rpb24gbnNwYWNlKG5zKSB7XHJcbiAgY29uc3Qge19zdWJuc30gPSB3aW5kb3cubWl0bS5yb3V0ZXNbbnNdLl9jaGlsZG5zXHJcbiAgcmV0dXJuIF9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48dGQgc3R5bGU9XCJ3aWR0aDp7X3Jlc2l6ZT09PSdbPDxdJyA/IDM1IDogNDV9JTsge2NvbHM9PT0zID8gJycgOiAnZGlzcGxheTpub25lOyd9XCI+XHJcbnsjZWFjaCBPYmplY3Qua2V5cygkdGFncy5fX3RhZzMpIGFzIG5zfVxyXG4gIHsjaWYgaXN0YWcobnMpfVxyXG4gICAgPCEtLSBmZWF0OiBhdXRvIGNvbGxhcHNlZCBiZXR3ZWVuIHRhZzIgJiB0YWczIC0tPlxyXG4gICAgPFRhZ3MzMSBvbjptZXNzYWdlIGl0ZW1zPXskdGFncy5fX3RhZzNbbnNwYWNlKG5zKV19IG5zPXtuc3BhY2UobnMpfS8+XHJcbiAgey9pZn1cclxuey9lYWNofVxyXG48L3RkPlxyXG4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IGJ0biA9IHt9XHJcbmV4cG9ydCBsZXQgX2lkID0gJydcclxuXHJcbmZ1bmN0aW9uIGhpZGVCdG4oYikgeyBcclxuICBsZXQgYXJyID0gT2JqZWN0LmtleXMoYikuZmlsdGVyKHggPT4gIWJbeF0pXHJcbiAgY29uc3QgaGlkZSA9IGFyci5tYXAoeCA9PiB7XHJcbiAgICBpZiAoeC5zbGljZSgwLDEpPT09J18nIHx8IHg9PT0nZGV2Jykge1xyXG4gICAgICByZXR1cm4gYC4ke19pZH0+bGk+LiR7eH1gXHJcbiAgICB9IGVsc2UgaWYgKHg9PT0nZGVmJykge1xyXG4gICAgICByZXR1cm4gYC4ke19pZH0+bGk+Ll9ub3RhZ2BcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBgLiR7X2lkfSBsaS4ke3h9IGRpdmBcclxuICAgIH1cclxuICB9KVxyXG4gIGNvbnN0IHMxID0gYCR7aGlkZS5qb2luKCcsJyl9IHtkaXNwbGF5OiBub25lO31gXHJcbiAgY29uc3QgYjIgPSBiLmRlZiA/IGAuJHtfaWR9PmxpPi5fbm90YWcge2Rpc3BsYXk6IGJsb2NrICFpbXBvcnRhbnQ7fWAgOiAnJ1xyXG4gIGNvbnN0IGNvbnRlbnQgPSAgYDxzdHlsZT4ke3MxfVxcbiR7YjJ9PHN0eWxlPmBcclxuICByZXR1cm4gY29udGVudFxyXG59XHJcbi8vIHRvIGJlIHJlcmVuZGVyZWQgZnVuYyBuZWVkIHRvIGJlIHBhc3MgaW5cclxuPC9zY3JpcHQ+XHJcblxyXG48c3Bhbj57QGh0bWwgaGlkZUJ0bihidG4pfTwvc3Bhbj5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IFVybFN0eWxlIGZyb20gJy4vVXJsLXN0eWxlLnN2ZWx0ZSc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW1zID0ge31cclxuZXhwb3J0IGxldCBidG4gPSB7fVxyXG5leHBvcnQgbGV0IF9pZCA9ICcnXHJcblxyXG5sZXQgYWxsID0gdHJ1ZVxyXG5sZXQgYXJyID0gW11cclxuXHJcbmZ1bmN0aW9uIGFsbGNoZWNrKCkge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgZm9yIChjb25zdCBpZCBpbiBidG4pIHtcclxuICAgICAgYnRuW2lkXSA9IGFsbFxyXG4gICAgfVxyXG4gIH0sIDEpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGl0ZW1BcnJheShpKSB7XHJcbiAgYXJyID0gT2JqZWN0LmtleXMoaSlcclxuICByZXR1cm4gJydcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbntpdGVtQXJyYXkoaXRlbXMpfVxyXG48ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxyXG4gIHsjaWYgYXJyLmxlbmd0aD4xfVxyXG4gICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxyXG4gICAgICA8aW5wdXRcclxuICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgb246Y2xpY2s9XCJ7YWxsY2hlY2t9XCJcclxuICAgICAgYmluZDpjaGVja2VkPXthbGx9Lz5cclxuICAgICAgYWxsXHJcbiAgICA8L2xhYmVsPlxyXG4gIHsvaWZ9XHJcbiAgeyNlYWNoIGFyciBhcyBpdGVtfVxyXG4gICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxyXG4gICAgICA8aW5wdXRcclxuICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgYmluZDpjaGVja2VkPXtidG5baXRlbV19Lz5cclxuICAgICAge2l0ZW19XHJcbiAgICA8L2xhYmVsPlxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcbjxVcmxTdHlsZSB7X2lkfSB7YnRufS8+XHJcblxyXG48c3R5bGU+XHJcbi5idG4tY29udGFpbmVyIHtcclxuICBkaXNwbGF5OiBpbmxpbmU7XHJcbiAgZm9udC1zaXplOiAxMXB4O1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5cclxuY29uc3QgbGlzdCA9IChpdG0sIGdhcD0nICcpID0+IGl0bSA/IGl0bS5qb2luKGdhcCkgOiAnJ1xyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ1cmwge2l0ZW0udGFncyAmJiBpdGVtLnRhZ3Muam9pbignICcpfVwiPlxyXG4gICoge2l0ZW0udXJsfVxyXG4gIDxzcGFuIGNsYXNzPVwic2VjcyB7bGlzdChpdGVtLnNlY3MpfVwiPntgeyR7bGlzdChpdGVtLnNlY3MpfX1gfTwvc3Bhbj5cclxuICA8c3BhbiBjbGFzcz1cImN0eXAge2xpc3QoaXRlbS5jdHlwKX1cIj57IGl0ZW0uY3R5cCA/IGBbJHtsaXN0KGl0ZW0uc2VjcywnLCcpfV1gIDogJyd9PC9zcGFuPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuICAudXJsIHtcclxuICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbiAgICBtYXJnaW4tbGVmdDogN3B4O1xyXG4gICAgY29sb3I6IGNob2NvbGF0ZTtcclxuICAgIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XHJcbiAgfVxyXG4gIC51cmwuX25vdGFnIHtcclxuICAgIGNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcclxuICB9XHJcbiAgLnVybCBzcGFuIHtcclxuICAgIG1hcmdpbi1sZWZ0OiAtNXB4O1xyXG4gICAgZm9udC1mYW1pbHk6IHN5c3RlbS11aTtcclxuICAgIGZvbnQtc2l6ZTogc21hbGxlcjtcclxuICAgIGZvbnQtd2VpZ2h0OiAzMDA7XHJcbiAgfVxyXG4gIC51cmwgc3Bhbi5pbWFnZSB7XHJcbiAgICBkaXNwbGF5OiBpbmxpbmU7XHJcbiAgfVxyXG4gIDwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgcmVyZW5kZXIgfSBmcm9tICcuL3JlcmVuZGVyLmpzJztcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmltcG9ydCBUaXRsZTEgZnJvbSAnLi9UaXRsZS0xLnN2ZWx0ZSc7XHJcbmltcG9ydCBUaXRsZTIgZnJvbSAnLi9UaXRsZS0yLnN2ZWx0ZSc7XHJcbmltcG9ydCBUaXRsZUJ0biBmcm9tICcuL1RpdGxlLWJ0bi5zdmVsdGUnO1xyXG5pbXBvcnQgVGl0bGVVcmwgZnJvbSAnLi9UaXRsZS11cmwuc3ZlbHRlJztcclxuXHJcblxyXG5jb25zdCByZXBsYWNlID0gKHMscDEscDIscDMpID0+IHAzO1xyXG5sZXQgYnRuMSA9IHtcclxuICByZXNwb25zZTogdHJ1ZSxcclxuICByZXF1ZXN0OiB0cnVlLFxyXG4gIGNhY2hlOiB0cnVlLFxyXG4gIG1vY2s6IHRydWUsXHJcbiAgaHRtbDogdHJ1ZSxcclxuICBqc29uOiB0cnVlLFxyXG4gIGNzczogdHJ1ZSxcclxuICBqczogdHJ1ZSxcclxuICBsb2c6IHRydWUsXHJcbiAgZGVmOiB0cnVlLFxyXG59XHJcbmxldCBidG4yID0ge1xyXG4gIGZsYWc6IHRydWUsXHJcbiAgYXJnczogdHJ1ZSxcclxuICBkZWY6IHRydWVcclxufVxyXG5sZXQgX3VybHMsIF9jZmdzLCB0aXRsZTEsIHRpdGxlMlxyXG5mdW5jdGlvbiBpdGVtbGlzdCh0YWdzU3RvcmUsIHJlcmVuZGVyKSB7XHJcbiAgY29uc29sZS5sb2coJ3JlcmVuZGVyLi4uJyk7XHJcbiAgY29uc3QgeyBfX3RhZzEsIF9fdGFnMiwgX190YWczLCBfX3VybHMsIHJvdXRlcywgZm4gfSA9IHdpbmRvdy5taXRtO1xyXG4gIGNvbnN0IHsgcm1ldGhvZCwgbm9UYWdJblJ1bGUsIGlzUnVsZU9mZiwgb25lU2l0ZSB9ID0gZm47XHJcbiAgbGV0IHVybHMgPSB7fVxyXG4gIGxldCB1cmwyID0ge31cclxuICBsZXQgdXJsMyA9IHt9XHJcblxyXG4gIGZ1bmN0aW9uIGFkZFVybDIoc2VjLCBwYXRoLCB0YWdzKSB7XHJcbiAgICBjb25zdCB7IHJjbGFzcyB9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKHJtZXRob2QsIHJlcGxhY2UpXHJcbiAgICBzZWMgPSBzZWMuc3BsaXQoJzonKVswXVxyXG4gICAgaWYgKHVybDJbcGF0aF09PT11bmRlZmluZWQpIHtcclxuICAgICAgdXJsMltwYXRoXSA9IHt9XHJcbiAgICB9XHJcbiAgICBpZiAodXJsMltwYXRoXVtzZWNdPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgIHVybDJbcGF0aF1bc2VjXSA9IHt9XHJcbiAgICB9XHJcbiAgICB1cmwyW3BhdGhdW3NlY10gPSB0cnVlXHJcbiAgICBpZiAodGFncyAmJiBBcnJheS5pc0FycmF5KHRhZ3MpKSB7XHJcbiAgICAgIGZvciAobGV0IHRhZyBvZiB0YWdzKSB7XHJcbiAgICAgICAgdGFnID0gJ18nK3RhZy5zcGxpdCgnOicpLnBvcCgpLnJlcGxhY2UocmNsYXNzLCAnLScpIC8vIGZlYXQ6IHRhZ3MgaW4gdXJsXHJcbiAgICAgICAgaWYgKHVybDNbcGF0aF09PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgIHVybDNbcGF0aF0gPSB7fVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodXJsM1twYXRoXVt0YWddPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICB1cmwzW3BhdGhdW3RhZ10gPSB7fVxyXG4gICAgICAgIH1cclxuICAgICAgICB1cmwzW3BhdGhdW3RhZ10gPSB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZnVuY3Rpb24gYWRkVXJscyhwYXRoKSB7XHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKHJtZXRob2QsIHJlcGxhY2UpXHJcbiAgICB1cmxzW3BhdGhdID0gdHJ1ZVxyXG4gICAgcmV0dXJuIHBhdGhcclxuICB9XHJcblxyXG4gIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xyXG4gICAgaWYgKG9uZVNpdGUodGFnc1N0b3JlLCBucykpIHtcclxuICAgICAgbnMgPSByb3V0ZXNbbnNdLl9jaGlsZG5zLl9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbiAgICAgIGNvbnN0IHNlY3MgPSAgX190YWcyW25zXVxyXG4gICAgICBmb3IgKGxldCBzZWMgaW4gc2Vjcykge1xyXG4gICAgICAgIGNvbnN0IHRhZzIgPSBzZWNzW3NlY11cclxuICAgICAgICBpZiAodGFnMi5zdGF0ZSAmJiAhc2VjLm1hdGNoKC8oZmxhZ3xhcmdzKTovKSkge1xyXG4gICAgICAgICAgaWYgKHNlYy5tYXRjaCgndXJsOicpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gIF9fdGFnM1tuc11cclxuICAgICAgICAgICAgZm9yIChjb25zdCBwYXRoIGluIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCFpc1J1bGVPZmYod2luZG93Lm1pdG0sIG5zLCBwYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgX3BhdGggPSBhZGRVcmxzKHBhdGgpXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNlYyBpbiBwYXRoc1twYXRoXSkge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0YWdzID0gcGF0aHNbcGF0aF1bc2VjXS50YWdzIC8vIHRhZ3MzXHJcbiAgICAgICAgICAgICAgICAgIGlmIChzZWMuc2xpY2UoMCwgMSkhPT0nOicpIHtcclxuICAgICAgICAgICAgICAgICAgICBhZGRVcmwyKHNlYywgX3BhdGgsIE9iamVjdC5rZXlzKHRhZ3MpKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAoc2VjLm1hdGNoKCc6JykpIHtcclxuICAgICAgICAgICAgbGV0IHNraXAgPSBmYWxzZVxyXG4gICAgICAgICAgICBjb25zdCB0YWdzID0gdGFnMi50YWdzIHx8IFtdXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpIHtcclxuICAgICAgICAgICAgICBpZiAoX190YWcxW25zXVt0YWddPT09ZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHNraXAgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2tpcCkge1xyXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0YWdzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgIHNlYyA9IGAke3NlY30gJHt0YWdzLmpvaW4oJyAnKX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgdGFnID0gc2VjLnNwbGl0KCc6JylbMV07XHJcbiAgICAgICAgICAgIGxldCBhcnIgPSByb3V0ZXNbbnNdW3NlY11cclxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycikpIHtcclxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHVybCBpbiBhcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBub1RhZ0luUnVsZSh1cmwpXHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzUnVsZU9mZih3aW5kb3cubWl0bSwgbnMsIHBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IF9wYXRoID0gYWRkVXJscyh1cmwpXHJcbiAgICAgICAgICAgICAgICAgIGFkZFVybDIoc2VjLCBfcGF0aCwgW3RhZ10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdXJsIG9mIGFycikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IG5vVGFnSW5SdWxlKHVybClcclxuICAgICAgICAgICAgICAgIGlmICghaXNSdWxlT2ZmKHdpbmRvdy5taXRtLCBucywgcGF0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgX3BhdGggPSBhZGRVcmxzKHVybClcclxuICAgICAgICAgICAgICAgICAgYWRkVXJsMihzZWMsIF9wYXRoLCBbdGFnXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZm9yIChsZXQgbnMgaW4gX190YWczKSB7XHJcbiAgICBpZiAob25lU2l0ZSh0YWdzU3RvcmUsIG5zKSkge1xyXG4gICAgICBucyA9IHJvdXRlc1tuc10uX2NoaWxkbnMuX3N1Ym5zIHx8IG5zIC8vIGZlYXQ6IGNoZyB0byBjaGlsZCBuYW1lc3BhY2VcclxuICAgICAgY29uc3QgcGF0aHMgPSBfX3RhZzNbbnNdXHJcbiAgICAgIGZvciAoY29uc3QgcGF0aCBpbiBwYXRocykge1xyXG4gICAgICAgIGlmICghaXNSdWxlT2ZmKHdpbmRvdy5taXRtLCBucywgcGF0aCkpIHtcclxuICAgICAgICAgIGNvbnN0IF9wYXRoID0gYWRkVXJscyhwYXRoKVxyXG4gICAgICAgICAgY29uc3Qgc2VjcyA9IHBhdGhzW3BhdGhdXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IHNlYyBpbiBzZWNzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBzZWNzW3NlY10udGFncyAvLyB0YWdzM1xyXG4gICAgICAgICAgICBpZiAoc2VjLnNsaWNlKDAsIDEpIT09JzonKSB7XHJcbiAgICAgICAgICAgICAgYWRkVXJsMihzZWMsIF9wYXRoLCBPYmplY3Qua2V5cyh0YWdzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBmb3IgKGxldCBucyBpbiBfX3VybHMpIHtcclxuICAgIGlmIChvbmVTaXRlKHRhZ3NTdG9yZSwgbnMpKSB7XHJcbiAgICAgIG5zID0gcm91dGVzW25zXS5fY2hpbGRucy5fc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG4gICAgICBjb25zdCBfdXJscyA9IF9fdXJsc1tuc10gfHwgW11cclxuICAgICAgZm9yIChjb25zdCB1cmwgaW4gX3VybHMpIHtcclxuICAgICAgICBjb25zdCB7cHVyZSwgc2VjcywgdGFnc30gPSBfdXJsc1t1cmxdXHJcbiAgICAgICAgaWYgKHB1cmUpIHtcclxuICAgICAgICAgIGZvciAoY29uc3Qgc2VjIGluIHNlY3MpIHtcclxuICAgICAgICAgICAgY29uc3QgX3BhdGggPSBhZGRVcmxzKHVybClcclxuICAgICAgICAgICAgYWRkVXJsMihzZWMsIF9wYXRoLCB0YWdzKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBsZXQgYXJyID0gT2JqZWN0LmtleXModXJscykuc29ydCgpXHJcbiAgY29uc3QgdXJsczIgPSBbXVxyXG4gIGNvbnN0IHVybHMzID0gW11cclxuICBmb3IgKGNvbnN0IHVybCBvZiBhcnIpIHtcclxuICAgIGNvbnN0IHNlY3MgPSBPYmplY3Qua2V5cyh1cmwyW3VybF0pXHJcbiAgICBjb25zdCB0YWdzID0gT2JqZWN0LmtleXModXJsM1t1cmxdKVxyXG4gICAgbGV0IGN0eXAgPSBbXVxyXG4gICAgZm9yIChsZXQgbnMgaW4gX191cmxzKSB7XHJcbiAgICAgIGlmIChvbmVTaXRlKHRhZ3NTdG9yZSwgbnMpKSB7XHJcbiAgICAgICAgbnMgPSByb3V0ZXNbbnNdLl9jaGlsZG5zLl9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbiAgICAgICAgY29uc3QgX3VybHMgPSBfX3VybHNbbnNdIHx8IFtdXHJcbiAgICAgICAgZm9yIChjb25zdCBfdXJsIGluIF91cmxzKSB7XHJcbiAgICAgICAgICBpZiAodXJsPT09X3VybCkge1xyXG4gICAgICAgICAgICBjdHlwID0gX3VybHNbX3VybF0uY3R5cFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgIWN0eXAubGVuZ3RoICYmIChjdHlwID0gZmFsc2UpXHJcbiAgICBpZiAoc2Vjcy5maW5kKHggPT4gL14oYXJnc3xmbGFnKS8udGVzdCh4KSkpIHtcclxuICAgICAgdXJsczMucHVzaCh7dXJsLCBzZWNzLCBjdHlwLCB0YWdzfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHVybHMyLnB1c2goe3VybCwgc2VjcywgY3R5cCwgdGFnc30pXHJcbiAgICB9XHJcbiAgfVxyXG4gIHRpdGxlMSA9IHt9XHJcbiAgdGl0bGUyID0ge31cclxuICBfdXJscyA9IHVybHMyXHJcbiAgX2NmZ3MgPSB1cmxzM1xyXG4gIGZvciAoY29uc3QgaXRlbSBvZiBfdXJscykge1xyXG4gICAgaWYgKGl0ZW0udGFncy5pbmRleE9mKCdfbm90YWcnKSkge1xyXG4gICAgICB0aXRsZTEuZGVmID0gdHJ1ZVxyXG4gICAgfVxyXG4gICAgZm9yIChjb25zdCBzZWMgb2YgaXRlbS5zZWNzKSB7XHJcbiAgICAgIHRpdGxlMVtzZWNdID0gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgX2NmZ3MpIHtcclxuICAgIGlmIChpdGVtLnRhZ3MuaW5kZXhPZignX25vdGFnJykpIHtcclxuICAgICAgdGl0bGUyLmRlZiA9IHRydWVcclxuICAgIH1cclxuICAgIGZvciAoY29uc3Qgc2VjIG9mIGl0ZW0uc2Vjcykge1xyXG4gICAgICB0aXRsZTJbc2VjXSA9IHRydWVcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICcnXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG57aXRlbWxpc3QoJHRhZ3MsICRyZXJlbmRlcil9XHJcbjx0YWJsZT5cclxuICA8dHI+XHJcbiAgICA8dGg+PFRpdGxlMT48VGl0bGVCdG4gX2lkPVwidXJsc1wiIGl0ZW1zPXt0aXRsZTF9IGJ0bj17YnRuMX0vPjwvVGl0bGUxPjwvdGg+XHJcbiAgICA8dGg+PFRpdGxlMj48VGl0bGVCdG4gX2lkPVwiZmFyZ1wiIGl0ZW1zPXt0aXRsZTJ9IGJ0bj17YnRuMn0vPjwvVGl0bGUyPjwvdGg+XHJcbiAgPC90cj5cclxuICA8dHI+XHJcbiAgICA8dGQ+XHJcbiAgICAgIDxzdHlsZSBpZD1cInVybHNcIj48L3N0eWxlPlxyXG4gICAgICA8dWwgY2xhc3M9XCJ1cmxzXCI+XHJcbiAgICAgICAgeyNlYWNoIF91cmxzIGFzIGl0ZW19XHJcbiAgICAgICAgPGxpIGNsYXNzPVwie2l0ZW0uc2Vjcy5qb2luKCcgJyl9XCI+PFRpdGxlVXJsIHtpdGVtfS8+PC9saT5cclxuICAgICAgICB7L2VhY2h9XHJcbiAgICAgIDwvdWw+ICAgICAgXHJcbiAgICA8L3RkPlxyXG4gICAgPHRkPlxyXG4gICAgICA8c3R5bGUgaWQ9XCJmYXJnXCI+PC9zdHlsZT5cclxuICAgICAgPHVsIGNsYXNzPVwiZmFyZ1wiPlxyXG4gICAgICAgIHsjZWFjaCBfY2ZncyBhcyBpdGVtfVxyXG4gICAgICAgIDxsaSBjbGFzcz1cIntpdGVtLnNlY3Muam9pbignICcpfVwiPjxUaXRsZVVybCB7aXRlbX0vPjwvbGk+XHJcbiAgICAgICAgey9lYWNofVxyXG4gICAgICA8L3VsPiAgICAgIFxyXG4gICAgPC90ZD5cclxuICA8L3RyPlxyXG48L3RhYmxlPlxyXG5cclxuPHN0eWxlPlxyXG50YWJsZSB7XHJcbiAgd2lkdGg6IGNhbGMoMTAwJSAtIDEycHgpO1xyXG4gIG1hcmdpbjogNXB4O1xyXG59XHJcbnRoLCB0ZCB7XHJcbiAgd2lkdGg6IDUwJTtcclxufVxyXG50aCB7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbn1cclxudGQge1xyXG4gIHBhZGRpbmc6IDVweCAwO1xyXG4gIGJvcmRlcjogdGhpbiBzb2xpZDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IHsgc3RhdGVzIH0gZnJvbSAnLi4vYnV0dG9uL3N0YXRlcy5qcyc7XHJcbmltcG9ydCAgQ2hldnJvbiBmcm9tICcuLi9idXR0b24vQ2hldnJvbi5zdmVsdGUnO1xyXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xyXG5pbXBvcnQgQkhlYWRlciBmcm9tICcuLi9ib3gvQkhlYWRlci5zdmVsdGUnO1xyXG5pbXBvcnQgQlRhYmxlIGZyb20gJy4uL2JveC9CVGFibGUuc3ZlbHRlJztcclxuaW1wb3J0IFRhZ3MxIGZyb20gJy4vVGFnczFfLnN2ZWx0ZSc7IFxyXG5pbXBvcnQgVGFnczIgZnJvbSAnLi9UYWdzMl8uc3ZlbHRlJzsgXHJcbmltcG9ydCBUYWdzMyBmcm9tICcuL1RhZ3MzXy5zdmVsdGUnOyBcclxuaW1wb3J0IFVybHMgZnJvbSAnLi9VcmxzLnN2ZWx0ZSc7XHJcblxyXG5leHBvcnQgbGV0IHRvcCA9IFwiMjNcIjtcclxuZXhwb3J0IGxldCBsZWZ0O1xyXG5cclxubGV0IGJsb2NrID0gdHJ1ZTtcclxubGV0IGNvbHMgPSAzO1xyXG5cclxub25Nb3VudChhc3luYyAoKSA9PiB7XHJcbiAgY29uc29sZS53YXJuKCdvbk1vdW50IHRhZ3MvaW5kZXgnKTtcclxufSk7XHJcblxyXG53aW5kb3cubWl0bS5maWxlcy5nZXRSb3V0ZV9ldmVudHMudGFnc1RhYmxlID0gKCkgPT4ge1xyXG4gIC8vIHdpbmRvdy53c19fc2VuZCgnZ2V0Um91dGUnLCAnJywgcm91dGVIYW5kbGVyKTtcclxuICBjb25zb2xlLmxvZygnZXZlbnRzLnRhZ3NUYWJsZS4uLicpO1xyXG4gIGNvbnN0IHtfX3RhZzEsIF9fdGFnMiwgX190YWczfSA9IHdpbmRvdy5taXRtO1xyXG4gIGNvbnN0IHtmaWx0ZXJVcmwsIHVuaXF9ID0gJHRhZ3M7XHJcbiAgY29uc3QgdGdyb3VwID0ge307XHJcbiAgZm9yIChsZXQgbnMgaW4gX190YWcyKSB7XHJcbiAgICBjb25zdCB0c2tzID0gX190YWcyW25zXVxyXG4gICAgZm9yIChsZXQgdGFzayBpbiB0c2tzKSB7XHJcbiAgICAgIGNvbnN0IFtrLHZdID0gdGFzay5zcGxpdCgnOicpO1xyXG4gICAgICBpZiAodiAmJiBrIT09J3VybCcpIHtcclxuICAgICAgICB0Z3JvdXBbdl0gPSB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IFxyXG4gIHRhZ3Muc2V0KHtcclxuICAgIGZpbHRlclVybCxcclxuICAgIF9fdGFnMSxcclxuICAgIF9fdGFnMixcclxuICAgIF9fdGFnMyxcclxuICAgIHRncm91cCxcclxuICAgIHVuaXFcclxuICB9KVxyXG59XHJcbmZ1bmN0aW9uIG9uZUNsaWNrKGUpIHtcclxuICBjb25zdCB7X2NvbHN9ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICBjb2xzID0gK19jb2xzO1xyXG59XHJcbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UoZXZlbnQpIHtcclxuICBjb25zdCB7YWxsLCBuYW1lfSA9IGV2ZW50LmRldGFpbFxyXG4gIGxldCBxXHJcbiAgaWYgKG5hbWU9PT0nc3RhdGUyJykge1xyXG4gICAgYWxsLmNoZXZyb24gPSBhbGwuc3RhdGUyID8gJ1s8PF0nIDogJ1s8PF0nXHJcbiAgICBhbGwuc3RhdGUzID0ge30gLy8gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnM1xyXG4gICAgcSA9ICcudDMnXHJcbiAgfSBlbHNlIGlmIChuYW1lPT09J3N0YXRlMycpIHtcclxuICAgIGFsbC5jaGV2cm9uID0gIWFsbC5zdGF0ZTMgPyAnWz4+XScgOiAnWz4+XSdcclxuICAgIGFsbC5zdGF0ZTIgPSB7fSAvLyBmZWF0OiBhdXRvIGNvbGxhcHNlZCBiZXR3ZWVuIHRhZzIgJiB0YWczXHJcbiAgICBxID0gJy50MidcclxuICB9XHJcbiAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAke3F9IGRldGFpbHNbb3Blbl1gKVxyXG4gIG5vZGVzLmZvckVhY2gobm9kZSA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpKSAgXHJcbiAgc3RhdGVzLnNldChhbGwpXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidmJveFwiPlxyXG4gIDxkZXRhaWxzIG9wZW49XCJ0cnVlXCI+XHJcbiAgICA8c3VtbWFyeT5FbmFibGUgLyBEaXNhYmxlIFRhZ3M8L3N1bW1hcnk+XHJcbiAgICA8ZGl2IGNsYXNzPVwidmJveC0xXCI+XHJcbiAgICAgIDxCU3RhdGljIHt0b3B9IHtibG9ja30+XHJcbiAgICAgICAgPEJIZWFkZXIge2xlZnR9Pi1UYWdzLVxyXG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLV9jb2xzPTMgb246Y2xpY2s9XCJ7b25lQ2xpY2t9XCI+W2Z1bGxdPC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uIGRhdGEtX2NvbHM9MiBvbjpjbGljaz1cIntvbmVDbGlja31cIj5bdHdvXTwvYnV0dG9uPlxyXG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLV9jb2xzPTEgb246Y2xpY2s9XCJ7b25lQ2xpY2t9XCI+W29uZV08L2J1dHRvbj5cclxuICAgICAgICAgIDxDaGV2cm9uLz5cclxuICAgICAgICA8L0JIZWFkZXI+XHJcbiAgICAgICAgPEJUYWJsZT5cclxuICAgICAgICAgIDx0ciBjbGFzcz1cInNldC10YWdzXCI+XHJcbiAgICAgICAgICAgIDxUYWdzMSB7Y29sc30vPlxyXG4gICAgICAgICAgICA8VGFnczIge2NvbHN9IG9uOm1lc3NhZ2U9e2hhbmRsZU1lc3NhZ2V9Lz5cclxuICAgICAgICAgICAgPFRhZ3MzIHtjb2xzfSBvbjptZXNzYWdlPXtoYW5kbGVNZXNzYWdlfS8+XHJcbiAgICAgICAgICA8L3RyPlxyXG4gICAgICAgIDwvQlRhYmxlPlxyXG4gICAgICA8L0JTdGF0aWM+ICBcclxuICAgIDwvZGl2PlxyXG4gIDwvZGV0YWlscz5cclxuICA8ZGV0YWlscyBjbGFzcz1cInVybHNcIj5cclxuICAgIHtAaHRtbCAnPHN0eWxlIGlkPVwidXJsc1wiPjwvc3R5bGU+J31cclxuICAgIDxzdW1tYXJ5PkVmZmVjdGVkIFVybChzKTwvc3VtbWFyeT5cclxuICAgIDxVcmxzLz5cclxuICA8L2RldGFpbHM+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udmJveCB7XHJcbiAgZmxleDogYXV0bztcclxuICBkaXNwbGF5OiBmbGV4O1xyXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDIzcHgpO1xyXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xyXG59XHJcbi52Ym94LTEge1xyXG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XHJcbn1cclxuZGV0YWlscywgc3VtbWFyeSB7XHJcbiAgb3V0bGluZTogbm9uZTtcclxufVxyXG5zdW1tYXJ5IHtcclxuICBib3JkZXI6IG5vbmU7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICBwYWRkaW5nLWxlZnQ6IDVweDtcclxuICBiYWNrZ3JvdW5kOiAjZmRhYWFhO1xyXG59XHJcbi51cmxzIHN1bW1hcnk6aG92ZXIge1xyXG4gIGJhY2tncm91bmQtY29sb3I6ICNmMWY2ZmJiZDtcclxufVxyXG4udXJscyB7XHJcbiAgaGVpZ2h0OiAxMDAlO1xyXG4gIGRpc3BsYXk6IGZsZXg7XHJcbiAgb3ZlcmZsb3c6IGF1dG87XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxufVxyXG4udXJscyBzdW1tYXJ5IHtcclxuICBwb3NpdGlvbjogc3RpY2t5O1xyXG4gIGJhY2tncm91bmQ6IHdoaXRlO1xyXG4gIHRvcDogMHB4O1xyXG59XHJcbmJ1dHRvbiB7XHJcbiAgYm9yZGVyOiAwO1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBjb2xvcjogIzAwMmFmZjtcclxuICBtYXJnaW4tdG9wOiAtNXB4O1xyXG4gIG1hcmdpbi1yaWdodDogLTVweDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogMC42cHg7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgcGFkZGluZzogMnB4IDFweCAxcHggMXB4O1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD4gLy8gZmVhdDogcHJvZmlsZVxyXG4vLyBpbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW07XHJcbmV4cG9ydCBsZXQgb25DaGFuZ2U7XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG5cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskc291cmNlLmZwYXRoPT09aXRlbS5mcGF0aH1cIlxyXG4gIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxyXG4gIG9uOmNsaWNrPVwie2NsaWNrSGFuZGxlcn1cIlxyXG4+e2l0ZW0udGl0bGV9PC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi50ZC1pdGVtIHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzBkOGNjYTE7XHJcbn1cclxuLnRkLWl0ZW0udHJ1ZSB7XHJcbiAgY29sb3I6IGJsdWU7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IG9uQ2hhbmdlO1xyXG5cclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xyXG5cclxubGV0IHJlcmVuZGVyID0gMDtcclxubGV0IGRhdGEgPSBbXTtcclxuXHJcbiQ6IF9kYXRhID0gZGF0YTtcclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG5cclxufSk7XHJcblxyXG5jb25zdCBwcm9maWxlSGFuZGxlciA9IG9iaiA9PiB7XHJcblxyXG59XHJcblxyXG4vLyB3aW5kb3cubWl0bS5maWxlcy50YWdzX2V2ZW50cy5wcm9maWxlVGFibGUgPSAoKSA9PiB7XHJcblxyXG4vLyB9XHJcbjwvc2NyaXB0PlxyXG5cclxueyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBpdGVtfVxyXG4gIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtLCAuLi5fZGF0YVtpdGVtXX19IHtvbkNoYW5nZX0vPlxyXG57L2VhY2h9XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgQnV0dG9uIGZyb20gJy4vQnV0dG9uLnN2ZWx0ZSc7XHJcblxyXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XHJcbmltcG9ydCBDb250ZW50IGZyb20gJy4vQ29udGVudC5zdmVsdGUnO1xyXG5pbXBvcnQgTGlzdCBmcm9tICcuL0xpc3Quc3ZlbHRlJztcclxuXHJcbmxldCBsZWZ0ID0gMTY1O1xyXG5jb25zdCB0b3AgPSAnNDcnO1xyXG5jb25zdCB0aXRsZSA9ICctTGlzdC0nIFxyXG5jb25zdCBpZCA9ICdyb3V0ZUxlZnQnO1xyXG5cclxub25Nb3VudChhc3luYyAoKSA9PiB7XHJcblxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGRyYWdlbmQoe2RldGFpbH0pIHtcclxuICBsZWZ0ID0gZGV0YWlsLmxlZnRcclxufVxyXG5cclxuZnVuY3Rpb24gb25DaGFuZ2UoZSkge1xyXG5cclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24vPlxyXG57I2lmICR0YWdzLmxpc3R9XHJcbiAgPFZCb3gyIHt0aXRsZX0ge3RvcH0ge2xlZnR9IHtkcmFnZW5kfSB7TGlzdH0gcHJvcHM9e3tvbkNoYW5nZX19PlxyXG4gICAgPENvbnRlbnQge2xlZnR9IHtvbkNoYW5nZX0vPlxyXG4gIDwvVkJveDI+XHJcbns6ZWxzZX0gIFxyXG4gIDxDb250ZW50IHtvbkNoYW5nZX0vPlxyXG57L2lmfVxyXG4iLCI8c2NyaXB0PlxyXG5mdW5jdGlvbiBidG5PcGVuKCkge1xyXG4gIHdzX19zZW5kKCdvcGVuSG9tZScsICcnLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIG9wZW4gaG9tZSBmb2xkZXIhJyk7XHJcbiAgfSk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48YnV0dG9uIG9uOmNsaWNrPXtidG5PcGVufT5PcGVuIEhvbWU8L2J1dHRvbj5cclxuIiwiPHNjcmlwdD5cclxuZnVuY3Rpb24gYnRuQ29kZSgpIHtcclxuICB3c19fc2VuZCgnY29kZUhvbWUnLCAnJywgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBjb2RlIGhvbWUgZm9sZGVyIScpO1xyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGJ1dHRvbiBvbjpjbGljaz17YnRuQ29kZX0+Q29kZSBIb21lPC9idXR0b24+XHJcbiIsIjxzY3JpcHQ+XHJcbmZ1bmN0aW9uIGJ0blBvc3RtZXNzYWdlKGUpIHtcclxuICBjb25zdCBwb3N0bWVzc2FnZSA9IGUudGFyZ2V0LmNoZWNrZWQ7XHJcbiAgd3NfX3NlbmQoJ3NldENsaWVudCcsIHtwb3N0bWVzc2FnZX0sIGRhdGEgPT4ge1xyXG4gICAgd2luZG93Lm1pdG0uY2xpZW50LnBvc3RtZXNzYWdlID0gZGF0YS5wb3N0bWVzc2FnZTtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIGNoYW5nZSBzdGF0ZSBwb3N0bWVzc2FnZScsIGRhdGEpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmbGFnKCkge1xyXG4gIHJldHVybiB3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2U7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiPlxyXG4gIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuUG9zdG1lc3NhZ2V9IGNoZWNrZWQ9e2ZsYWcoKX0+XHJcbiAgUG9zdCBNZXNzYWdlc1xyXG48L2xhYmVsPlxyXG4iLCI8c2NyaXB0PlxyXG5mdW5jdGlvbiBidG5Dc3AoZSkge1xyXG4gIGNvbnN0IGNzcCA9IGUudGFyZ2V0LmNoZWNrZWQ7XHJcbiAgd3NfX3NlbmQoJ3NldENsaWVudCcsIHtjc3B9LCBkYXRhID0+IHtcclxuICAgIHdpbmRvdy5taXRtLmNsaWVudC5jc3AgPSBkYXRhLmNzcDtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIGNoYW5nZSBzdGF0ZSBjc3AnLCBkYXRhKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmxhZygpIHtcclxuICByZXR1cm4gd2luZG93Lm1pdG0uY2xpZW50LmNzcDtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XHJcbiAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG9uOmNsaWNrPXtidG5Dc3B9IGNoZWNrZWQ9e2ZsYWcoKX0+XHJcbiAgQ29udGVudCBTZWMuIFBvbGljeVxyXG48L2xhYmVsPlxyXG4iLCIvLyBmZWF0OiBtYXJrZG93blxyXG5pbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gJ3N2ZWx0ZS9zdG9yZSdcclxuXHJcbmV4cG9ydCBjb25zdCBzb3VyY2UgPSB3cml0YWJsZSh7XHJcbiAgb3BlbkRpc2FibGVkOiBmYWxzZSxcclxuICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgZ29EaXNhYmxlZDogdHJ1ZSxcclxuICBjb250ZW50OiAnSGkhJyxcclxuICBmcGF0aDogJycsXHJcbiAgcGF0aDogJydcclxufSlcclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxubGV0IHZhbHVlID0gNjE7XHJcbmZ1bmN0aW9uIHBsb3RWYWx1ZShlKSB7XHJcbiAgdmFsdWUgPSArZS50YXJnZXQudmFsdWVcclxuICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NjYWxlLW1lcm1haWQnKVxyXG4gIG5vZGUuaW5uZXJIVE1MID0gYC5tZXJtYWlkIHtoZWlnaHQ6ICR7dmFsdWV9dmg7fWBcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XHJcbiAgPHNwYW4+e3BhcnNlSW50KHZhbHVlKX08L3NwYW4+XHJcbiAgPGlucHV0IG5hbWU9XCJ3ZWlnaHRcIiB0eXBlPVwicmFuZ2VcIiBtaW49XCIxMFwiIG1heD1cIjEwMFwiIHN0ZXA9XCIxXCIge3ZhbHVlfSBvbjppbnB1dD17cGxvdFZhbHVlfSAvPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLmJ0bi1jb250YWluZXIge1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBtYXJnaW4tdG9wOiA1cHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IC0ycHg7XHJcbn1cclxuc3BhbiB7XHJcbiAgZm9udC1zaXplOiAwLjhlbTtcclxuICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZnVuY3Rpb24gYnRuQ2xvc2UoKSB7XHJcbiAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGlzdC1oZWxwIGRldGFpbHNbb3Blbl0nKVxyXG4gIG5vZGVzLmZvckVhY2gobm9kZSA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpKVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuLUhlbHAtXHJcbjxidXR0b24gY2xhc3M9XCJjbG9sbGFwc2VcIiBvbjpjbGljaz1cIntidG5DbG9zZX1cIj5bLS1dPC9idXR0b24+XHJcblxyXG48c3R5bGU+XHJcbmJ1dHRvbiB7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIGNvbG9yOiAjMDAyYWZmO1xyXG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbiAgcGFkZGluZzogMDtcclxuICBib3JkZXI6IDA7XHJcbiAgbWFyZ2luOiAwO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5vbk1vdW50KCgpID0+IHtcclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFya2Rvd24nKS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xyXG4gICAgY29uc3QgeyBoYXNoIH0gPSBlLnRhcmdldDtcclxuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgaGFzaCk7XHJcbiAgICBpZiAoaGFzaCkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIC8vIGxvY2F0aW9uLmhhc2ggPSBoYXNoO1xyXG4gICAgICBjb25zdCBiZWhhdmlvciA9ICdhdXRvJztcclxuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaGFzaCk7XHJcbiAgICAgIGNvbnN0IHRvcCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gNDA7XHJcbiAgICAgIGNvbnN0IF93aW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2hvdy1jb250YWluZXInKTtcclxuICAgICAgX3dpbmRvdy5zY3JvbGwoe3RvcCwgYmVoYXZpb3J9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxldCBub2RlID0gZS50YXJnZXRcclxuICAgICAgd2hpbGUgKG5vZGUuaWQhPT0nbWFya2Rvd24nKSB7XHJcbiAgICAgICAgaWYgKG5vZGUubm9kZU5hbWU9PT0nQScpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdhbmNob3InKTtcclxuICAgICAgICAgIGlmIChub2RlLmhyZWYubWF0Y2goL2h0dHBzPzpcXC8vKSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybDogbm9kZS5ocmVmIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuXHJcbmxldCBtZXJtYWlkO1xyXG5jb25zdCByID0gLyglLnsyfXxbfi5dKS9nO1xyXG5mdW5jdGlvbiBjb250ZW50KHNyYykge1xyXG4gICFtZXJtYWlkICYmIChtZXJtYWlkID0gd2luZG93Lm1lcm1haWQpO1xyXG4gIC8vIGNvbnNvbGUubG9nKCdwbG90IHRoZSBjb250ZW50Li4uJyk7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcmtkb3duIC5tZXJtYWlkJykpIHtcclxuICAgICAgbWVybWFpZC5pbml0KCk7XHJcbiAgICAgIGNvbnN0IGFyciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdi5kZXRhaWxzJylcclxuICAgICAgZm9yIChsZXQgbm9kZSBvZiBhcnIpIHtcclxuICAgICAgICBjb25zdCB0aXRsZSA9IG5vZGUuZ2V0QXR0cmlidXRlKCd0aXRsZScpXHJcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKVxyXG4gICAgICAgIGRldGFpbHMuaW5uZXJIVE1MID0gYDxzdW1tYXJ5PiR7dGl0bGV9PC9zdW1tYXJ5PmBcclxuICAgICAgICBjb25zdCBjaGlsZHMgPSBbXVxyXG4gICAgICAgIGZvciAobGV0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgIGNoaWxkcy5wdXNoKGNoaWxkKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBjaGlsZCBvZiBjaGlsZHMpIHtcclxuICAgICAgICAgIGRldGFpbHMuYXBwZW5kQ2hpbGQoY2hpbGQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZGV0YWlscylcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFya2Rvd24gYS51cCcpKSB7XHJcbiAgICAgIGxldCBfdG9wO1xyXG4gICAgICBjb25zdCBoMSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2gxJyk7XHJcbiAgICAgIGNvbnN0IGFyciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2gxLGgyLGgzLGg0LGg1Jyk7XHJcbiAgICAgIGgxICYmIChfdG9wID0gYCA8YSBjbGFzcz1cInVwXCIgaHJlZj1cIiMke2gxLmlkfVwiPnt1cH08L2E+YCk7IFxyXG4gICAgICBmb3IgKGxldCBbaSwgbm9kZV0gb2YgYXJyLmVudHJpZXMoKSkge1xyXG4gICAgICAgIGlmIChfdG9wICYmIGkgPiAwKSB7XHJcbiAgICAgICAgICBub2RlLmlubmVySFRNTCA9IGAke25vZGUuaW5uZXJIVE1MfSR7X3RvcH1gXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5vZGUuaWQgPSBub2RlLmlkLnJlcGxhY2UociwgJycpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG5vZGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgMSk7XHJcbiAgcmV0dXJuIHNyYy5jb250ZW50O1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInNob3ctY29udGFpbmVyXCI+XHJcbiAgPGRpdiBpZD1cIm1hcmtkb3duXCI+XHJcbiAgICB7QGh0bWwgY29udGVudCgkc291cmNlKX1cclxuICA8L2Rpdj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbiAgLnNob3ctY29udGFpbmVyIHtcclxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgIGhlaWdodDogY2FsYygxMDB2aCAtIDI1cHgpOyAgXHJcbiAgICBvdmVyZmxvdzogYXV0bztcclxuICB9XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+IC8vIGZlYXQ6IG1hcmtkb3duXHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbTtcclxuXHJcbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XHJcbiAgY29uc29sZS5sb2coaXRlbSk7XHJcbiAgY29uc3Qge2ZwYXRofSA9IGl0ZW07XHJcbiAgd3NfX3NlbmQoJ2dldE1Db250ZW50Jywge2ZwYXRofSwgKHtjb250ZW50fSkgPT4ge1xyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgZnBhdGg6IGl0ZW0uZnBhdGhcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGl0bGUodCkge1xyXG4gIC8vIGNvbnNvbGUubG9nKHQudGl0bGUpXHJcbiAgY29uc3Qgc3RyaW5nID0gdC50aXRsZS5yZXBsYWNlKC9cXC5tZCQvLCcnKVxyXG4gIGNvbnN0IHByZSA9IHN0cmluZy5tYXRjaCgvXihbXmEtekEtWl0rLnwuKS8pWzBdXHJcbiAgY29uc3QgcG9zdCA9IHN0cmluZy5yZXBsYWNlKHByZSwnJykudG9Mb3dlckNhc2UoKVxyXG4gIHJldHVybiBwcmUudG9VcHBlckNhc2UoKSArIHBvc3Q7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5mcGF0aD09PWl0ZW0uZnBhdGh9XCJcclxuICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cclxuICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuPnt0aXRsZShpdGVtKX08L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnRkLWl0ZW06aG92ZXIge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxuLnRkLWl0ZW0sXHJcbi50ZC1zaG93IHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xyXG4gIHBhZGRpbmctbGVmdDogMTJweDtcclxufVxyXG4udGQtaXRlbS50cnVlIHtcclxuICBjb2xvcjogYmx1ZTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuZXhwb3J0IGxldCBpdGVtOyBcclxuZXhwb3J0IGxldCBrZXk7XHJcblxyXG5mdW5jdGlvbiBrbGFzcyhzdG9yZSkge1xyXG4gIGZvciAoY29uc3QgaXRtIGluIGl0ZW0pIHtcclxuICAgIGlmIChpdG09PT1zdG9yZS5mcGF0aCkge1xyXG4gICAgICByZXR1cm4gJ2NoaydcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICcnXHJcbn1cclxuPC9zY3JpcHQ+ICAgIFxyXG5cclxuPHN1bW1hcnkgY2xhc3M9XCJ7a2xhc3MoJHNvdXJjZSl9XCI+XHJcbiAge0BodG1sIGtleX1cclxuPC9zdW1tYXJ5PlxyXG5cclxuPHN0eWxlPlxyXG5zdW1tYXJ5IHtcclxuICBwYWRkaW5nLWxlZnQ6IDJweDtcclxufVxyXG5zdW1tYXJ5LmNoayB7XHJcbiAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICBiYWNrZ3JvdW5kOiAjZTZmN2Q5O1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcclxuaW1wb3J0IFN1bW1hcnkgZnJvbSAnLi9TdW1tYXJ5LnN2ZWx0ZSc7XHJcblxyXG5sZXQgcmVyZW5kZXIgPSAwO1xyXG5sZXQgZGF0YSA9IFtdO1xyXG5cclxuJDogX2RhdGEgPSBkYXRhO1xyXG5cclxub25Nb3VudChhc3luYyAoKSA9PiB7XHJcbiAgY29uc29sZS53YXJuKCdvbk1vdW50IGhlbHAvbGlzdCcpO1xyXG4gIF93c19jb25uZWN0Lm1hcmtkb3duT25Nb3VudCA9ICgpID0+IHdzX19zZW5kKCdnZXRNYXJrZG93bicsICcnLCBtYXJrZG93bkhhbmRsZXIpO1xyXG59KTtcclxuXHJcbmNvbnN0IG1hcmtkb3duSGFuZGxlciA9IG9iaiA9PiB7XHJcbiAgY29uc29sZS53YXJuKCd3c19fc2VuZChnZXRNYXJrZG93biknLCBvYmopO1xyXG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5tYXJrZG93bj09PXVuZGVmaW5lZCkge1xyXG4gICAgd2luZG93Lm1pdG0uZmlsZXMubWFya2Rvd24gPSBvYmo7XHJcbiAgICBkYXRhID0gb2JqO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCB7bWFya2Rvd259ID0gd2luZG93Lm1pdG0uZmlsZXM7XHJcbiAgICBjb25zdCBuZXdtYXJrZG93biA9IHt9O1xyXG4gICAgZm9yIChsZXQgayBpbiBvYmopIHtcclxuICAgICAgbmV3bWFya2Rvd25ba10gPSBvYmpba107XHJcbiAgICB9XHJcbiAgICBkYXRhID0gbmV3bWFya2Rvd247XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5tYXJrZG93biA9IG5ld21hcmtkb3duXHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRQcm9maWxlX2V2ZW50cyA9IHtldmVudE9iamVjdC4uLn1cclxuICAgKi9cclxuICBjb25zdCB7Z2V0UHJvZmlsZV9ldmVudHN9ID0gd2luZG93Lm1pdG0uZmlsZXM7XHJcbiAgZm9yIChsZXQga2V5IGluIGdldFByb2ZpbGVfZXZlbnRzKSB7XHJcbiAgICBnZXRQcm9maWxlX2V2ZW50c1trZXldKGRhdGEpO1xyXG4gIH1cclxuICByZXJlbmRlciA9IHJlcmVuZGVyICsgMTtcclxufVxyXG5cclxud2luZG93Lm1pdG0uZmlsZXMubWFya2Rvd25fZXZlbnRzLm1hcmtkb3duVGFibGUgPSAoKSA9PiB7XHJcbiAgY29uc29sZS5sb2coJ21hcmtkb3duVGFibGUgZ2V0dGluZyBjYWxsZWQhISEnKTtcclxuICB3aW5kb3cud3NfX3NlbmQoJ2dldE1hcmtkb3duJywgJycsIG1hcmtkb3duSGFuZGxlcik7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGlkPVwibGlzdC1oZWxwXCI+XHJcbiAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhKSBhcyBrZXksIGl9XHJcbiAgICB7I2lmIGtleT09PSdfcmVhZG1lXyd9XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJyZWFkbWVcIj5cclxuICAgICAgICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGFba2V5XSkgYXMgaXRlbX1cclxuICAgICAgICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtLCAuLi5fZGF0YVtrZXldW2l0ZW1dfX0vPlxyXG4gICAgICAgIHsvZWFjaH0gICAgXHJcbiAgICAgIDwvZGl2PlxyXG4gICAgezplbHNlfVxyXG4gICAgICA8ZGV0YWlscz5cclxuICAgICAgICA8U3VtbWFyeSBpdGVtPXtfZGF0YVtrZXldfSB7a2V5fSAvPlxyXG4gICAgICAgIHsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YVtrZXldKSBhcyBpdGVtfVxyXG4gICAgICAgICAgPEl0ZW0gaXRlbT17e2VsZW1lbnQ6IGl0ZW0sIC4uLl9kYXRhW2tleV1baXRlbV19fS8+XHJcbiAgICAgICAgey9lYWNofVxyXG4gICAgICA8L2RldGFpbHM+ICBcclxuICAgIHsvaWZ9XHJcbiAgey9lYWNofVxyXG48L2Rpdj5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcblxyXG5pbXBvcnQgQnV0dG9uIGZyb20gJy4vQnV0dG9uLnN2ZWx0ZSc7XHJcbmltcG9ydCBWQm94MiBmcm9tICcuLi9ib3gvVkJveDIuc3ZlbHRlJztcclxuaW1wb3J0IHRpdGxlIGZyb20gJy4vVGl0bGUuc3ZlbHRlJztcclxuaW1wb3J0IFZpZXcgZnJvbSAnLi9WaWV3LnN2ZWx0ZSc7XHJcbmltcG9ydCBMaXN0IGZyb20gJy4vTGlzdC5zdmVsdGUnO1xyXG5cclxubGV0IGxlZnQgPSAxNTA7XHJcbmNvbnN0IGlkICA9ICdoZWxwTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgaGVscC9pbmRleCcpO1xyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XHJcbiAgICBvcHRbaWRdICYmIChsZWZ0ID0gb3B0W2lkXSlcclxuICB9KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XHJcbiAgY29uc3QgZGF0YSA9IHt9XHJcbiAgZGF0YVtpZF0gPSBsZWZ0XHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48QnV0dG9uLz5cclxuPFZCb3gyIHt0aXRsZX0ge2xlZnR9IHtkcmFnZW5kfSB7TGlzdH0+XHJcbiAgPFZpZXcvPlxyXG48L1ZCb3gyPlxyXG4iLCI8c2NyaXB0PlxyXG4vL2h0dHBzOi8vYzBicmEuZ2l0aHViLmlvL3N2ZWxtYS9pbnN0YWxsXHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5cclxuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcclxuaW1wb3J0IFJvdXRlIGZyb20gJy4vY29tcG9uZW50cy9yb3V0ZS9JbmRleC5zdmVsdGUnO1xyXG5pbXBvcnQgUHJvZmlsZSBmcm9tICcuL2NvbXBvbmVudHMvcHJvZmlsZS9JbmRleC5zdmVsdGUnOyAvLyBmZWF0OiBwcm9maWxlXHJcbmltcG9ydCBMb2dzVGFiIGZyb20gJy4vY29tcG9uZW50cy9sb2dzL0luZGV4LnN2ZWx0ZSc7XHJcbmltcG9ydCBUYWdzVGFiIGZyb20gJy4vY29tcG9uZW50cy90YWdzL0luZGV4LnN2ZWx0ZSc7XHJcbmltcG9ydCBPdGhlciBmcm9tICcuL2NvbXBvbmVudHMvb3RoZXIvSW5kZXguc3ZlbHRlJztcclxuaW1wb3J0IEhlbHAgZnJvbSAnLi9jb21wb25lbnRzL2hlbHAvSW5kZXguc3ZlbHRlJztcclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCduYXYudGFicz51bCcpO1xyXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdMSScpO1xyXG4gICAgbGkuaW5uZXJIVE1MID0gJ3YnK3dpbmRvdy5taXRtLnZlcnNpb247XHJcbiAgICBsaS5jbGFzc0xpc3QuYWRkKCd2ZXJzaW9uJyk7XHJcbiAgICBub2RlLmFwcGVuZENoaWxkKGxpKTtcclxuICB9LCAxMCk7XHJcbn0pXHJcbjwvc2NyaXB0PlxyXG5cclxuPG1haW4gY2xhc3M9XCJtYWluXCI+XHJcbjxUYWJzIHN0eWxlPVwiaXMtYm94ZWRcIiBzaXplPVwiaXMtc21hbGxcIj5cclxuICA8VGFiIGxhYmVsPVwiUm91dGVcIj48Um91dGUvPjwvVGFiPlxyXG4gIDxUYWIgbGFiZWw9XCJQcm9maWxlXCI+PFByb2ZpbGUvPjwvVGFiPlxyXG4gIDxUYWIgbGFiZWw9XCJMb2dzXCI+PExvZ3NUYWIvPjwvVGFiPlxyXG4gIDxUYWIgbGFiZWw9XCJUYWdzXCI+PFRhZ3NUYWIvPjwvVGFiPlxyXG4gIDwhLS0gPFRhYiBsYWJlbD1cIk90aGVyXCI+PE90aGVyLz48L1RhYj4gLS0+XHJcbiAgPFRhYiBsYWJlbD1cIkhlbHBcIj48SGVscC8+PC9UYWI+XHJcbjwvVGFicz5cclxuPC9tYWluPlxyXG4iLCIvKiBnbG9iYWwgY2hyb21lICovXHJcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAuc3ZlbHRlJ1xyXG5jb25zdCBybWV0aG9kID0gL14oR0VUfFBVVHxQT1NUfERFTEVURXwpIz9cXGQqIT86KFtcXHcuI34tXSs6fCkoLispLyAvLyBmZWF0OiB0YWdzIGluIHVybFxyXG5jb25zdCByY2xhc3MgPSAvWy4jfi9dKy9nXHJcblxyXG5jb25zb2xlLmxvZygnTG9hZCBNSVRNIHBsdWdpbicpXHJcblxyXG5mdW5jdGlvbiB0b1JlZ2V4IChzdHIsIGZsYWdzID0gJycpIHtcclxuICByZXR1cm4gbmV3IFJlZ0V4cChzdHJcclxuICAgIC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwvJylcclxuICAgIC5yZXBsYWNlKC9cXC4vZywgJ1xcXFwuJylcclxuICAgIC5yZXBsYWNlKC9cXD8vZywgJ1xcXFw/JyksIGZsYWdzKVxyXG59XHJcblxyXG5jb25zdCBzb3J0VGFnID0gKGEsYikgPT4ge1xyXG4gIGNvbnN0IFtrMSx2MV0gPSBhLnNwbGl0KCc6Jyk7XHJcbiAgY29uc3QgW2syLHYyXSA9IGIuc3BsaXQoJzonKTtcclxuICBhID0gdjEgfHwgazE7XHJcbiAgYiA9IHYyIHx8IGsyO1xyXG4gIGlmIChhPGIpIHJldHVybiAtMTtcclxuICBpZiAoYT5iKSByZXR1cm4gMTtcclxuICByZXR1cm4gMDtcclxufVxyXG5cclxuZnVuY3Rpb24gbm9UYWdJblJ1bGUocGF0aCkge1xyXG4gIGNvbnN0IGFyciA9IHBhdGgubWF0Y2gocm1ldGhvZCkgLy8gZmVhdDogdGFncyBpbiB1cmxcclxuICByZXR1cm4gYXJyID8gKGFyclsxXSA/IGAke2FyclsxXX06JHthcnJbM119YCA6IGFyclszXSkgOiBwYXRoXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzUnVsZU9mZih0YWdzLCBucywgcGF0aCkge1xyXG4gIGNvbnN0IHNlY3MgPSB0YWdzLl9fdGFnM1tuc11bcGF0aF1cclxuICBjb25zdCB0YWcyID0gdGFncy5fX3RhZzJbbnNdXHJcbiAgY29uc3QgdGFnMSA9IHRhZ3MuX190YWcxXHJcbiAgaWYgKHNlY3MpIHtcclxuICAgIGxldCBpZDEgPSBbXVxyXG4gICAgbGV0IGlkMiA9IGZhbHNlXHJcbiAgICBmb3IgKGNvbnN0IHNlYyBpbiBzZWNzKSB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBzZWNzW3NlY11cclxuICAgICAgaWYgKG5vZGUudGFnMikge1xyXG4gICAgICAgIGlmICh0YWcyW25vZGUudGFnMl0uc3RhdGU9PT1mYWxzZSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9yIChjb25zdCB0YWcgb2Ygbm9kZS50YWcxKSB7XHJcbiAgICAgICAgICAgIGlmICh0YWcxW25zXVt0YWddPT09ZmFsc2UpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHRhZ3MgPSBub2RlLnRhZ3MgLy8gZmVhdDogdXBkYXRlIF9fdGFnM1xyXG4gICAgICBmb3IgKGNvbnN0IHRhZyBpbiB0YWdzKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbdGFnXSkge1xyXG4gICAgICAgICAgaWQxLnB1c2goc2VjKVxyXG4gICAgICAgIH0gZWxzZSBpZiAodGFnc1t0YWddPT09ZmFsc2UpIHtcclxuICAgICAgICAgIGlkMiA9IHNlY1xyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIGZlYXQ6IHJ1bGUgb2ZmIGlmIFVSTCBpbiB0aGUgc2FtZSBzZWN0aW9uXHJcbiAgICBpZiAoKGlkMS5sZW5ndGg9PT0wICYmIGlkMikgfHwgaWQxLmluZGV4T2YoaWQyKT4tMSkge1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmFsc2VcclxufVxyXG5cclxuZnVuY3Rpb24gdGFnc0luX190YWczKHRhZ3MsIG5zLCBwYXRoLCBzZWMpIHtcclxuICBjb25zdCBzZWNzID0gdGFncy5fX3RhZzNbbnNdW3BhdGhdXHJcbiAgbGV0IGFyciA9IFtdXHJcbiAgaWYgKHNlY3MpIHtcclxuICAgIGNvbnN0IF9zZWMgPSBzZWMuc3BsaXQoJzonKVswXVxyXG4gICAgY29uc3QgdGFncyA9IHNlY3NbX3NlY11cclxuICAgIGlmICh0YWdzKSB7XHJcbiAgICAgIGFyciA9IE9iamVjdC5rZXlzKHRhZ3MpLm1hcCh4PT54LnNwbGl0KCc6JykucG9wKCkpXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBhcnJcclxufVxyXG5cclxuZnVuY3Rpb24gcmVzZXRSdWxlMih0YWdzLCBpdGVtLCBucywgdGFneCkge1xyXG4gIGNvbnN0IHR5cDEgPSBpdGVtLnNwbGl0KCc6JylbMV0gfHwgaXRlbTtcclxuICBjb25zdCBbIGdyb3VwMSwgaWQxIF0gPSB0eXAxLnNwbGl0KCd+Jyk7XHJcbiAgY29uc3QgbmFtZXNwYWNlMiA9IHRhZ3MuX190YWcyW25zXTtcclxuICBjb25zdCB7IHN0YXRlIH0gPSBuYW1lc3BhY2UyW2l0ZW1dOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgaWYgKGlkMSkge1xyXG4gICAgZm9yIChsZXQgaXRtIGluIG5hbWVzcGFjZTIpIHtcclxuICAgICAgY29uc3QgdHlwMiA9IGl0bS5zcGxpdCgnOicpWzFdIHx8IGl0bTtcclxuICAgICAgY29uc3QgW2dyb3VwMiwgaWQyXSA9IHR5cDIuc3BsaXQoJ34nKTtcclxuICAgICAgaWYgKGdyb3VwMT09PWdyb3VwMikge1xyXG4gICAgICAgIGlmIChpZDI9PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgIG5hbWVzcGFjZTJbaXRtXS5zdGF0ZSA9IHN0YXRlOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgICAgICAgfSBlbHNlIGlmIChpZDEhPT1pZDIpIHtcclxuICAgICAgICAgIG5hbWVzcGFjZTJbaXRtXS5zdGF0ZSA9IGZhbHNlOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXNldFJ1bGUzKHRhZ3MsIGl0ZW0sIF9ucykge1xyXG4gIGNvbnN0IHsgcm91dGVzIH0gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCB7X190YWcxLF9fdGFnMixfX3RhZzN9ID0gdGFncztcclxuICBjb25zdCB0MSA9IGl0ZW0uc3BsaXQoJ3VybDonKS5wb3AoKTtcclxuICBjb25zdCB0eXAxID0gaXRlbS5zcGxpdCgnOicpWzFdIHx8IGl0ZW07XHJcbiAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IHR5cDEuc3BsaXQoJ34nKTtcclxuXHJcbiAgbGV0IHRhZzEgPSAhX25zXHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZShucykge1xyXG4gICAgY29uc3QgbmFtZXNwYWNlMiA9IF9fdGFnMltuc107XHJcbiAgICBjb25zdCB1cmxzID0gX190YWczW25zXTtcclxuXHJcbiAgICBsZXQgZmxhZ1xyXG4gICAgaWYgKHRhZzEpIHtcclxuICAgICAgZmxhZyA9IF9fdGFnMVtuc11cclxuICAgICAgaWYgKGZsYWc9PT11bmRlZmluZWQpIHtcclxuICAgICAgICBmbGFnID0gZmFsc2VcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmbGFnID0gZmxhZ1t0MV1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZmxhZyA9IG5hbWVzcGFjZTJbaXRlbV0uc3RhdGVcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCB1cmwgaW4gdXJscykge1xyXG4gICAgICBjb25zdCB0eXBzID0gdXJsc1t1cmxdO1xyXG4gICAgICBmb3IgKGxldCB0eXAgaW4gdHlwcykge1xyXG4gICAgICAgIGNvbnN0IHRhZ3MgPSB0eXBzW3R5cF0udGFnczsgLy8gZmVhdDogdXBkYXRlIF9fdGFnM1xyXG4gICAgICAgIGZvciAobGV0IHRhZyBpbiB0YWdzKSB7XHJcbiAgICAgICAgICBpZiAoaXRlbT09PXRhZykge1xyXG4gICAgICAgICAgICB0YWdzW3RhZ10gPSBmbGFnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29uc3QgaWQgPSB0YWcuc3BsaXQoJ3VybDonKS5wb3AoKVxyXG4gICAgICAgICAgY29uc3QgW2dyb3VwMiwgaWQyXSA9IGlkLnNwbGl0KCd+JylcclxuXHJcbiAgICAgICAgICBpZiAoZ3JvdXAxPT09Z3JvdXAyKSB7XHJcbiAgICAgICAgICAgIGlmICh0YWcxKSB7XHJcbiAgICAgICAgICAgICAgdGFnc1t0YWddID0gIF9fdGFnMVtuc11baWRdIHx8IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlmIChpZDI9PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHRhZ3NbdGFnXSA9IG5hbWVzcGFjZTJbaXRlbV0uc3RhdGVcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlkMSE9PWlkMikge1xyXG4gICAgICAgICAgICAgICAgdGFnc1t0YWddID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICBcclxuICB9XHJcbiAgaWYgKF9ucykge1xyXG4gICAgdXBkYXRlKF9ucylcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgbnNzID0gIHRhZ3MuX190YWcyXHJcbiAgICBmb3IgKGxldCBucyBpbiBuc3MpIHtcclxuICAgICAgaWYgKG9uZVNpdGUodGFncywgbnMpKSB7XHJcbiAgICAgICAgbnMgPSByb3V0ZXNbbnNdLl9jaGlsZG5zLl9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbiAgICAgICAgdXBkYXRlKG5zKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB1bmlxKHZhbHVlLCBpbmRleCwgc2VsZikge1xyXG4gIHJldHVybiBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleDtcclxufVxyXG5cclxuZnVuY3Rpb24gb25lU2l0ZSh0YWdzLCBucykge1xyXG4gIGNvbnN0IHt0b1JlZ2V4fSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGlmIChucy5tYXRjaCgnQCcpKSB7XHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9IGVsc2UgaWYgKHRhZ3MuZmlsdGVyVXJsKSB7XHJcbiAgICBjb25zdCByZ3ggPSB0b1JlZ2V4KG5zLnJlcGxhY2UoL34vLCdbXi5dKicpKTtcclxuICAgIHJldHVybiBtaXRtLmJyb3dzZXIuYWN0aXZlVXJsLm1hdGNoKHJneCkgfHwgbnM9PT0nX2dsb2JhbF8nO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IHtmbn0gPSB3aW5kb3cubWl0bVxyXG5mbi5ybWV0aG9kID0gcm1ldGhvZDtcclxuZm4ucmNsYXNzID0gcmNsYXNzO1xyXG5mbi50YWdzSW5fX3RhZzMgPSB0YWdzSW5fX3RhZzNcclxuZm4ubm9UYWdJblJ1bGUgPSBub1RhZ0luUnVsZVxyXG5mbi5yZXNldFJ1bGUyID0gcmVzZXRSdWxlMlxyXG5mbi5yZXNldFJ1bGUzID0gcmVzZXRSdWxlM1xyXG5mbi5pc1J1bGVPZmYgPSBpc1J1bGVPZmZcclxuZm4uc29ydFRhZyA9IHNvcnRUYWdcclxuZm4ub25lU2l0ZSA9IG9uZVNpdGVcclxuZm4udG9SZWdleCA9IHRvUmVnZXhcclxuZm4udW5pcSA9IHVuaXFcclxud2luZG93Lm1pdG0uZWRpdG9yID0ge307XHJcbndpbmRvdy5taXRtLmJyb3dzZXIgPSB7XHJcbiAgY2hnVXJsX2V2ZW50czoge30sXHJcbiAgYWN0aXZlVXJsOiAnJyxcclxuICBwYWdlOiB7fVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGdVcmwgKHVybCkge1xyXG4gIGlmICghdXJsKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgY29uc29sZS5sb2coJ0NoZyB1cmw6JywgdXJsKVxyXG4gIGNvbnN0IHsgYnJvd3NlciB9ID0gd2luZG93Lm1pdG1cclxuICBicm93c2VyLmFjdGl2ZVVybCA9IHVybFxyXG4gIGZvciAoY29uc3QgZSBpbiBicm93c2VyLmNoZ1VybF9ldmVudHMpIHtcclxuICAgIGJyb3dzZXIuY2hnVXJsX2V2ZW50c1tlXSgpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRVcmwgKCkge1xyXG4gIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCB3aW5kb3dJZDogY2hyb21lLndpbmRvd3MuV0lORE9XX0lEX0NVUlJFTlQgfSxcclxuICAgIGZ1bmN0aW9uICh0YWJzKSB7XHJcbiAgICAgIGNvbnN0IHVybCA9IHRhYnNbMF0udXJsXHJcbiAgICAgIGNoZ1VybCh1cmwpXHJcbiAgICB9XHJcbiAgKVxyXG59O1xyXG5cclxubGV0IGRlYm91bmNlXHJcbmxldCBmaXJzdFJ1blRhYnNPblVwZGF0ZWQgPSAxXHJcbmNocm9tZS50YWJzLm9uVXBkYXRlZC5hZGRMaXN0ZW5lcihmdW5jdGlvbiAodGFiSWQsIGNoYW5nZUluZm8sIHRhYikge1xyXG4gIGlmIChmaXJzdFJ1blRhYnNPblVwZGF0ZWQpIHtcclxuICAgIGNvbnNvbGUubG9nKCdmaXJzdCBydW4gY2hyb21lLnRhYnMub25VcGRhdGVkJylcclxuICAgIGZpcnN0UnVuVGFic09uVXBkYXRlZCA9IDBcclxuICB9XHJcbiAgaWYgKCF0YWIuYWN0aXZlKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcblxyXG4gIGNvbnN0IHsgYnJvd3NlciB9ID0gd2luZG93Lm1pdG1cclxuICBicm93c2VyLnBhZ2UgPSB7XHJcbiAgICAuLi5icm93c2VyLnBhZ2UsXHJcbiAgICAuLi5jaGFuZ2VJbmZvLFxyXG4gICAgLi4udGFiXHJcbiAgfVxyXG5cclxuICBpZiAoY2hhbmdlSW5mby5zdGF0dXMgPT09ICdsb2FkaW5nJykge1xyXG4gICAgYnJvd3Nlci5wYWdlLnRpdGxlID0gJydcclxuICB9IGVsc2UgaWYgKGJyb3dzZXIucGFnZS5zdGF0dXMgPT09ICdjb21wbGV0ZScgJiYgYnJvd3Nlci5wYWdlLnRpdGxlKSB7XHJcbiAgICBpZiAoZGVib3VuY2UpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlKVxyXG4gICAgICBkZWJvdW5jZSA9IHVuZGVmaW5lZFxyXG4gICAgfVxyXG4gICAgZGVib3VuY2UgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgZGVib3VuY2UgPSB1bmRlZmluZWRcclxuICAgICAgY2hnVXJsKHRhYi51cmwpXHJcbiAgICB9LCAxMDAwKVxyXG4gIH1cclxufSlcclxuXHJcbmxldCBmaXJzdFJ1blRhYnNPbkFjdGl2YXRlZCA9IDFcclxuY2hyb21lLnRhYnMub25BY3RpdmF0ZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKGFjdGl2ZUluZm8pIHtcclxuICBpZiAoZmlyc3RSdW5UYWJzT25BY3RpdmF0ZWQpIHtcclxuICAgIGNvbnNvbGUubG9nKCdmaXJzdCBydW4gY2hyb21lLnRhYnMub25BY3RpdmF0ZWQnKVxyXG4gICAgZmlyc3RSdW5UYWJzT25BY3RpdmF0ZWQgPSAwXHJcbiAgfVxyXG4gIGdldFVybCgpXHJcbn0pXHJcblxyXG5jb25zdCBhcHAgPSBuZXcgQXBwKHsgdGFyZ2V0OiBkb2N1bWVudC5ib2R5IH0pXHJcbmNvbnNvbGUubG9nKCdTdGFydCBwbHVnaW4nKVxyXG5nZXRVcmwoKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXBwXHJcbiJdLCJuYW1lcyI6WyJnZXQiLCJzb3VyY2UiLCJidG5zIiwiYnRuVGFnIiwidG9wIiwidGl0bGUiLCJpZCIsImlzR3JvdXAiLCJxIiwibnNwYWNlIiwiZmxhZyJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsU0FBUyxJQUFJLEdBQUcsR0FBRztJQUVuQixTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxF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VUFDdkIsUUFBUSxDQUFDLEdBQUcsTUFDUCxTQUFTLEVBQ1osR0FBRyxFQUFFLENBQUM7Ozs7T0FJWCxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2lDQ0tFLEdBQVMsSUFBQyxRQUFROzs7Ozs7Ozs7Ozs7Ozs7MkVBQWxCLEdBQVMsSUFBQyxRQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0RBWmIsR0FBUyxJQUFDLEdBQUc7Ozs7Ozs7O2lGQUFiLEdBQVMsSUFBQyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkRBRHJCLEdBQVMsSUFBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU07O3dCQUV2QixHQUFTLElBQUMsR0FBRyxLQUFHLE1BQU07d0JBRXRCLEdBQVMsSUFBQyxHQUFHLEtBQUcsTUFBTTt3QkFFdEIsR0FBUyxJQUFDLEdBQUcsS0FBRyxLQUFLO3dCQUVyQixHQUFTLElBQUMsR0FBRyxLQUFHLEtBQUs7d0JBRXJCLEdBQVMsSUFBQyxHQUFHLEtBQUcsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRCQ1FtQixHQUFTLElBQUMsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3VFQUFmLEdB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QUFFO0lBQ2QsRUFBRSxJQUFJLElBQUksRUFBRTtJQUNaLElBQUksTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUM7SUFDbEMsSUFBSSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFDO0lBQzNCLElBQUksSUFBSSxJQUFJLEVBQUU7SUFDZCxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBQztJQUN4RCxLQUFLO0lBQ0wsR0FBRztJQUNILEVBQUUsT0FBTyxHQUFHO0lBQ1osQ0FBQztBQUNEO0lBQ0EsU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFO0lBQzFDLEVBQUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDMUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUMsRUFBRSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxFQUFFLElBQUksR0FBRyxFQUFFO0lBQ1gsSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLFVBQVUsRUFBRTtJQUNoQyxNQUFNLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDO0lBQzVDLE1BQU0sTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxJ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
