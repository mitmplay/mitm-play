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

    const source = writable({
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
    			attr_dev(button, "class", "tlb btn-go svelte-rx0i2q");
    			button.disabled = button_disabled_value = /*$source*/ ctx[0].goDisabled;
    			add_location(button, file$b, 60, 2, 1326);
    			attr_dev(div, "class", "btn-container svelte-rx0i2q");
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
    			attr_dev(button, "class", "tlb btn-go svelte-rx0i2q");
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
    			attr_dev(button, "class", "tlb btn-save svelte-rx0i2q");
    			button.disabled = button_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button, file$b, 68, 2, 1579);
    			attr_dev(div, "class", "btn-container svelte-rx0i2q");
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
    			attr_dev(div, "class", "file-path svelte-rx0i2q");
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
    		source,
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

    const list = writable({
      routez: []
    });

    const tags = writable({
      filterUrl: true,
      __tag1: {},
      __tag2: {},
      __tag3: {},
      route: '',
      uniq: true,
      list: true
    });

    const eurls = writable({
      expanded: false
    });

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
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(2, $source = $$value));
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

    			source.update(
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
    		source,
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
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (99:2) {:else}
    function create_else_block$2(ctx) {
    	let item;
    	let current;

    	item = new Item({
    			props: {
    				item: {
    					element: /*item*/ ctx[7],
    					.../*_data*/ ctx[1][/*item*/ ctx[7]]
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
    				element: /*item*/ ctx[7],
    				.../*_data*/ ctx[1][/*item*/ ctx[7]]
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
    		source: "(99:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (90:2) {#if isGroup(item)}
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
    					element: /*item*/ ctx[7],
    					.../*_data*/ ctx[1][/*item*/ ctx[7]]
    				},
    				onChange: /*onChange*/ ctx[0],
    				group: "group"
    			},
    			$$inline: true
    		});

    	let each_value_1 = childs(/*item*/ ctx[7]);
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
    			add_location(summary, file$e, 91, 4, 2437);
    			add_location(details, file$e, 90, 2, 2422);
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
    				element: /*item*/ ctx[7],
    				.../*_data*/ ctx[1][/*item*/ ctx[7]]
    			};

    			if (dirty & /*onChange*/ 1) item_changes.onChange = /*onChange*/ ctx[0];
    			item.$set(item_changes);

    			if (dirty & /*childs, xlist, _data, onChange*/ 7) {
    				each_value_1 = childs(/*item*/ ctx[7]);
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
    		source: "(90:2) {#if isGroup(item)}",
    		ctx
    	});

    	return block;
    }

    // (95:4) {#each childs(item) as item2}
    function create_each_block_1(ctx) {
    	let item;
    	let current;

    	item = new Item({
    			props: {
    				item: {
    					element: /*item2*/ ctx[10],
    					.../*_data*/ ctx[1][/*item2*/ ctx[10]]
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
    				element: /*item2*/ ctx[10],
    				.../*_data*/ ctx[1][/*item2*/ ctx[10]]
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
    		source: "(95:4) {#each childs(item) as item2}",
    		ctx
    	});

    	return block;
    }

    // (89:0) {#each xlist(_data) as item}
    function create_each_block$2(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*_data*/ 2) show_if = !!isGroup(/*item*/ ctx[7]);
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
    		source: "(89:0) {#each xlist(_data) as item}",
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
    	let $list;
    	validate_store(list, "list");
    	component_subscribe($$self, list, $$value => $$invalidate(5, $list = $$value));
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
    		window.mitm.routez = obj.routez;
    		list.set({ ...$list, routez: obj.routez });
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
    		list,
    		onMount,
    		Item,
    		rerender,
    		data,
    		routeHandler,
    		xlist,
    		childs,
    		isGroup,
    		_data,
    		$list
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
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(4, $source = $$value));
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Index> was created with unknown prop '${key}'`);
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

    const source$1 = writable({
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

    			attr_dev(div, "class", "btn-container svelte-rx0i2q");
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
    			attr_dev(button, "class", "tlb btn-go svelte-rx0i2q");
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
    			attr_dev(button, "class", "tlb btn-save svelte-rx0i2q");
    			button.disabled = button_disabled_value = /*$source*/ ctx[0].saveDisabled;
    			add_location(button, file$f, 75, 2, 1747);
    			attr_dev(div, "class", "btn-container svelte-rx0i2q");
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
    			attr_dev(div, "class", "file-path svelte-rx0i2q");
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		source: source$1,
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$8.warn(`<Item> was created with unknown prop '${key}'`);
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
    	validate_store(source$1, "source");
    	component_subscribe($$self, source$1, $$value => $$invalidate(4, $source = $$value));
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$a.warn(`<Index> was created with unknown prop '${key}'`);
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
    	let button0;
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let t7;
    	let label2;
    	let input2;
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = text("\r\n    routes");
    			t1 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t2 = text("\r\n    fit");
    			t3 = space();
    			button0 = element("button");
    			t4 = text("Reset");
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Save");
    			t7 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t8 = text("\r\n    autosave");
    			t9 = text("\r\n  .");
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "class", "svelte-11wpg9v");
    			add_location(input0, file$r, 55, 4, 1227);
    			attr_dev(label0, "class", "checker svelte-11wpg9v");
    			add_location(label0, file$r, 54, 2, 1198);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "class", "svelte-11wpg9v");
    			add_location(input1, file$r, 61, 4, 1344);
    			attr_dev(label1, "class", "checker svelte-11wpg9v");
    			add_location(label1, file$r, 60, 2, 1315);
    			attr_dev(button0, "class", "tlb btn-go svelte-11wpg9v");
    			button0.disabled = /*autoSave*/ ctx[0];
    			add_location(button0, file$r, 73, 2, 1589);
    			attr_dev(button1, "class", "tlb btn-go svelte-11wpg9v");
    			button1.disabled = /*autoSave*/ ctx[0];
    			add_location(button1, file$r, 74, 2, 1676);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-11wpg9v");
    			add_location(input2, file$r, 76, 4, 1791);
    			attr_dev(label2, "class", "checker svelte-11wpg9v");
    			add_location(label2, file$r, 75, 2, 1762);
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
    			append_dev(div, button0);
    			append_dev(button0, t4);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, t6);
    			append_dev(div, t7);
    			append_dev(div, label2);
    			append_dev(label2, input2);
    			input2.checked = /*autoSave*/ ctx[0];
    			append_dev(label2, t8);
    			append_dev(div, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[4]),
    					listen_dev(button0, "click", btnReset, false, false, false),
    					listen_dev(button1, "click", /*btnSave*/ ctx[2], false, false, false),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[5])
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

    			if (dirty & /*autoSave*/ 1) {
    				prop_dev(button0, "disabled", /*autoSave*/ ctx[0]);
    			}

    			if (dirty & /*autoSave*/ 1) {
    				prop_dev(button1, "disabled", /*autoSave*/ ctx[0]);
    			}

    			if (dirty & /*autoSave*/ 1) {
    				input2.checked = /*autoSave*/ ctx[0];
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
    		input2_change_handler
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

    /* src\components\tags\Preset.svelte generated by Svelte v3.29.7 */
    const file$t = "src\\components\\tags\\Preset.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (65:2) {#each items($tags) as item}
    function create_each_block$6(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*item*/ ctx[2].id + "";
    	let t1;
    	let t2;
    	let button_data_ns_value;
    	let button_data_id_value;
    	let button_title_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("[");
    			t1 = text(t1_value);
    			t2 = text("]");
    			attr_dev(button, "data-ns", button_data_ns_value = /*item*/ ctx[2].ns);
    			attr_dev(button, "data-id", button_data_id_value = /*item*/ ctx[2].id);
    			attr_dev(button, "title", button_title_value = title$2(/*item*/ ctx[2]));
    			attr_dev(button, "class", "svelte-s06igw");
    			add_location(button, file$t, 65, 4, 1636);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*clicked*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$tags*/ 1 && t1_value !== (t1_value = /*item*/ ctx[2].id + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$tags*/ 1 && button_data_ns_value !== (button_data_ns_value = /*item*/ ctx[2].ns)) {
    				attr_dev(button, "data-ns", button_data_ns_value);
    			}

    			if (dirty & /*$tags*/ 1 && button_data_id_value !== (button_data_id_value = /*item*/ ctx[2].id)) {
    				attr_dev(button, "data-id", button_data_id_value);
    			}

    			if (dirty & /*$tags*/ 1 && button_title_value !== (button_title_value = title$2(/*item*/ ctx[2]))) {
    				attr_dev(button, "title", button_title_value);
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
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(65:2) {#each items($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$D(ctx) {
    	let span;
    	let t;
    	let each_value = items(/*$tags*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text("Preset:\r\n  ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "button-container svelte-s06igw");
    			add_location(span, file$t, 62, 0, 1556);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items, $tags, title, clicked*/ 3) {
    				each_value = items(/*$tags*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(span, null);
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
    			if (detaching) detach_dev(span);
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

    function items(tags) {
    	const arr = [];
    	const { routes, fn: { oneSite } } = window.mitm;

    	for (const ns in routes) {
    		const { preset } = routes[ns];

    		if (preset && oneSite(tags, ns)) {
    			for (const id in preset) {
    				arr.push({ ns, id });
    			}
    		}
    	}

    	return arr;
    }

    function title$2(item) {
    	const { ns, id } = item;
    	return window.mitm.routes[ns].preset[id].title;
    }

    function instance$D($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(0, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Preset", slots, []);

    	function clicked(e) {
    		const { routes } = window.mitm;
    		const { ns, id } = e.target.dataset;
    		const { __tag1, __tag2, __tag3 } = window.mitm;
    		const [...preset] = window.mitm.routes[ns].preset[id].tags;

    		for (const path in __tag3[ns]) {
    			const secs = __tag3[ns][path];

    			for (const sec in secs) {
    				const { tags } = secs[sec];

    				for (const tag in tags) {
    					tags[tag] = preset.indexOf(`tag3:${tag}`) > -1;
    					tags[tag] && preset.push(tag.split(":").pop());
    				}
    			}
    		}

    		for (const tag in __tag2[ns]) {
    			const _tg = __tag2[ns][tag];
    			_tg.state = preset.indexOf(tag) > -1;
    			_tg.state && preset.push(tag.split(":").pop());
    		}

    		for (const tag in __tag1[ns]) {
    			__tag1[ns][tag] = preset.indexOf(tag) > -1;
    		}

    		const _childns = {};

    		for (const ns in routes) {
    			_childns[ns] = routes[ns]._childns;
    		}

    		const _tags = { __tag1, __tag2, __tag3 };

    		setTimeout(
    			() => {
    				const sv = { _childns, ..._tags };
    				tags.set({ ...$tags, ..._tags });
    				ws__send("saveTags", sv);
    				urls();
    			},
    			1
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Preset> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ urls, tags, clicked, items, title: title$2, $tags });
    	return [$tags, clicked];
    }

    class Preset extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$D, create_fragment$D, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Preset",
    			options,
    			id: create_fragment$D.name
    		});
    	}
    }

    /* src\components\tags\Tags1_.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$6, console: console_1$h } = globals;
    const file$u = "src\\components\\tags\\Tags1_.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[9] = list;
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (147:0) {#if listTags($tags).length}
    function create_if_block$7(ctx) {
    	let td;
    	let div;
    	let td_style_value;
    	let each_value = /*tgs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			td = element("td");
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "border svelte-yydgal");
    			add_location(div, file$u, 148, 2, 3920);
    			attr_dev(td, "style", td_style_value = /*cols*/ ctx[0] > 1 ? "" : "display:none;");
    			attr_dev(td, "class", "svelte-yydgal");
    			add_location(td, file$u, 147, 0, 3872);
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
    		source: "(147:0) {#if listTags($tags).length}",
    		ctx
    	});

    	return block;
    }

    // (150:4) {#each tgs as item}
    function create_each_block$7(ctx) {
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
    			add_location(input, file$u, 156, 8, 4124);
    			attr_dev(span, "class", "big svelte-yydgal");
    			add_location(span, file$u, 160, 8, 4247);
    			attr_dev(label, "data-item", label_data_item_value = /*item*/ ctx[8]);
    			attr_dev(label, "class", "svelte-yydgal");
    			add_location(label, file$u, 151, 6, 4016);
    			attr_dev(div, "class", div_class_value = "space0 " + /*routetag*/ ctx[5](/*item*/ ctx[8]) + " svelte-yydgal");
    			add_location(div, file$u, 150, 4, 3971);
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
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(150:4) {#each tgs as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$E(ctx) {
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
    		id: create_fragment$E.name,
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

    function instance$E($$self, $$props, $$invalidate) {
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
    				tags.set({ ...$tags, __tag1, __tag2, __tag3 });
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
    		init(this, options, instance$E, create_fragment$E, safe_not_equal, { cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags1",
    			options,
    			id: create_fragment$E.name
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
    const file$v = "src\\components\\tags\\Tags2_Title.svelte";

    function get_each_context$8(ctx, list, i) {
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
    			add_location(span, file$v, 45, 7, 1207);
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
    function create_each_block$8(ctx) {
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
    			add_location(input, file$v, 52, 6, 1360);
    			attr_dev(label, "class", "checker svelte-1fqjhtj");
    			add_location(label, file$v, 51, 4, 1329);
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
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(51:2) {#each childns(ns) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$F(ctx) {
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
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
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
    			add_location(span, file$v, 43, 2, 1149);
    			attr_dev(div, "class", "space0 svelte-1fqjhtj");
    			add_location(div, file$v, 39, 0, 934);
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
    		id: create_fragment$F.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function q(key) {
    	return key.replace(/[@.]/g, "-");
    }

    function instance$F($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$F, create_fragment$F, safe_not_equal, { ns: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2_Title",
    			options,
    			id: create_fragment$F.name
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
    const file$w = "src\\components\\tags\\Tags2_1.svelte";

    function get_each_context$9(ctx, list, i) {
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

    // (109:0) {#if Object.keys(items).length}
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
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
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
    			add_location(div, file$w, 109, 0, 3000);
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
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
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
    		source: "(109:0) {#if Object.keys(items).length}",
    		ctx
    	});

    	return block;
    }

    // (131:4) {:else}
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
    			add_location(input, file$w, 133, 10, 3900);
    			attr_dev(span0, "class", span0_class_value = "itm " + (/*item*/ ctx[13].match(":") ? "big" : "") + " svelte-1if6uvz");
    			add_location(span0, file$w, 137, 10, 4071);
    			attr_dev(span1, "class", "link-tags svelte-1if6uvz");
    			add_location(span1, file$w, 138, 10, 4151);
    			attr_dev(label, "class", "svelte-1if6uvz");
    			add_location(label, file$w, 132, 8, 3881);
    			attr_dev(div, "class", div_class_value = "space1 " + /*routetag*/ ctx[5](/*$tags*/ ctx[2], /*item*/ ctx[13]) + " svelte-1if6uvz");
    			add_location(div, file$w, 131, 6, 3827);
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
    		source: "(131:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (115:4) {#if isGroup(item)}
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
    			add_location(input, file$w, 118, 12, 3304);
    			attr_dev(span0, "class", span0_class_value = "itm " + (/*item*/ ctx[13].match(":") ? "big" : "") + " svelte-1if6uvz");
    			add_location(span0, file$w, 122, 12, 3483);
    			attr_dev(span1, "class", "link-tags svelte-1if6uvz");
    			add_location(span1, file$w, 123, 12, 3565);
    			attr_dev(label, "class", "svelte-1if6uvz");
    			add_location(label, file$w, 117, 10, 3283);
    			attr_dev(summary, "class", summary_class_value = "space1 " + /*routetag*/ ctx[5](/*$tags*/ ctx[2], /*item*/ ctx[13]) + " svelte-1if6uvz");
    			add_location(summary, file$w, 116, 8, 3223);
    			add_location(details, file$w, 115, 6, 3204);
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
    		source: "(115:4) {#if isGroup(item)}",
    		ctx
    	});

    	return block;
    }

    // (127:8) {#each urllist($tags, item) as path}
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
    			add_location(div, file$w, 127, 10, 3711);
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
    		source: "(127:8) {#each urllist($tags, item) as path}",
    		ctx
    	});

    	return block;
    }

    // (113:2) {#each itemlist(items) as item}
    function create_each_block$9(ctx) {
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
    			add_location(div, file$w, 113, 4, 3147);
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
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(113:2) {#each itemlist(items) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$G(ctx) {
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
    		id: create_fragment$G.name,
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

    function instance$G($$self, $$props, $$invalidate) {
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
    				tags.set({ ...$tags, __tag1, __tag2, __tag3 });
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
    		init(this, options, instance$G, create_fragment$G, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2_1",
    			options,
    			id: create_fragment$G.name
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
    const file$x = "src\\components\\tags\\Tags2_.svelte";

    function get_each_context$a(ctx, list, i) {
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
    function create_each_block$a(ctx) {
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
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(14:0) {#each Object.keys($tags.__tag2) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$H(ctx) {
    	let td;
    	let td_style_value;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[2].__tag2);
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
    			td = element("td");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(td, "style", td_style_value = "width:" + (/*$states*/ ctx[1].chevron === "[<<]" ? 45 : 35) + "%; " + (/*cols*/ ctx[0] > 0 ? "" : "display:none;"));
    			add_location(td, file$x, 12, 0, 300);
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
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
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
    		id: create_fragment$H.name,
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

    function instance$H($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$H, create_fragment$H, safe_not_equal, { cols: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags2",
    			options,
    			id: create_fragment$H.name
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
    const file$y = "src\\components\\tags\\Tags3_3.svelte";

    function get_each_context$b(ctx, list, i) {
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
    	let t1_value = title$3(/*item*/ ctx[2]) + "";
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
    			add_location(input, file$y, 73, 8, 1888);
    			attr_dev(span, "class", "svelte-1dy7019");
    			add_location(span, file$y, 77, 8, 2018);
    			add_location(label, file$y, 72, 6, 1871);
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

    			if (dirty & /*$tags*/ 8 && t1_value !== (t1_value = title$3(/*item*/ ctx[2]) + "")) set_data_dev(t1, t1_value);
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
    	let t1_value = title$3(/*item*/ ctx[2]) + "";
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
    			add_location(input, file$y, 66, 8, 1697);
    			attr_dev(span, "class", "svelte-1dy7019");
    			add_location(span, file$y, 69, 8, 1808);
    			add_location(label, file$y, 65, 6, 1680);
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

    			if (dirty & /*$tags*/ 8 && t1_value !== (t1_value = title$3(/*item*/ ctx[2]) + "")) set_data_dev(t1, t1_value);
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
    function create_each_block$b(ctx) {
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
    			add_location(div, file$y, 63, 2, 1604);
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
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(63:0) {#each xitems($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$I(ctx) {
    	let each_1_anchor;
    	let each_value = /*xitems*/ ctx[6](/*$tags*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
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
    					const child_ctx = get_each_context$b(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$b(child_ctx);
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
    		id: create_fragment$I.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$3(item) {
    	const [key, tag] = item.split(":");
    	return tag ? `${tag}{${key}}` : key;
    }

    function check(item) {
    	return item.indexOf("url:") === -1 && item.indexOf(":") > -1;
    }

    function instance$I($$self, $$props, $$invalidate) {
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
    		title: title$3,
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
    		init(this, options, instance$I, create_fragment$I, safe_not_equal, { items: 0, item: 2, path: 7, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_3",
    			options,
    			id: create_fragment$I.name
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
    const file$z = "src\\components\\tags\\Tags3_2.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (38:0) {#each xitems($tags) as item}
    function create_each_block$c(ctx) {
    	let details;
    	let summary;
    	let t0_value = title$4(/*item*/ ctx[7]) + "";
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
    			add_location(span0, file$z, 41, 6, 938);
    			attr_dev(span1, "class", "tags svelte-1ip64o1");
    			add_location(span1, file$z, 42, 6, 994);
    			attr_dev(summary, "class", summary_class_value = "space2 " + /*active*/ ctx[4](/*item*/ ctx[7]) + " svelte-1ip64o1");
    			add_location(summary, file$z, 39, 4, 870);
    			attr_dev(details, "class", "svelte-1ip64o1");
    			add_location(details, file$z, 38, 2, 855);
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
    			if ((!current || dirty & /*$tags*/ 8) && t0_value !== (t0_value = title$4(/*item*/ ctx[7]) + "")) set_data_dev(t0, t0_value);
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
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(38:0) {#each xitems($tags) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$J(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*xitems*/ ctx[5](/*$tags*/ ctx[3]);
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
    		id: create_fragment$J.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$4(item) {
    	return `${item.split(":")[0]}:`;
    }

    function instance$J($$self, $$props, $$invalidate) {
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
    		title: title$4,
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
    		init(this, options, instance$J, create_fragment$J, safe_not_equal, { items: 0, path: 1, ns: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_2",
    			options,
    			id: create_fragment$J.name
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
    const file$A = "src\\components\\tags\\Tags3_1.svelte";

    function get_each_context$d(ctx, list, i) {
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
    			add_location(span, file$A, 59, 9, 1655);
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
    function create_each_block$d(ctx) {
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
    			add_location(summary, file$A, 68, 6, 1860);
    			attr_dev(details, "id", details_id_value = "path" + /*i*/ ctx[10]);
    			add_location(details, file$A, 67, 4, 1830);
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
    		id: create_each_block$d.name,
    		type: "each",
    		source: "(67:4) {#each xitems($tags) as path, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$K(ctx) {
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
    		each_blocks[i] = create_each_block$d(get_each_context$d(ctx, each_value, i));
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
    			add_location(span, file$A, 57, 4, 1593);
    			attr_dev(div0, "class", "space0 svelte-je1upl");
    			add_location(div0, file$A, 53, 2, 1370);
    			attr_dev(div1, "class", div1_class_value = "t3 " + q$2(/*ns*/ ctx[1]) + " svelte-je1upl");
    			add_location(div1, file$A, 65, 2, 1762);
    			attr_dev(div2, "class", "border svelte-je1upl");
    			add_location(div2, file$A, 52, 0, 1346);
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
    					const child_ctx = get_each_context$d(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$d(child_ctx);
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
    		id: create_fragment$K.name,
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

    function instance$K($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$K, create_fragment$K, safe_not_equal, { items: 0, ns: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3_1",
    			options,
    			id: create_fragment$K.name
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
    const file$B = "src\\components\\tags\\Tags3_.svelte";

    function get_each_context$e(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (28:2) {#if istag($tags, ns)}
    function create_if_block$d(ctx) {
    	let tags31;
    	let current;

    	tags31 = new Tags3_1({
    			props: {
    				items: /*$tags*/ ctx[2].__tag3[nspace$1(/*ns*/ ctx[4])],
    				ns: nspace$1(/*ns*/ ctx[4])
    			},
    			$$inline: true
    		});

    	tags31.$on("message", /*message_handler*/ ctx[3]);

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
    			if (dirty & /*$tags*/ 4) tags31_changes.items = /*$tags*/ ctx[2].__tag3[nspace$1(/*ns*/ ctx[4])];
    			if (dirty & /*$tags*/ 4) tags31_changes.ns = nspace$1(/*ns*/ ctx[4]);
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
    		source: "(28:2) {#if istag($tags, ns)}",
    		ctx
    	});

    	return block;
    }

    // (27:0) {#each Object.keys($tags.__tag3) as ns}
    function create_each_block$e(ctx) {
    	let show_if = istag(/*$tags*/ ctx[2], /*ns*/ ctx[4]);
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
    			if (dirty & /*$tags*/ 4) show_if = istag(/*$tags*/ ctx[2], /*ns*/ ctx[4]);

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
    		id: create_each_block$e.name,
    		type: "each",
    		source: "(27:0) {#each Object.keys($tags.__tag3) as ns}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$L(ctx) {
    	let td;
    	let td_style_value;
    	let current;
    	let each_value = Object.keys(/*$tags*/ ctx[2].__tag3);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$e(get_each_context$e(ctx, each_value, i));
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
    			add_location(td, file$B, 25, 0, 752);
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
    			if (dirty & /*$tags, nspace, Object, istag*/ 4) {
    				each_value = Object.keys(/*$tags*/ ctx[2].__tag3);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$e(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$e(child_ctx);
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
    		id: create_fragment$L.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function istag(tags, ns) {
    	const { __tag2, filterUrl } = tags;
    	const { toRegex, oneSite } = window.mitm.fn;
    	const arr = oneSite(tags, ns) ? Object.keys(__tag2[ns]) : [];
    	let ok = arr.filter(x => x.match("url:") || !x.match(":")).length;

    	if (ns.match("@")) {
    		ok = false;
    	} else if (filterUrl) {
    		const rgx = toRegex(ns.replace(/~/, "[^.]*"));
    		ok = ok && mitm.browser.activeUrl.match(rgx) || oneSite(tags, ns); //ns==='_global_';
    	}

    	return ok;
    }

    function nspace$1(ns) {
    	const { _subns } = window.mitm.routes[ns]._childns;
    	return _subns || ns; // feat: chg to child namespace
    }

    function instance$L($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(2, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tags3", slots, []);
    	let { cols } = $$props;
    	let { _resize } = $$props;
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

    	return [cols, _resize, $tags, message_handler];
    }

    class Tags3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$L, create_fragment$L, safe_not_equal, { cols: 0, _resize: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tags3",
    			options,
    			id: create_fragment$L.name
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

    function create_fragment$M(ctx) {
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
    		id: create_fragment$M.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$M($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$M, create_fragment$M, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_1",
    			options,
    			id: create_fragment$M.name
    		});
    	}
    }

    /* src\components\tags\Title-2.svelte generated by Svelte v3.29.7 */

    function create_fragment$N(ctx) {
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
    		id: create_fragment$N.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$N($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$N, create_fragment$N, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_2",
    			options,
    			id: create_fragment$N.name
    		});
    	}
    }

    /* src\components\tags\Url-style.svelte generated by Svelte v3.29.7 */

    const { Object: Object_1$e } = globals;
    const file$C = "src\\components\\tags\\Url-style.svelte";

    function create_fragment$O(ctx) {
    	let span;
    	let raw_value = /*hideBtn*/ ctx[1](/*btn*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$C, 23, 0, 616);
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
    		id: create_fragment$O.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$O($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$O, create_fragment$O, safe_not_equal, { btn: 0, _id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Url_style",
    			options,
    			id: create_fragment$O.name
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
    const file$D = "src\\components\\tags\\Title-btn.svelte";

    function get_each_context$f(ctx, list, i) {
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
    			add_location(input, file$D, 28, 6, 455);
    			attr_dev(label, "class", "checker");
    			add_location(label, file$D, 27, 4, 424);
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
    function create_each_block$f(ctx) {
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
    			add_location(input, file$D, 37, 6, 635);
    			attr_dev(label, "class", "checker");
    			add_location(label, file$D, 36, 4, 604);
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
    		id: create_each_block$f.name,
    		type: "each",
    		source: "(36:2) {#each arr as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$P(ctx) {
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
    		each_blocks[i] = create_each_block$f(get_each_context$f(ctx, each_value, i));
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
    			add_location(div, file$D, 25, 0, 369);
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
    					const child_ctx = get_each_context$f(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$f(child_ctx);
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
    		id: create_fragment$P.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$P($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$P, create_fragment$P, safe_not_equal, { items: 1, btn: 0, _id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_btn",
    			options,
    			id: create_fragment$P.name
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

    const file$E = "src\\components\\tags\\Title-url.svelte";

    function create_fragment$Q(ctx) {
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
    			add_location(span0, file$E, 8, 2, 172);
    			attr_dev(span1, "class", span1_class_value = "ctyp " + /*list*/ ctx[1](/*item*/ ctx[0].ctyp) + " svelte-1ayz7zb");
    			add_location(span1, file$E, 9, 2, 244);
    			attr_dev(div, "class", div_class_value = "url " + (/*item*/ ctx[0].tags && /*item*/ ctx[0].tags.join(" ")) + " svelte-1ayz7zb");
    			add_location(div, file$E, 6, 0, 100);
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
    		id: create_fragment$Q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$Q($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$Q, create_fragment$Q, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title_url",
    			options,
    			id: create_fragment$Q.name
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
    const file$F = "src\\components\\tags\\Urls.svelte";

    function get_each_context$g(ctx, list, i) {
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
    			add_location(li, file$F, 221, 8, 6198);
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
    function create_each_block$g(ctx) {
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
    			add_location(li, file$F, 229, 8, 6411);
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
    		id: create_each_block$g.name,
    		type: "each",
    		source: "(229:8) {#each _cfgs as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$R(ctx) {
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
    		each_blocks[i] = create_each_block$g(get_each_context$g(ctx, each_value, i));
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
    			add_location(th0, file$F, 213, 4, 5918);
    			attr_dev(th1, "class", "svelte-4mez2m");
    			add_location(th1, file$F, 214, 4, 5998);
    			add_location(tr0, file$F, 212, 2, 5908);
    			attr_dev(style0, "id", "urls");
    			add_location(style0, file$F, 218, 6, 6107);
    			attr_dev(ul0, "class", "urls");
    			add_location(ul0, file$F, 219, 6, 6140);
    			attr_dev(td0, "class", "svelte-4mez2m");
    			add_location(td0, file$F, 217, 4, 6095);
    			attr_dev(style1, "id", "farg");
    			add_location(style1, file$F, 226, 6, 6320);
    			attr_dev(ul1, "class", "farg");
    			add_location(ul1, file$F, 227, 6, 6353);
    			attr_dev(td1, "class", "svelte-4mez2m");
    			add_location(td1, file$F, 225, 4, 6308);
    			add_location(tr1, file$F, 216, 2, 6085);
    			attr_dev(table, "class", "svelte-4mez2m");
    			add_location(table, file$F, 211, 0, 5897);
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
    					const child_ctx = get_each_context$g(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$g(child_ctx);
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
    		id: create_fragment$R.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$R($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$R, create_fragment$R, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Urls",
    			options,
    			id: create_fragment$R.name
    		});
    	}
    }

    /* src\components\tags\Effected.svelte generated by Svelte v3.29.7 */
    const file$G = "src\\components\\tags\\Effected.svelte";

    // (19:0) {:else}
    function create_else_block$8(ctx) {
    	let details;
    	let html_tag;
    	let raw_value = "<style id=\"urls\"></style>" + "";
    	let t0;
    	let summary;
    	let t2;
    	let urls;
    	let current;
    	let mounted;
    	let dispose;
    	urls = new Urls({ $$inline: true });

    	const block = {
    		c: function create() {
    			details = element("details");
    			t0 = space();
    			summary = element("summary");
    			summary.textContent = "Effected Url(s)";
    			t2 = space();
    			create_component(urls.$$.fragment);
    			html_tag = new HtmlTag(t0);
    			attr_dev(summary, "class", "svelte-1v9n4z4");
    			add_location(summary, file$G, 21, 2, 448);
    			attr_dev(details, "class", "urls svelte-1v9n4z4");
    			add_location(details, file$G, 19, 0, 383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			html_tag.m(raw_value, details);
    			append_dev(details, t0);
    			append_dev(details, summary);
    			append_dev(details, t2);
    			mount_component(urls, details, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(summary, "click", /*clicked*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(urls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(urls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_component(urls);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$8.name,
    		type: "else",
    		source: "(19:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:0) {#if $eurls.expanded}
    function create_if_block$f(ctx) {
    	let details;
    	let html_tag;
    	let raw_value = "<style id=\"urls\"></style>" + "";
    	let t0;
    	let summary;
    	let t2;
    	let urls;
    	let current;
    	let mounted;
    	let dispose;
    	urls = new Urls({ $$inline: true });

    	const block = {
    		c: function create() {
    			details = element("details");
    			t0 = space();
    			summary = element("summary");
    			summary.textContent = "Effected Url(s)";
    			t2 = space();
    			create_component(urls.$$.fragment);
    			html_tag = new HtmlTag(t0);
    			attr_dev(summary, "class", "svelte-1v9n4z4");
    			add_location(summary, file$G, 15, 2, 296);
    			attr_dev(details, "class", "urls svelte-1v9n4z4");
    			details.open = "true";
    			add_location(details, file$G, 13, 0, 219);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			html_tag.m(raw_value, details);
    			append_dev(details, t0);
    			append_dev(details, summary);
    			append_dev(details, t2);
    			mount_component(urls, details, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(summary, "click", /*clicked*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(urls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(urls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_component(urls);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(13:0) {#if $eurls.expanded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$S(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$f, create_else_block$8];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$eurls*/ ctx[0].expanded) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
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
    		id: create_fragment$S.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$S($$self, $$props, $$invalidate) {
    	let $eurls;
    	validate_store(eurls, "eurls");
    	component_subscribe($$self, eurls, $$value => $$invalidate(0, $eurls = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Effected", slots, []);

    	function clicked(e) {
    		const expanded = !$eurls.expanded;
    		eurls.set({ expanded });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Effected> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Urls, eurls, clicked, $eurls });
    	return [$eurls, clicked];
    }

    class Effected extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$S, create_fragment$S, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Effected",
    			options,
    			id: create_fragment$S.name
    		});
    	}
    }

    /* src\components\tags\Content.svelte generated by Svelte v3.29.7 */

    const { console: console_1$k } = globals;
    const file$H = "src\\components\\tags\\Content.svelte";

    // (74:8) <BHeader {left}>
    function create_default_slot_2$2(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let chevron;
    	let current;
    	let mounted;
    	let dispose;
    	chevron = new Chevron({ $$inline: true });

    	const block_1 = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "[full]";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "[two]";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "[one]";
    			t5 = space();
    			create_component(chevron.$$.fragment);
    			attr_dev(button0, "data-_cols", "3");
    			attr_dev(button0, "class", "svelte-gpyl4i");
    			add_location(button0, file$H, 74, 10, 2008);
    			attr_dev(button1, "data-_cols", "2");
    			attr_dev(button1, "class", "svelte-gpyl4i");
    			add_location(button1, file$H, 75, 10, 2078);
    			attr_dev(button2, "data-_cols", "1");
    			attr_dev(button2, "class", "svelte-gpyl4i");
    			add_location(button2, file$H, 76, 10, 2147);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t5, anchor);
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
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t5);
    			destroy_component(chevron, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(74:8) <BHeader {left}>",
    		ctx
    	});

    	return block_1;
    }

    // (80:8) <BTable>
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
    			add_location(tr, file$H, 80, 10, 2276);
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
    		source: "(80:8) <BTable>",
    		ctx
    	});

    	return block_1;
    }

    // (73:6) <BStatic {top} {block}>
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
    		source: "(73:6) <BStatic {top} {block}>",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$T(ctx) {
    	let div1;
    	let details;
    	let summary;
    	let t0;
    	let preset;
    	let t1;
    	let div0;
    	let bstatic;
    	let t2;
    	let effected;
    	let current;
    	preset = new Preset({ $$inline: true });

    	bstatic = new BStatic({
    			props: {
    				top: /*top*/ ctx[0],
    				block: /*block*/ ctx[3],
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	effected = new Effected({ $$inline: true });

    	const block_1 = {
    		c: function create() {
    			div1 = element("div");
    			details = element("details");
    			summary = element("summary");
    			t0 = text("Enable / Disable Tags ");
    			create_component(preset.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			create_component(bstatic.$$.fragment);
    			t2 = space();
    			create_component(effected.$$.fragment);
    			attr_dev(summary, "class", "svelte-gpyl4i");
    			add_location(summary, file$H, 70, 4, 1862);
    			attr_dev(div0, "class", "vbox-1 svelte-gpyl4i");
    			add_location(div0, file$H, 71, 4, 1919);
    			details.open = "true";
    			attr_dev(details, "class", "svelte-gpyl4i");
    			add_location(details, file$H, 69, 2, 1835);
    			attr_dev(div1, "class", "vbox svelte-gpyl4i");
    			add_location(div1, file$H, 68, 0, 1813);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, details);
    			append_dev(details, summary);
    			append_dev(summary, t0);
    			mount_component(preset, summary, null);
    			append_dev(details, t1);
    			append_dev(details, div0);
    			mount_component(bstatic, div0, null);
    			append_dev(div1, t2);
    			mount_component(effected, div1, null);
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
    			transition_in(preset.$$.fragment, local);
    			transition_in(bstatic.$$.fragment, local);
    			transition_in(effected.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(preset.$$.fragment, local);
    			transition_out(bstatic.$$.fragment, local);
    			transition_out(effected.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(preset);
    			destroy_component(bstatic);
    			destroy_component(effected);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$T.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance$T($$self, $$props, $$invalidate) {
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
    		const { __tag1, __tag2, __tag3 } = window.mitm;

    		console.log("events.tagsTable...");
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

    		tags.set({ ...$tags, __tag1, __tag2, __tag3, tgroup });
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
    		Preset,
    		Tags1,
    		Tags2,
    		Tags3,
    		Effected,
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
    		init(this, options, instance$T, create_fragment$T, safe_not_equal, { top: 0, left: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$T.name
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
    const file$I = "src\\components\\tags\\Item.svelte";

    function create_fragment$U(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[0].route + "";
    	let t;
    	let div_class_value;
    	let div_data_route_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "td-item " + (/*item*/ ctx[0].route === /*$tags*/ ctx[1].route) + " svelte-rqs7oq");
    			attr_dev(div, "data-route", div_data_route_value = /*item*/ ctx[0].route);
    			add_location(div, file$I, 17, 0, 262);
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
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].route + "")) set_data_dev(t, t_value);

    			if (dirty & /*item, $tags*/ 3 && div_class_value !== (div_class_value = "td-item " + (/*item*/ ctx[0].route === /*$tags*/ ctx[1].route) + " svelte-rqs7oq")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*item*/ 1 && div_data_route_value !== (div_data_route_value = /*item*/ ctx[0].route)) {
    				attr_dev(div, "data-route", div_data_route_value);
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
    		id: create_fragment$U.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$U($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(1, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { item } = $$props;

    	function clickHandler(e) {
    		let { route } = e.target.dataset;

    		if (route === $tags.route) {
    			route = "";
    		}

    		tags.set({ ...$tags, route });
    	}

    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ tags, item, clickHandler, $tags });

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $tags, clickHandler];
    }

    class Item$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$U, create_fragment$U, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$U.name
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

    /* src\components\tags\List.svelte generated by Svelte v3.29.7 */

    function get_each_context$h(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (6:0) {#each $list.routez as route}
    function create_each_block$h(ctx) {
    	let item;
    	let current;

    	item = new Item$3({
    			props: { item: { route: /*route*/ ctx[1] } },
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
    			if (dirty & /*$list*/ 1) item_changes.item = { route: /*route*/ ctx[1] };
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
    		id: create_each_block$h.name,
    		type: "each",
    		source: "(6:0) {#each $list.routez as route}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$V(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$list*/ ctx[0].routez;
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
    			if (dirty & /*$list*/ 1) {
    				each_value = /*$list*/ ctx[0].routez;
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
    		id: create_fragment$V.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$V($$self, $$props, $$invalidate) {
    	let $list;
    	validate_store(list, "list");
    	component_subscribe($$self, list, $$value => $$invalidate(0, $list = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ list, Item: Item$3, $list });
    	return [$list];
    }

    class List$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$V, create_fragment$V, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$V.name
    		});
    	}
    }

    /* src\components\tags\Index.svelte generated by Svelte v3.29.7 */

    // (24:0) {:else}
    function create_else_block$9(ctx) {
    	let content;
    	let current;
    	content = new Content({ $$inline: true });

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
    		id: create_else_block$9.name,
    		type: "else",
    		source: "(24:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if $tags.list}
    function create_if_block$g(ctx) {
    	let vbox2;
    	let current;

    	vbox2 = new VBox2({
    			props: {
    				title: title$5,
    				top: top$3,
    				left: /*left*/ ctx[0],
    				dragend: /*dragend*/ ctx[2],
    				List: List$3,
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
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(20:0) {#if $tags.list}",
    		ctx
    	});

    	return block;
    }

    // (21:2) <VBox2 {title} {top} {left} {dragend} {List}>
    function create_default_slot$c(ctx) {
    	let content;
    	let current;

    	content = new Content({
    			props: { left: /*left*/ ctx[0] },
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
    		source: "(21:2) <VBox2 {title} {top} {left} {dragend} {List}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$W(ctx) {
    	let button;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	button = new Button$3({ $$inline: true });
    	const if_block_creators = [create_if_block$g, create_else_block$9];
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
    		id: create_fragment$W.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const top$3 = "0";
    const title$5 = "-Route(s)-";
    const id$3 = "routeLeft";

    function instance$W($$self, $$props, $$invalidate) {
    	let $tags;
    	validate_store(tags, "tags");
    	component_subscribe($$self, tags, $$value => $$invalidate(1, $tags = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Index", slots, []);
    	let left = 165;

    	function dragend({ detail }) {
    		$$invalidate(0, left = detail.left);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		tags,
    		Button: Button$3,
    		VBox2,
    		Content,
    		List: List$3,
    		left,
    		top: top$3,
    		title: title$5,
    		id: id$3,
    		dragend,
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
    		init(this, options, instance$W, create_fragment$W, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$W.name
    		});
    	}
    }

    /* src\components\other\OpenHome.svelte generated by Svelte v3.29.7 */

    const { console: console_1$l } = globals;
    const file$J = "src\\components\\other\\OpenHome.svelte";

    function create_fragment$X(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open Home";
    			add_location(button, file$J, 8, 0, 137);
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
    		id: create_fragment$X.name,
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

    function instance$X($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$X, create_fragment$X, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OpenHome",
    			options,
    			id: create_fragment$X.name
    		});
    	}
    }

    /* src\components\other\CodeHome.svelte generated by Svelte v3.29.7 */

    const { console: console_1$m } = globals;
    const file$K = "src\\components\\other\\CodeHome.svelte";

    function create_fragment$Y(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Code Home";
    			add_location(button, file$K, 8, 0, 137);
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
    		id: create_fragment$Y.name,
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

    function instance$Y($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$Y, create_fragment$Y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodeHome",
    			options,
    			id: create_fragment$Y.name
    		});
    	}
    }

    /* src\components\other\Postmessage.svelte generated by Svelte v3.29.7 */

    const { console: console_1$n } = globals;
    const file$L = "src\\components\\other\\Postmessage.svelte";

    function create_fragment$Z(ctx) {
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
    			add_location(input, file$L, 15, 2, 361);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$L, 14, 0, 333);
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
    		id: create_fragment$Z.name,
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

    function instance$Z($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$Z, create_fragment$Z, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Postmessage",
    			options,
    			id: create_fragment$Z.name
    		});
    	}
    }

    /* src\components\other\Csp.svelte generated by Svelte v3.29.7 */

    const { console: console_1$o } = globals;
    const file$M = "src\\components\\other\\Csp.svelte";

    function create_fragment$_(ctx) {
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
    			add_location(input, file$M, 15, 2, 305);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$M, 14, 0, 277);
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
    		id: create_fragment$_.name,
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

    function instance$_($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$_, create_fragment$_, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Csp",
    			options,
    			id: create_fragment$_.name
    		});
    	}
    }

    /* src\components\other\Index.svelte generated by Svelte v3.29.7 */
    const file$N = "src\\components\\other\\Index.svelte";

    function create_fragment$$(ctx) {
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
    			add_location(li0, file$N, 8, 0, 197);
    			attr_dev(li1, "class", "svelte-eb1kd7");
    			add_location(li1, file$N, 9, 0, 219);
    			attr_dev(li2, "class", "svelte-eb1kd7");
    			add_location(li2, file$N, 10, 0, 241);
    			attr_dev(li3, "class", "svelte-eb1kd7");
    			add_location(li3, file$N, 11, 0, 266);
    			attr_dev(ul, "class", "svelte-eb1kd7");
    			add_location(ul, file$N, 7, 0, 191);
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
    		id: create_fragment$$.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$$($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$$, create_fragment$$, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$$.name
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

    /* src\components\help\Button.svelte generated by Svelte v3.29.7 */
    const file$O = "src\\components\\help\\Button.svelte";

    function create_fragment$10(ctx) {
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
    			add_location(span, file$O, 12, 2, 277);
    			attr_dev(input, "name", "weight");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "10");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "step", "1");
    			input.value = /*value*/ ctx[0];
    			add_location(input, file$O, 13, 2, 311);
    			attr_dev(div, "class", "btn-container svelte-fmpgpb");
    			add_location(div, file$O, 11, 0, 246);
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
    		id: create_fragment$10.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$10($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$10, create_fragment$10, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$10.name
    		});
    	}
    }

    /* src\components\help\Title.svelte generated by Svelte v3.29.7 */

    const file$P = "src\\components\\help\\Title.svelte";

    function create_fragment$11(ctx) {
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
    			add_location(button, file$P, 8, 0, 183);
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
    		id: create_fragment$11.name,
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

    function instance$11($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$11, create_fragment$11, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$11.name
    		});
    	}
    }

    /* src\components\help\View.svelte generated by Svelte v3.29.7 */

    const { console: console_1$p } = globals;
    const file$Q = "src\\components\\help\\View.svelte";

    function create_fragment$12(ctx) {
    	let div1;
    	let div0;
    	let raw_value = /*content*/ ctx[1](/*$source*/ ctx[0]) + "";

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "markdown");
    			add_location(div0, file$Q, 77, 2, 2334);
    			attr_dev(div1, "class", "show-container svelte-1nvl3j1");
    			add_location(div1, file$Q, 76, 0, 2302);
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
    		id: create_fragment$12.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const r = /(%.{2}|[~.])/g;

    function instance$12($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$12, create_fragment$12, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "View",
    			options,
    			id: create_fragment$12.name
    		});
    	}
    }

    /* src\components\help\Item.svelte generated by Svelte v3.29.7 */

    const { console: console_1$q } = globals;
    const file$R = "src\\components\\help\\Item.svelte";

    function create_fragment$13(ctx) {
    	let div;
    	let t_value = title$6(/*item*/ ctx[0]) + "";
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
    			add_location(div, file$R, 28, 0, 598);
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
    			if (dirty & /*item*/ 1 && t_value !== (t_value = title$6(/*item*/ ctx[0]) + "")) set_data_dev(t, t_value);

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
    		id: create_fragment$13.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function title$6(t) {
    	// console.log(t.title)
    	const string = t.title.replace(/\.md$/, "");

    	const pre = string.match(/^([^a-zA-Z]+.|.)/)[0];
    	const post = string.replace(pre, "").toLowerCase();
    	return pre.toUpperCase() + post;
    }

    function instance$13($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$q.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		source: source$2,
    		item,
    		clickHandler,
    		title: title$6,
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
    		init(this, options, instance$13, create_fragment$13, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$13.name
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
    const file$S = "src\\components\\help\\Summary.svelte";

    function create_fragment$14(ctx) {
    	let summary;
    	let summary_class_value;

    	const block = {
    		c: function create() {
    			summary = element("summary");
    			attr_dev(summary, "class", summary_class_value = "" + (null_to_empty(/*klass*/ ctx[2](/*$source*/ ctx[1])) + " svelte-11sbt5s"));
    			add_location(summary, file$S, 15, 0, 236);
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
    		id: create_fragment$14.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$14($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source$2, "source");
    	component_subscribe($$self, source$2, $$value => $$invalidate(1, $source = $$value));
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

    	$$self.$capture_state = () => ({ source: source$2, item, key, klass, $source });

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
    		init(this, options, instance$14, create_fragment$14, safe_not_equal, { item: 3, key: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$14.name
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

    const { Object: Object_1$h, console: console_1$r } = globals;
    const file$T = "src\\components\\help\\List.svelte";

    function get_each_context$i(ctx, list, i) {
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
    function create_else_block$a(ctx) {
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
    			add_location(details, file$T, 55, 6, 1498);
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
    		id: create_else_block$a.name,
    		type: "else",
    		source: "(55:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#if key==='_readme_'}
    function create_if_block$h(ctx) {
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
    			add_location(div, file$T, 49, 6, 1310);
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
    		id: create_if_block$h.name,
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
    function create_each_block$i(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$h, create_else_block$a];
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
    		id: create_each_block$i.name,
    		type: "each",
    		source: "(48:2) {#each Object.keys(_data) as key, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$15(ctx) {
    	let div;
    	let current;
    	let each_value = Object.keys(/*_data*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$i(get_each_context$i(ctx, each_value, i));
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
    			add_location(div, file$T, 46, 0, 1214);
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
    					const child_ctx = get_each_context$i(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$i(child_ctx);
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
    		id: create_fragment$15.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$15($$self, $$props, $$invalidate) {
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

    	Object_1$h.keys($$props).forEach(key => {
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
    		init(this, options, instance$15, create_fragment$15, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$15.name
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

    function create_fragment$16(ctx) {
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
    		id: create_fragment$16.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const id$4 = "helpLeft";

    function instance$16($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$16, create_fragment$16, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$16.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.7 */
    const file$U = "src\\App.svelte";

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

    function create_fragment$17(ctx) {
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
    			add_location(main, file$U, 23, 0, 753);
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
    		id: create_fragment$17.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$17($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$17, create_fragment$17, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$17.name
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
      const {list, route, filterUrl} = tags;
      if (ns.match('@')) {
        return false
      } else if (list && route) {
        return route===ns
      } else if (filterUrl) {
        const {activeUrl} = mitm.browser;
        const rgx = toRegex(ns.replace(/~/,'[^.]*'));
        const {origin} = activeUrl ? new URL(activeUrl) : {origin: ''};
        return origin.match(rgx) || ns==='_global_'
      } else {
        return true
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL2ludGVybmFsL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvSWNvbi5zdmVsdGUiLCIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlL3N0b3JlL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvbW90aW9uL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWJzLnN2ZWx0ZSIsIi4uL25vZGVfbW9kdWxlcy9zdmVsbWEvc3JjL2NvbXBvbmVudHMvVGFicy9UYWIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L0JTdGF0aWMuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvYm94L1NwbGl0dGVyLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9CUmVzaXplLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9CSGVhZGVyLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2JveC9WQm94Mi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9tb25hY28vRXhidXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL21vbmFjby9pbml0LmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvRWRpdG9yLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvcmVyZW5kZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL3VybC1kZWJvdW5jZS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3Mvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvcm91dGUvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9yb3V0ZS9MaXN0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3JvdXRlL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9FZGl0b3Iuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvcHJvZmlsZS9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3Byb2ZpbGUvTGlzdC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9wcm9maWxlL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3Mvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvb3RoZXIvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvYnV0dG9uL3N0YXRlcy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2J1dHRvbi9Db2xsYXBzZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9idXR0b24vRXhwYW5kLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvSXRlbS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL1N1bW1hcnkuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9MaXN0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvdGFiLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9CdXR0b24yLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvQmFzZVRhYi5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0pzb24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvbG9ncy9IdG1sLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvVGV4dC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0Nzcy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0pzLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2xvZ3MvU2hvdy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9sb2dzL0luZGV4LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvQnV0dG9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2J1dHRvbi9DaGV2cm9uLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvUHJlc2V0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczFfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczJfVGl0bGUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzMl8xLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczJfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfMy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL1RhZ3MzXzIuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9UYWdzM18xLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGFnczNfLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVXJsLXN0eWxlLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGl0bGUtYnRuLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVGl0bGUtdXJsLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvVXJscy5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL0VmZmVjdGVkLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvQ29udGVudC5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy90YWdzL0l0ZW0uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvdGFncy9MaXN0LnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL3RhZ3MvSW5kZXguc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvb3RoZXIvT3BlbkhvbWUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvb3RoZXIvQ29kZUhvbWUuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvb3RoZXIvUG9zdG1lc3NhZ2Uuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvb3RoZXIvQ3NwLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvc3RvcmVzLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9CdXR0b24uc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9UaXRsZS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwL1ZpZXcuc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9JdGVtLnN2ZWx0ZSIsIi4uL3NyYy9jb21wb25lbnRzL2hlbHAvU3VtbWFyeS5zdmVsdGUiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwL0xpc3Quc3ZlbHRlIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVscC9JbmRleC5zdmVsdGUiLCIuLi9zcmMvQXBwLnN2ZWx0ZSIsIi4uL3NyYy9tYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIG5vb3AoKSB7IH1cbmNvbnN0IGlkZW50aXR5ID0geCA9PiB4O1xuZnVuY3Rpb24gYXNzaWduKHRhciwgc3JjKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvciAoY29uc3QgayBpbiBzcmMpXG4gICAgICAgIHRhcltrXSA9IHNyY1trXTtcbiAgICByZXR1cm4gdGFyO1xufVxuZnVuY3Rpb24gaXNfcHJvbWlzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gYWRkX2xvY2F0aW9uKGVsZW1lbnQsIGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhcikge1xuICAgIGVsZW1lbnQuX19zdmVsdGVfbWV0YSA9IHtcbiAgICAgICAgbG9jOiB7IGZpbGUsIGxpbmUsIGNvbHVtbiwgY2hhciB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJ1bihmbikge1xuICAgIHJldHVybiBmbigpO1xufVxuZnVuY3Rpb24gYmxhbmtfb2JqZWN0KCkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuZnVuY3Rpb24gcnVuX2FsbChmbnMpIHtcbiAgICBmbnMuZm9yRWFjaChydW4pO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24odGhpbmcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaW5nID09PSAnZnVuY3Rpb24nO1xufVxuZnVuY3Rpb24gc2FmZV9ub3RfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cbmZ1bmN0aW9uIG5vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5mdW5jdGlvbiBpc19lbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zdG9yZShzdG9yZSwgbmFtZSkge1xuICAgIGlmIChzdG9yZSAhPSBudWxsICYmIHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgLi4uY2FsbGJhY2tzKSB7XG4gICAgaWYgKHN0b3JlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKC4uLmNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICgkJHNjb3BlLmRpcnR5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBsZXRzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGV0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90KHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbiwgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGNvbnN0IHNsb3RfY2hhbmdlcyA9IGdldF9zbG90X2NoYW5nZXMoc2xvdF9kZWZpbml0aW9uLCAkJHNjb3BlLCBkaXJ0eSwgZ2V0X3Nsb3RfY2hhbmdlc19mbik7XG4gICAgaWYgKHNsb3RfY2hhbmdlcykge1xuICAgICAgICBjb25zdCBzbG90X2NvbnRleHQgPSBnZXRfc2xvdF9jb250ZXh0KHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBnZXRfc2xvdF9jb250ZXh0X2ZuKTtcbiAgICAgICAgc2xvdC5wKHNsb3RfY29udGV4dCwgc2xvdF9jaGFuZ2VzKTtcbiAgICB9XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfcmVzdF9wcm9wcyhwcm9wcywga2V5cykge1xuICAgIGNvbnN0IHJlc3QgPSB7fTtcbiAgICBrZXlzID0gbmV3IFNldChrZXlzKTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmICgha2V5cy5oYXMoaykgJiYga1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9zbG90cyhzbG90cykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHNsb3RzKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUgPSByZXQpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhcHBlbmQodGFyZ2V0LCBub2RlKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBkZXRhY2gobm9kZSkge1xuICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cbmZ1bmN0aW9uIGRlc3Ryb3lfZWFjaChpdGVyYXRpb25zLCBkZXRhY2hpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGl0ZXJhdGlvbnNbaV0pXG4gICAgICAgICAgICBpdGVyYXRpb25zW2ldLmQoZGV0YWNoaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBlbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cbmZ1bmN0aW9uIGVsZW1lbnRfaXMobmFtZSwgaXMpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lLCB7IGlzIH0pO1xufVxuZnVuY3Rpb24gb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcyhvYmosIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChoYXNfcHJvcChvYmosIGspXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAmJiBleGNsdWRlLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0YXJnZXRba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHN2Z19lbGVtZW50KG5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuZnVuY3Rpb24gdGV4dChkYXRhKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuZnVuY3Rpb24gc3BhY2UoKSB7XG4gICAgcmV0dXJuIHRleHQoJyAnKTtcbn1cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICAgIHJldHVybiB0ZXh0KCcnKTtcbn1cbmZ1bmN0aW9uIGxpc3Rlbihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgcmV0dXJuICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBwcmV2ZW50X2RlZmF1bHQoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzdG9wX3Byb3BhZ2F0aW9uKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNlbGYoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcylcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICBlbHNlIGlmIChub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpICE9PSB2YWx1ZSlcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBzZXRfYXR0cmlidXRlcyhub2RlLCBhdHRyaWJ1dGVzKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMobm9kZS5fX3Byb3RvX18pO1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5jc3NUZXh0ID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ19fdmFsdWUnKSB7XG4gICAgICAgICAgICBub2RlLnZhbHVlID0gbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2NyaXB0b3JzW2tleV0gJiYgZGVzY3JpcHRvcnNba2V5XS5zZXQpIHtcbiAgICAgICAgICAgIG5vZGVba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X3N2Z19hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGF0dHIobm9kZSwga2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9jdXN0b21fZWxlbWVudF9kYXRhKG5vZGUsIHByb3AsIHZhbHVlKSB7XG4gICAgaWYgKHByb3AgaW4gbm9kZSkge1xuICAgICAgICBub2RlW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhdHRyKG5vZGUsIHByb3AsIHZhbHVlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB4bGlua19hdHRyKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRfYmluZGluZ19ncm91cF92YWx1ZShncm91cCwgX192YWx1ZSwgY2hlY2tlZCkge1xuICAgIGNvbnN0IHZhbHVlID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpXG4gICAgICAgICAgICB2YWx1ZS5hZGQoZ3JvdXBbaV0uX192YWx1ZSk7XG4gICAgfVxuICAgIGlmICghY2hlY2tlZCkge1xuICAgICAgICB2YWx1ZS5kZWxldGUoX192YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHRvX251bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBudWxsIDogK3ZhbHVlO1xufVxuZnVuY3Rpb24gdGltZV9yYW5nZXNfdG9fYXJyYXkocmFuZ2VzKSB7XG4gICAgY29uc3QgYXJyYXkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjaGlsZHJlbihlbGVtZW50KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnQobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Zykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgbGV0IGogPSAwO1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gW107XG4gICAgICAgICAgICB3aGlsZSAoaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbaisrXTtcbiAgICAgICAgICAgICAgICBpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZS5wdXNoKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHJlbW92ZS5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKHJlbW92ZVtrXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdmcgPyBzdmdfZWxlbWVudChuYW1lKSA6IGVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBjbGFpbV90ZXh0KG5vZGVzLCBkYXRhKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSAnJyArIGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0KGRhdGEpO1xufVxuZnVuY3Rpb24gY2xhaW1fc3BhY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gY2xhaW1fdGV4dChub2RlcywgJyAnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdHlsZShub2RlLCBrZXksIHZhbHVlLCBpbXBvcnRhbnQpIHtcbiAgICBub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUsIGltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xufVxuZnVuY3Rpb24gc2VsZWN0X29wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcbiAgICAgICAgaWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuLy8gdW5mb3J0dW5hdGVseSB0aGlzIGNhbid0IGJlIGEgY29uc3RhbnQgYXMgdGhhdCB3b3VsZG4ndCBiZSB0cmVlLXNoYWtlYWJsZVxuLy8gc28gd2UgY2FjaGUgdGhlIHJlc3VsdCBpbnN0ZWFkXG5sZXQgY3Jvc3NvcmlnaW47XG5mdW5jdGlvbiBpc19jcm9zc29yaWdpbigpIHtcbiAgICBpZiAoY3Jvc3NvcmlnaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjcm9zc29yaWdpbiA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2b2lkIHdpbmRvdy5wYXJlbnQuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjcm9zc29yaWdpbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNyb3Nzb3JpZ2luO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihub2RlLCBmbikge1xuICAgIGNvbnN0IGNvbXB1dGVkX3N0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBjb25zdCB6X2luZGV4ID0gKHBhcnNlSW50KGNvbXB1dGVkX3N0eWxlLnpJbmRleCkgfHwgMCkgLSAxO1xuICAgIGlmIChjb21wdXRlZF9zdHlsZS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgfVxuICAgIGNvbnN0IGlmcmFtZSA9IGVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IGJsb2NrOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgJyArXG4gICAgICAgIGBvdmVyZmxvdzogaGlkZGVuOyBib3JkZXI6IDA7IG9wYWNpdHk6IDA7IHBvaW50ZXItZXZlbnRzOiBub25lOyB6LWluZGV4OiAke3pfaW5kZXh9O2ApO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBpZnJhbWUudGFiSW5kZXggPSAtMTtcbiAgICBjb25zdCBjcm9zc29yaWdpbiA9IGlzX2Nyb3Nzb3JpZ2luKCk7XG4gICAgbGV0IHVuc3Vic2NyaWJlO1xuICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICBpZnJhbWUuc3JjID0gXCJkYXRhOnRleHQvaHRtbCw8c2NyaXB0Pm9ucmVzaXplPWZ1bmN0aW9uKCl7cGFyZW50LnBvc3RNZXNzYWdlKDAsJyonKX08L3NjcmlwdD5cIjtcbiAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4od2luZG93LCAnbWVzc2FnZScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnNvdXJjZSA9PT0gaWZyYW1lLmNvbnRlbnRXaW5kb3cpXG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJztcbiAgICAgICAgaWZyYW1lLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlID0gbGlzdGVuKGlmcmFtZS5jb250ZW50V2luZG93LCAncmVzaXplJywgZm4pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBhcHBlbmQobm9kZSwgaWZyYW1lKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoY3Jvc3NvcmlnaW4pIHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodW5zdWJzY3JpYmUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGV0YWNoKGlmcmFtZSk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRvZ2dsZV9jbGFzcyhlbGVtZW50LCBuYW1lLCB0b2dnbGUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdFt0b2dnbGUgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbn1cbmZ1bmN0aW9uIGN1c3RvbV9ldmVudCh0eXBlLCBkZXRhaWwpIHtcbiAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgZmFsc2UsIGZhbHNlLCBkZXRhaWwpO1xuICAgIHJldHVybiBlO1xufVxuZnVuY3Rpb24gcXVlcnlfc2VsZWN0b3JfYWxsKHNlbGVjdG9yLCBwYXJlbnQgPSBkb2N1bWVudC5ib2R5KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20ocGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKGFuY2hvciA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5hID0gYW5jaG9yO1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgIH1cbiAgICBtKGh0bWwsIHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBpZiAoIXRoaXMuZSkge1xuICAgICAgICAgICAgdGhpcy5lID0gZWxlbWVudCh0YXJnZXQubm9kZU5hbWUpO1xuICAgICAgICAgICAgdGhpcy50ID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaShhbmNob3IpO1xuICAgIH1cbiAgICBoKGh0bWwpIHtcbiAgICAgICAgdGhpcy5lLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMubiA9IEFycmF5LmZyb20odGhpcy5lLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgICAgICB0aGlzLmkodGhpcy5hKTtcbiAgICB9XG4gICAgZCgpIHtcbiAgICAgICAgdGhpcy5uLmZvckVhY2goZGV0YWNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhdHRyaWJ1dGVfdG9fb2JqZWN0KGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJlc3VsdFthdHRyaWJ1dGUubmFtZV0gPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzKGVsZW1lbnQpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICByZXN1bHRbbm9kZS5zbG90IHx8ICdkZWZhdWx0J10gPSB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmNvbnN0IGFjdGl2ZV9kb2NzID0gbmV3IFNldCgpO1xubGV0IGFjdGl2ZSA9IDA7XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3J1bGUobm9kZSwgYSwgYiwgZHVyYXRpb24sIGRlbGF5LCBlYXNlLCBmbiwgdWlkID0gMCkge1xuICAgIGNvbnN0IHN0ZXAgPSAxNi42NjYgLyBkdXJhdGlvbjtcbiAgICBsZXQga2V5ZnJhbWVzID0gJ3tcXG4nO1xuICAgIGZvciAobGV0IHAgPSAwOyBwIDw9IDE7IHAgKz0gc3RlcCkge1xuICAgICAgICBjb25zdCB0ID0gYSArIChiIC0gYSkgKiBlYXNlKHApO1xuICAgICAgICBrZXlmcmFtZXMgKz0gcCAqIDEwMCArIGAleyR7Zm4odCwgMSAtIHQpfX1cXG5gO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0ga2V5ZnJhbWVzICsgYDEwMCUgeyR7Zm4oYiwgMSAtIGIpfX1cXG59YDtcbiAgICBjb25zdCBuYW1lID0gYF9fc3ZlbHRlXyR7aGFzaChydWxlKX1fJHt1aWR9YDtcbiAgICBjb25zdCBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQ7XG4gICAgYWN0aXZlX2RvY3MuYWRkKGRvYyk7XG4gICAgY29uc3Qgc3R5bGVzaGVldCA9IGRvYy5fX3N2ZWx0ZV9zdHlsZXNoZWV0IHx8IChkb2MuX19zdmVsdGVfc3R5bGVzaGVldCA9IGRvYy5oZWFkLmFwcGVuZENoaWxkKGVsZW1lbnQoJ3N0eWxlJykpLnNoZWV0KTtcbiAgICBjb25zdCBjdXJyZW50X3J1bGVzID0gZG9jLl9fc3ZlbHRlX3J1bGVzIHx8IChkb2MuX19zdmVsdGVfcnVsZXMgPSB7fSk7XG4gICAgaWYgKCFjdXJyZW50X3J1bGVzW25hbWVdKSB7XG4gICAgICAgIGN1cnJlbnRfcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiAnJ30ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJykuc3BsaXQoJywgJyk7XG4gICAgY29uc3QgbmV4dCA9IHByZXZpb3VzLmZpbHRlcihuYW1lXG4gICAgICAgID8gYW5pbSA9PiBhbmltLmluZGV4T2YobmFtZSkgPCAwIC8vIHJlbW92ZSBzcGVjaWZpYyBhbmltYXRpb25cbiAgICAgICAgOiBhbmltID0+IGFuaW0uaW5kZXhPZignX19zdmVsdGUnKSA9PT0gLTEgLy8gcmVtb3ZlIGFsbCBTdmVsdGUgYW5pbWF0aW9uc1xuICAgICk7XG4gICAgY29uc3QgZGVsZXRlZCA9IHByZXZpb3VzLmxlbmd0aCAtIG5leHQubGVuZ3RoO1xuICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gbmV4dC5qb2luKCcsICcpO1xuICAgICAgICBhY3RpdmUgLT0gZGVsZXRlZDtcbiAgICAgICAgaWYgKCFhY3RpdmUpXG4gICAgICAgICAgICBjbGVhcl9ydWxlcygpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGFjdGl2ZV9kb2NzLmZvckVhY2goZG9jID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBkb2MuX19zdmVsdGVfc3R5bGVzaGVldDtcbiAgICAgICAgICAgIGxldCBpID0gc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgICAgIHN0eWxlc2hlZXQuZGVsZXRlUnVsZShpKTtcbiAgICAgICAgICAgIGRvYy5fX3N2ZWx0ZV9ydWxlcyA9IHt9O1xuICAgICAgICB9KTtcbiAgICAgICAgYWN0aXZlX2RvY3MuY2xlYXIoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbicpO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG5mdW5jdGlvbiBvbk1vdW50KGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQub25fbW91bnQucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZnRlclVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmFmdGVyX3VwZGF0ZS5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIG9uRGVzdHJveShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX2Rlc3Ryb3kucHVzaChmbik7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERpc3BhdGNoZXIoKSB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgcmV0dXJuICh0eXBlLCBkZXRhaWwpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgLy8gVE9ETyBhcmUgdGhlcmUgc2l0dWF0aW9ucyB3aGVyZSBldmVudHMgY291bGQgYmUgZGlzcGF0Y2hlZFxuICAgICAgICAgICAgLy8gaW4gYSBzZXJ2ZXIgKG5vbi1ET00pIGVudmlyb25tZW50P1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBjdXN0b21fZXZlbnQodHlwZSwgZGV0YWlsKTtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4ge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29tcG9uZW50LCBldmVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBzZXRDb250ZXh0KGtleSwgY29udGV4dCkge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmNvbnRleHQuc2V0KGtleSwgY29udGV4dCk7XG59XG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIGNhbGxiYWNrcy5zbGljZSgpLmZvckVhY2goZm4gPT4gZm4oZXZlbnQpKTtcbiAgICB9XG59XG5cbmNvbnN0IGRpcnR5X2NvbXBvbmVudHMgPSBbXTtcbmNvbnN0IGludHJvcyA9IHsgZW5hYmxlZDogZmFsc2UgfTtcbmNvbnN0IGJpbmRpbmdfY2FsbGJhY2tzID0gW107XG5jb25zdCByZW5kZXJfY2FsbGJhY2tzID0gW107XG5jb25zdCBmbHVzaF9jYWxsYmFja3MgPSBbXTtcbmNvbnN0IHJlc29sdmVkX3Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmxldCB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG5mdW5jdGlvbiBzY2hlZHVsZV91cGRhdGUoKSB7XG4gICAgaWYgKCF1cGRhdGVfc2NoZWR1bGVkKSB7XG4gICAgICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgICByZXNvbHZlZF9wcm9taXNlLnRoZW4oZmx1c2gpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgcmV0dXJuIHJlc29sdmVkX3Byb21pc2U7XG59XG5mdW5jdGlvbiBhZGRfcmVuZGVyX2NhbGxiYWNrKGZuKSB7XG4gICAgcmVuZGVyX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmZ1bmN0aW9uIGFkZF9mbHVzaF9jYWxsYmFjayhmbikge1xuICAgIGZsdXNoX2NhbGxiYWNrcy5wdXNoKGZuKTtcbn1cbmxldCBmbHVzaGluZyA9IGZhbHNlO1xuY29uc3Qgc2Vlbl9jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgICBpZiAoZmx1c2hpbmcpXG4gICAgICAgIHJldHVybjtcbiAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcnR5X2NvbXBvbmVudHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRpcnR5X2NvbXBvbmVudHNbaV07XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICB9XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgICAgICB3aGlsZSAoYmluZGluZ19jYWxsYmFja3MubGVuZ3RoKVxuICAgICAgICAgICAgYmluZGluZ19jYWxsYmFja3MucG9wKCkoKTtcbiAgICAgICAgLy8gdGhlbiwgb25jZSBjb21wb25lbnRzIGFyZSB1cGRhdGVkLCBjYWxsXG4gICAgICAgIC8vIGFmdGVyVXBkYXRlIGZ1bmN0aW9ucy4gVGhpcyBtYXkgY2F1c2VcbiAgICAgICAgLy8gc3Vic2VxdWVudCB1cGRhdGVzLi4uXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVuZGVyX2NhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSByZW5kZXJfY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKCFzZWVuX2NhbGxiYWNrcy5oYXMoY2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgLy8gLi4uc28gZ3VhcmQgYWdhaW5zdCBpbmZpbml0ZSBsb29wc1xuICAgICAgICAgICAgICAgIHNlZW5fY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgfSB3aGlsZSAoZGlydHlfY29tcG9uZW50cy5sZW5ndGgpO1xuICAgIHdoaWxlIChmbHVzaF9jYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIGZsdXNoX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgIH1cbiAgICB1cGRhdGVfc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBjb25maWcoKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBsZXQgY29uZmlnID0gZm4obm9kZSwgcGFyYW1zKTtcbiAgICBsZXQgcnVubmluZyA9IHRydWU7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGNvbnN0IGdyb3VwID0gb3V0cm9zO1xuICAgIGdyb3VwLnIgKz0gMTtcbiAgICBmdW5jdGlvbiBnbygpIHtcbiAgICAgICAgY29uc3QgeyBkZWxheSA9IDAsIGR1cmF0aW9uID0gMzAwLCBlYXNpbmcgPSBpZGVudGl0eSwgdGljayA9IG5vb3AsIGNzcyB9ID0gY29uZmlnIHx8IG51bGxfdHJhbnNpdGlvbjtcbiAgICAgICAgaWYgKGNzcylcbiAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgMSwgMCwgZHVyYXRpb24sIGRlbGF5LCBlYXNpbmcsIGNzcyk7XG4gICAgICAgIGNvbnN0IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5O1xuICAgICAgICBjb25zdCBlbmRfdGltZSA9IHN0YXJ0X3RpbWUgKyBkdXJhdGlvbjtcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBmYWxzZSwgJ3N0YXJ0JykpO1xuICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChub3cgPj0gZW5kX3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEtLWdyb3VwLnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2lsbCByZXN1bHQgaW4gYGVuZCgpYCBiZWluZyBjYWxsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNsZWFuIHVwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwoZ3JvdXAuYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSAtIHQsIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGlzX2Z1bmN0aW9uKGNvbmZpZykpIHtcbiAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnKCk7XG4gICAgICAgICAgICBnbygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGVuZChyZXNldCkge1xuICAgICAgICAgICAgaWYgKHJlc2V0ICYmIGNvbmZpZy50aWNrKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnRpY2soMSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgICAgICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBjcmVhdGVfYmlkaXJlY3Rpb25hbF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMsIGludHJvKSB7XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcyk7XG4gICAgbGV0IHQgPSBpbnRybyA/IDAgOiAxO1xuICAgIGxldCBydW5uaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgIGxldCBhbmltYXRpb25fbmFtZSA9IG51bGw7XG4gICAgZnVuY3Rpb24gY2xlYXJfYW5pbWF0aW9uKCkge1xuICAgICAgICBpZiAoYW5pbWF0aW9uX25hbWUpXG4gICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGluaXQocHJvZ3JhbSwgZHVyYXRpb24pIHtcbiAgICAgICAgY29uc3QgZCA9IHByb2dyYW0uYiAtIHQ7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8g4oCUIHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8g4oCUIG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZygpO1xuICAgICAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGdvKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IHBlbmRpbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBoYW5kbGVfcHJvbWlzZShwcm9taXNlLCBpbmZvKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmZvLnRva2VuID0ge307XG4gICAgZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGluZGV4LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpbmZvLnRva2VuICE9PSB0b2tlbilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaW5mby5yZXNvbHZlZCA9IHZhbHVlO1xuICAgICAgICBsZXQgY2hpbGRfY3R4ID0gaW5mby5jdHg7XG4gICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hpbGRfY3R4ID0gY2hpbGRfY3R4LnNsaWNlKCk7XG4gICAgICAgICAgICBjaGlsZF9jdHhba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdHlwZSAmJiAoaW5mby5jdXJyZW50ID0gdHlwZSkoY2hpbGRfY3R4KTtcbiAgICAgICAgbGV0IG5lZWRzX2ZsdXNoID0gZmFsc2U7XG4gICAgICAgIGlmIChpbmZvLmJsb2NrKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrcy5mb3JFYWNoKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXggJiYgYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrX291dHJvcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvLmJsb2NrLmQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgICAgIGJsb2NrLm0oaW5mby5tb3VudCgpLCBpbmZvLmFuY2hvcik7XG4gICAgICAgICAgICBuZWVkc19mbHVzaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5ibG9jayA9IGJsb2NrO1xuICAgICAgICBpZiAoaW5mby5ibG9ja3MpXG4gICAgICAgICAgICBpbmZvLmJsb2Nrc1tpbmRleF0gPSBibG9jaztcbiAgICAgICAgaWYgKG5lZWRzX2ZsdXNoKSB7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc19wcm9taXNlKHByb21pc2UpKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRfY29tcG9uZW50ID0gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCk7XG4gICAgICAgIHByb21pc2UudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KG51bGwpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoY3VycmVudF9jb21wb25lbnQpO1xuICAgICAgICAgICAgdXBkYXRlKGluZm8uY2F0Y2gsIDIsIGluZm8uZXJyb3IsIGVycm9yKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgIGlmICghaW5mby5oYXNDYXRjaCkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgd2UgcHJldmlvdXNseSBoYWQgYSB0aGVuL2NhdGNoIGJsb2NrLCBkZXN0cm95IGl0XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8ucGVuZGluZykge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8ucGVuZGluZywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGluZm8uY3VycmVudCAhPT0gaW5mby50aGVuKSB7XG4gICAgICAgICAgICB1cGRhdGUoaW5mby50aGVuLCAxLCBpbmZvLnZhbHVlLCBwcm9taXNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSBwcm9taXNlO1xuICAgIH1cbn1cblxuY29uc3QgZ2xvYmFscyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgID8gd2luZG93XG4gICAgOiB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgPyBnbG9iYWxUaGlzXG4gICAgICAgIDogZ2xvYmFsKTtcblxuZnVuY3Rpb24gZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZCgxKTtcbiAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG59XG5mdW5jdGlvbiBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgdHJhbnNpdGlvbl9vdXQoYmxvY2ssIDEsIDEsICgpID0+IHtcbiAgICAgICAgbG9va3VwLmRlbGV0ZShibG9jay5rZXkpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gZml4X2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5mKCk7XG4gICAgZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIGZpeF9hbmRfb3V0cm9fYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBvdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9rZXllZF9lYWNoKG9sZF9ibG9ja3MsIGRpcnR5LCBnZXRfa2V5LCBkeW5hbWljLCBjdHgsIGxpc3QsIGxvb2t1cCwgbm9kZSwgZGVzdHJveSwgY3JlYXRlX2VhY2hfYmxvY2ssIG5leHQsIGdldF9jb250ZXh0KSB7XG4gICAgbGV0IG8gPSBvbGRfYmxvY2tzLmxlbmd0aDtcbiAgICBsZXQgbiA9IGxpc3QubGVuZ3RoO1xuICAgIGxldCBpID0gbztcbiAgICBjb25zdCBvbGRfaW5kZXhlcyA9IHt9O1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIG9sZF9pbmRleGVzW29sZF9ibG9ja3NbaV0ua2V5XSA9IGk7XG4gICAgY29uc3QgbmV3X2Jsb2NrcyA9IFtdO1xuICAgIGNvbnN0IG5ld19sb29rdXAgPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgZGVsdGFzID0gbmV3IE1hcCgpO1xuICAgIGkgPSBuO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgY2hpbGRfY3R4ID0gZ2V0X2NvbnRleHQoY3R4LCBsaXN0LCBpKTtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShjaGlsZF9jdHgpO1xuICAgICAgICBsZXQgYmxvY2sgPSBsb29rdXAuZ2V0KGtleSk7XG4gICAgICAgIGlmICghYmxvY2spIHtcbiAgICAgICAgICAgIGJsb2NrID0gY3JlYXRlX2VhY2hfYmxvY2soa2V5LCBjaGlsZF9jdHgpO1xuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGR5bmFtaWMpIHtcbiAgICAgICAgICAgIGJsb2NrLnAoY2hpbGRfY3R4LCBkaXJ0eSk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3X2xvb2t1cC5zZXQoa2V5LCBuZXdfYmxvY2tzW2ldID0gYmxvY2spO1xuICAgICAgICBpZiAoa2V5IGluIG9sZF9pbmRleGVzKVxuICAgICAgICAgICAgZGVsdGFzLnNldChrZXksIE1hdGguYWJzKGkgLSBvbGRfaW5kZXhlc1trZXldKSk7XG4gICAgfVxuICAgIGNvbnN0IHdpbGxfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBkaWRfbW92ZSA9IG5ldyBTZXQoKTtcbiAgICBmdW5jdGlvbiBpbnNlcnQoYmxvY2spIHtcbiAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgIGJsb2NrLm0obm9kZSwgbmV4dCk7XG4gICAgICAgIGxvb2t1cC5zZXQoYmxvY2sua2V5LCBibG9jayk7XG4gICAgICAgIG5leHQgPSBibG9jay5maXJzdDtcbiAgICAgICAgbi0tO1xuICAgIH1cbiAgICB3aGlsZSAobyAmJiBuKSB7XG4gICAgICAgIGNvbnN0IG5ld19ibG9jayA9IG5ld19ibG9ja3NbbiAtIDFdO1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW28gLSAxXTtcbiAgICAgICAgY29uc3QgbmV3X2tleSA9IG5ld19ibG9jay5rZXk7XG4gICAgICAgIGNvbnN0IG9sZF9rZXkgPSBvbGRfYmxvY2sua2V5O1xuICAgICAgICBpZiAobmV3X2Jsb2NrID09PSBvbGRfYmxvY2spIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgICAgIG5leHQgPSBuZXdfYmxvY2suZmlyc3Q7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgICAgICBuLS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9rZXkpKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgb2xkIGJsb2NrXG4gICAgICAgICAgICBkZXN0cm95KG9sZF9ibG9jaywgbG9va3VwKTtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbG9va3VwLmhhcyhuZXdfa2V5KSB8fCB3aWxsX21vdmUuaGFzKG5ld19rZXkpKSB7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkaWRfbW92ZS5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZWx0YXMuZ2V0KG5ld19rZXkpID4gZGVsdGFzLmdldChvbGRfa2V5KSkge1xuICAgICAgICAgICAgZGlkX21vdmUuYWRkKG5ld19rZXkpO1xuICAgICAgICAgICAgaW5zZXJ0KG5ld19ibG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3aWxsX21vdmUuYWRkKG9sZF9rZXkpO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChvLS0pIHtcbiAgICAgICAgY29uc3Qgb2xkX2Jsb2NrID0gb2xkX2Jsb2Nrc1tvXTtcbiAgICAgICAgaWYgKCFuZXdfbG9va3VwLmhhcyhvbGRfYmxvY2sua2V5KSlcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgIH1cbiAgICB3aGlsZSAobilcbiAgICAgICAgaW5zZXJ0KG5ld19ibG9ja3NbbiAtIDFdKTtcbiAgICByZXR1cm4gbmV3X2Jsb2Nrcztcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX2VhY2hfa2V5cyhjdHgsIGxpc3QsIGdldF9jb250ZXh0LCBnZXRfa2V5KSB7XG4gICAgY29uc3Qga2V5cyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0X2tleShnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpKTtcbiAgICAgICAgaWYgKGtleXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGhhdmUgZHVwbGljYXRlIGtleXMgaW4gYSBrZXllZCBlYWNoJyk7XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5hZGQoa2V5KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldF9zcHJlYWRfdXBkYXRlKGxldmVscywgdXBkYXRlcykge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHt9O1xuICAgIGNvbnN0IHRvX251bGxfb3V0ID0ge307XG4gICAgY29uc3QgYWNjb3VudGVkX2ZvciA9IHsgJCRzY29wZTogMSB9O1xuICAgIGxldCBpID0gbGV2ZWxzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGNvbnN0IG8gPSBsZXZlbHNbaV07XG4gICAgICAgIGNvbnN0IG4gPSB1cGRhdGVzW2ldO1xuICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiBuKSlcbiAgICAgICAgICAgICAgICAgICAgdG9fbnVsbF9vdXRba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBuKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhY2NvdW50ZWRfZm9yW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlW2tleV0gPSBuW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV2ZWxzW2ldID0gbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICAgICAgICAgICAgICBhY2NvdW50ZWRfZm9yW2tleV0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIHRvX251bGxfb3V0KSB7XG4gICAgICAgIGlmICghKGtleSBpbiB1cGRhdGUpKVxuICAgICAgICAgICAgdXBkYXRlW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB1cGRhdGU7XG59XG5mdW5jdGlvbiBnZXRfc3ByZWFkX29iamVjdChzcHJlYWRfcHJvcHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHNwcmVhZF9wcm9wcyA9PT0gJ29iamVjdCcgJiYgc3ByZWFkX3Byb3BzICE9PSBudWxsID8gc3ByZWFkX3Byb3BzIDoge307XG59XG5cbi8vIHNvdXJjZTogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5kaWNlcy5odG1sXG5jb25zdCBib29sZWFuX2F0dHJpYnV0ZXMgPSBuZXcgU2V0KFtcbiAgICAnYWxsb3dmdWxsc2NyZWVuJyxcbiAgICAnYWxsb3dwYXltZW50cmVxdWVzdCcsXG4gICAgJ2FzeW5jJyxcbiAgICAnYXV0b2ZvY3VzJyxcbiAgICAnYXV0b3BsYXknLFxuICAgICdjaGVja2VkJyxcbiAgICAnY29udHJvbHMnLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVmZXInLFxuICAgICdkaXNhYmxlZCcsXG4gICAgJ2Zvcm1ub3ZhbGlkYXRlJyxcbiAgICAnaGlkZGVuJyxcbiAgICAnaXNtYXAnLFxuICAgICdsb29wJyxcbiAgICAnbXVsdGlwbGUnLFxuICAgICdtdXRlZCcsXG4gICAgJ25vbW9kdWxlJyxcbiAgICAnbm92YWxpZGF0ZScsXG4gICAgJ29wZW4nLFxuICAgICdwbGF5c2lubGluZScsXG4gICAgJ3JlYWRvbmx5JyxcbiAgICAncmVxdWlyZWQnLFxuICAgICdyZXZlcnNlZCcsXG4gICAgJ3NlbGVjdGVkJ1xuXSk7XG5cbmNvbnN0IGludmFsaWRfYXR0cmlidXRlX25hbWVfY2hhcmFjdGVyID0gL1tcXHMnXCI+Lz1cXHV7RkREMH0tXFx1e0ZERUZ9XFx1e0ZGRkV9XFx1e0ZGRkZ9XFx1ezFGRkZFfVxcdXsxRkZGRn1cXHV7MkZGRkV9XFx1ezJGRkZGfVxcdXszRkZGRX1cXHV7M0ZGRkZ9XFx1ezRGRkZFfVxcdXs0RkZGRn1cXHV7NUZGRkV9XFx1ezVGRkZGfVxcdXs2RkZGRX1cXHV7NkZGRkZ9XFx1ezdGRkZFfVxcdXs3RkZGRn1cXHV7OEZGRkV9XFx1ezhGRkZGfVxcdXs5RkZGRX1cXHV7OUZGRkZ9XFx1e0FGRkZFfVxcdXtBRkZGRn1cXHV7QkZGRkV9XFx1e0JGRkZGfVxcdXtDRkZGRX1cXHV7Q0ZGRkZ9XFx1e0RGRkZFfVxcdXtERkZGRn1cXHV7RUZGRkV9XFx1e0VGRkZGfVxcdXtGRkZGRX1cXHV7RkZGRkZ9XFx1ezEwRkZGRX1cXHV7MTBGRkZGfV0vdTtcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3N5bnRheC5odG1sI2F0dHJpYnV0ZXMtMlxuLy8gaHR0cHM6Ly9pbmZyYS5zcGVjLndoYXR3Zy5vcmcvI25vbmNoYXJhY3RlclxuZnVuY3Rpb24gc3ByZWFkKGFyZ3MsIGNsYXNzZXNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICBpZiAoYXR0cmlidXRlcy5jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzID0gY2xhc3Nlc190b19hZGQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzLmNsYXNzICs9ICcgJyArIGNsYXNzZXNfdG9fYWRkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IGAgJHtuYW1lfT1cIiR7U3RyaW5nKHZhbHVlKS5yZXBsYWNlKC9cIi9nLCAnJiMzNDsnKS5yZXBsYWNlKC8nL2csICcmIzM5OycpfVwiYDtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBlc2NhcGVkID0ge1xuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShodG1sKSB7XG4gICAgcmV0dXJuIFN0cmluZyhodG1sKS5yZXBsYWNlKC9bXCInJjw+XS9nLCBtYXRjaCA9PiBlc2NhcGVkW21hdGNoXSk7XG59XG5mdW5jdGlvbiBlYWNoKGl0ZW1zLCBmbikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHN0ciArPSBmbihpdGVtc1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5jb25zdCBtaXNzaW5nX2NvbXBvbmVudCA9IHtcbiAgICAkJHJlbmRlcjogKCkgPT4gJydcbn07XG5mdW5jdGlvbiB2YWxpZGF0ZV9jb21wb25lbnQoY29tcG9uZW50LCBuYW1lKSB7XG4gICAgaWYgKCFjb21wb25lbnQgfHwgIWNvbXBvbmVudC4kJHJlbmRlcikge1xuICAgICAgICBpZiAobmFtZSA9PT0gJ3N2ZWx0ZTpjb21wb25lbnQnKVxuICAgICAgICAgICAgbmFtZSArPSAnIHRoaXM9ey4uLn0nO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYDwke25hbWV9PiBpcyBub3QgYSB2YWxpZCBTU1IgY29tcG9uZW50LiBZb3UgbWF5IG5lZWQgdG8gcmV2aWV3IHlvdXIgYnVpbGQgY29uZmlnIHRvIGVuc3VyZSB0aGF0IGRlcGVuZGVuY2llcyBhcmUgY29tcGlsZWQsIHJhdGhlciB0aGFuIGltcG9ydGVkIGFzIHByZS1jb21waWxlZCBtb2R1bGVzYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG59XG5mdW5jdGlvbiBkZWJ1ZyhmaWxlLCBsaW5lLCBjb2x1bW4sIHZhbHVlcykge1xuICAgIGNvbnNvbGUubG9nKGB7QGRlYnVnfSAke2ZpbGUgPyBmaWxlICsgJyAnIDogJyd9KCR7bGluZX06JHtjb2x1bW59KWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyh2YWx1ZXMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXR1cm4gJyc7XG59XG5sZXQgb25fZGVzdHJveTtcbmZ1bmN0aW9uIGNyZWF0ZV9zc3JfY29tcG9uZW50KGZuKSB7XG4gICAgZnVuY3Rpb24gJCRyZW5kZXIocmVzdWx0LCBwcm9wcywgYmluZGluZ3MsIHNsb3RzKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudF9jb21wb25lbnQgPSBjdXJyZW50X2NvbXBvbmVudDtcbiAgICAgICAgY29uc3QgJCQgPSB7XG4gICAgICAgICAgICBvbl9kZXN0cm95LFxuICAgICAgICAgICAgY29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuICAgICAgICAgICAgLy8gdGhlc2Ugd2lsbCBiZSBpbW1lZGlhdGVseSBkaXNjYXJkZWRcbiAgICAgICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgICAgIGJlZm9yZV91cGRhdGU6IFtdLFxuICAgICAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIGNhbGxiYWNrczogYmxhbmtfb2JqZWN0KClcbiAgICAgICAgfTtcbiAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHsgJCQgfSk7XG4gICAgICAgIGNvbnN0IGh0bWwgPSBmbihyZXN1bHQsIHByb3BzLCBiaW5kaW5ncywgc2xvdHMpO1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQocGFyZW50X2NvbXBvbmVudCk7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXI6IChwcm9wcyA9IHt9LCBvcHRpb25zID0ge30pID0+IHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgdGl0bGU6ICcnLCBoZWFkOiAnJywgY3NzOiBuZXcgU2V0KCkgfTtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSAkJHJlbmRlcihyZXN1bHQsIHByb3BzLCB7fSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBydW5fYWxsKG9uX2Rlc3Ryb3kpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBBcnJheS5mcm9tKHJlc3VsdC5jc3MpLm1hcChjc3MgPT4gY3NzLmNvZGUpLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IG51bGwgLy8gVE9ET1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZDogcmVzdWx0LnRpdGxlICsgcmVzdWx0LmhlYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgICQkcmVuZGVyXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGFkZF9hdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCAoYm9vbGVhbiAmJiAhdmFsdWUpKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGAgJHtuYW1lfSR7dmFsdWUgPT09IHRydWUgPyAnJyA6IGA9JHt0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkoZXNjYXBlKHZhbHVlKSkgOiBgXCIke3ZhbHVlfVwiYH1gfWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6ICcnO1xufVxuXG5mdW5jdGlvbiBiaW5kKGNvbXBvbmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbXBvbmVudC4kJC5wcm9wc1tuYW1lXTtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnQuJCQuYm91bmRbaW5kZXhdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudC4kJC5jdHhbaW5kZXhdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcmVhdGVfY29tcG9uZW50KGJsb2NrKSB7XG4gICAgYmxvY2sgJiYgYmxvY2suYygpO1xufVxuZnVuY3Rpb24gY2xhaW1fY29tcG9uZW50KGJsb2NrLCBwYXJlbnRfbm9kZXMpIHtcbiAgICBibG9jayAmJiBibG9jay5sKHBhcmVudF9ub2Rlcyk7XG59XG5mdW5jdGlvbiBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCB0YXJnZXQsIGFuY2hvcikge1xuICAgIGNvbnN0IHsgZnJhZ21lbnQsIG9uX21vdW50LCBvbl9kZXN0cm95LCBhZnRlcl91cGRhdGUgfSA9IGNvbXBvbmVudC4kJDtcbiAgICBmcmFnbWVudCAmJiBmcmFnbWVudC5tKHRhcmdldCwgYW5jaG9yKTtcbiAgICAvLyBvbk1vdW50IGhhcHBlbnMgYmVmb3JlIHRoZSBpbml0aWFsIGFmdGVyVXBkYXRlXG4gICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld19vbl9kZXN0cm95ID0gb25fbW91bnQubWFwKHJ1bikuZmlsdGVyKGlzX2Z1bmN0aW9uKTtcbiAgICAgICAgaWYgKG9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgIG9uX2Rlc3Ryb3kucHVzaCguLi5uZXdfb25fZGVzdHJveSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBFZGdlIGNhc2UgLSBjb21wb25lbnQgd2FzIGRlc3Ryb3llZCBpbW1lZGlhdGVseSxcbiAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgIHJ1bl9hbGwobmV3X29uX2Rlc3Ryb3kpO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgIH0pO1xuICAgIGFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gZGVzdHJveV9jb21wb25lbnQoY29tcG9uZW50LCBkZXRhY2hpbmcpIHtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJDtcbiAgICBpZiAoJCQuZnJhZ21lbnQgIT09IG51bGwpIHtcbiAgICAgICAgcnVuX2FsbCgkJC5vbl9kZXN0cm95KTtcbiAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuZChkZXRhY2hpbmcpO1xuICAgICAgICAvLyBUT0RPIG51bGwgb3V0IG90aGVyIHJlZnMsIGluY2x1ZGluZyBjb21wb25lbnQuJCQgKGJ1dCBuZWVkIHRvXG4gICAgICAgIC8vIHByZXNlcnZlIGZpbmFsIHN0YXRlPylcbiAgICAgICAgJCQub25fZGVzdHJveSA9ICQkLmZyYWdtZW50ID0gbnVsbDtcbiAgICAgICAgJCQuY3R4ID0gW107XG4gICAgfVxufVxuZnVuY3Rpb24gbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpIHtcbiAgICBpZiAoY29tcG9uZW50LiQkLmRpcnR5WzBdID09PSAtMSkge1xuICAgICAgICBkaXJ0eV9jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgc2NoZWR1bGVfdXBkYXRlKCk7XG4gICAgICAgIGNvbXBvbmVudC4kJC5kaXJ0eS5maWxsKDApO1xuICAgIH1cbiAgICBjb21wb25lbnQuJCQuZGlydHlbKGkgLyAzMSkgfCAwXSB8PSAoMSA8PCAoaSAlIDMxKSk7XG59XG5mdW5jdGlvbiBpbml0KGNvbXBvbmVudCwgb3B0aW9ucywgaW5zdGFuY2UsIGNyZWF0ZV9mcmFnbWVudCwgbm90X2VxdWFsLCBwcm9wcywgZGlydHkgPSBbLTFdKSB7XG4gICAgY29uc3QgcGFyZW50X2NvbXBvbmVudCA9IGN1cnJlbnRfY29tcG9uZW50O1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgIGNvbnN0IHByb3BfdmFsdWVzID0gb3B0aW9ucy5wcm9wcyB8fCB7fTtcbiAgICBjb25zdCAkJCA9IGNvbXBvbmVudC4kJCA9IHtcbiAgICAgICAgZnJhZ21lbnQ6IG51bGwsXG4gICAgICAgIGN0eDogbnVsbCxcbiAgICAgICAgLy8gc3RhdGVcbiAgICAgICAgcHJvcHMsXG4gICAgICAgIHVwZGF0ZTogbm9vcCxcbiAgICAgICAgbm90X2VxdWFsLFxuICAgICAgICBib3VuZDogYmxhbmtfb2JqZWN0KCksXG4gICAgICAgIC8vIGxpZmVjeWNsZVxuICAgICAgICBvbl9tb3VudDogW10sXG4gICAgICAgIG9uX2Rlc3Ryb3k6IFtdLFxuICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgY29udGV4dDogbmV3IE1hcChwYXJlbnRfY29tcG9uZW50ID8gcGFyZW50X2NvbXBvbmVudC4kJC5jb250ZXh0IDogW10pLFxuICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgZGlydHksXG4gICAgICAgIHNraXBfYm91bmQ6IGZhbHNlXG4gICAgfTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgcHJvcF92YWx1ZXMsIChpLCByZXQsIC4uLnJlc3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcmVzdC5sZW5ndGggPyByZXN0WzBdIDogcmV0O1xuICAgICAgICAgICAgaWYgKCQkLmN0eCAmJiBub3RfZXF1YWwoJCQuY3R4W2ldLCAkJC5jdHhbaV0gPSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoISQkLnNraXBfYm91bmQgJiYgJCQuYm91bmRbaV0pXG4gICAgICAgICAgICAgICAgICAgICQkLmJvdW5kW2ldKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkpXG4gICAgICAgICAgICAgICAgICAgIG1ha2VfZGlydHkoY29tcG9uZW50LCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pXG4gICAgICAgIDogW107XG4gICAgJCQudXBkYXRlKCk7XG4gICAgcmVhZHkgPSB0cnVlO1xuICAgIHJ1bl9hbGwoJCQuYmVmb3JlX3VwZGF0ZSk7XG4gICAgLy8gYGZhbHNlYCBhcyBhIHNwZWNpYWwgY2FzZSBvZiBubyBET00gY29tcG9uZW50XG4gICAgJCQuZnJhZ21lbnQgPSBjcmVhdGVfZnJhZ21lbnQgPyBjcmVhdGVfZnJhZ21lbnQoJCQuY3R4KSA6IGZhbHNlO1xuICAgIGlmIChvcHRpb25zLnRhcmdldCkge1xuICAgICAgICBpZiAob3B0aW9ucy5oeWRyYXRlKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlcyA9IGNoaWxkcmVuKG9wdGlvbnMudGFyZ2V0KTtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5sKG5vZGVzKTtcbiAgICAgICAgICAgIG5vZGVzLmZvckVhY2goZGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW50cm8pXG4gICAgICAgICAgICB0cmFuc2l0aW9uX2luKGNvbXBvbmVudC4kJC5mcmFnbWVudCk7XG4gICAgICAgIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIG9wdGlvbnMudGFyZ2V0LCBvcHRpb25zLmFuY2hvcik7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgfVxuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbn1cbmxldCBTdmVsdGVFbGVtZW50O1xuaWYgKHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFN2ZWx0ZUVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICBzdXBlcigpO1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy4kJC5zbG90dGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuJCQuc2xvdHRlZFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ciwgX29sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpc1thdHRyXSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgICAgICRkZXN0cm95KCkge1xuICAgICAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgICAgICB0aGlzLiRkZXN0cm95ID0gbm9vcDtcbiAgICAgICAgfVxuICAgICAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIFRPRE8gc2hvdWxkIHRoaXMgZGVsZWdhdGUgdG8gYWRkRXZlbnRMaXN0ZW5lcj9cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSB8fCAodGhpcy4kJC5jYWxsYmFja3NbdHlwZV0gPSBbXSkpO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kJHNldCAmJiAhaXNfZW1wdHkoJCRwcm9wcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuY2xhc3MgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgZGVzdHJveV9jb21wb25lbnQodGhpcywgMSk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSBub29wO1xuICAgIH1cbiAgICAkb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy4yOS43JyB9LCBkZXRhaWwpKSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfZGV2KHRhcmdldCwgbm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUgfSk7XG4gICAgYXBwZW5kKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnRfZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBkZXRhY2hfZGV2KG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZScsIHsgbm9kZSB9KTtcbiAgICBkZXRhY2gobm9kZSk7XG59XG5mdW5jdGlvbiBkZXRhY2hfYmV0d2Vlbl9kZXYoYmVmb3JlLCBhZnRlcikge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoX2JlZm9yZV9kZXYoYWZ0ZXIpIHtcbiAgICB3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYWZ0ZXJfZGV2KGJlZm9yZSkge1xuICAgIHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihiZWZvcmUubmV4dFNpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxpc3Rlbl9kZXYobm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMsIGhhc19wcmV2ZW50X2RlZmF1bHQsIGhhc19zdG9wX3Byb3BhZ2F0aW9uKSB7XG4gICAgY29uc3QgbW9kaWZpZXJzID0gb3B0aW9ucyA9PT0gdHJ1ZSA/IFsnY2FwdHVyZSddIDogb3B0aW9ucyA/IEFycmF5LmZyb20oT2JqZWN0LmtleXMob3B0aW9ucykpIDogW107XG4gICAgaWYgKGhhc19wcmV2ZW50X2RlZmF1bHQpXG4gICAgICAgIG1vZGlmaWVycy5wdXNoKCdwcmV2ZW50RGVmYXVsdCcpO1xuICAgIGlmIChoYXNfc3RvcF9wcm9wYWdhdGlvbilcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3N0b3BQcm9wYWdhdGlvbicpO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NQWRkRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICBjb25zdCBkaXNwb3NlID0gbGlzdGVuKG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVJlbW92ZUV2ZW50TGlzdGVuZXInLCB7IG5vZGUsIGV2ZW50LCBoYW5kbGVyLCBtb2RpZmllcnMgfSk7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gYXR0cl9kZXYobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlQXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUgfSk7XG4gICAgZWxzZVxuICAgICAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldEF0dHJpYnV0ZScsIHsgbm9kZSwgYXR0cmlidXRlLCB2YWx1ZSB9KTtcbn1cbmZ1bmN0aW9uIHByb3BfZGV2KG5vZGUsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIG5vZGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXRQcm9wZXJ0eScsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gZGF0YXNldF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZS5kYXRhc2V0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YXNldCcsIHsgbm9kZSwgcHJvcGVydHksIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gc2V0X2RhdGFfZGV2KHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCA9PT0gZGF0YSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0RGF0YScsIHsgbm9kZTogdGV4dCwgZGF0YSB9KTtcbiAgICB0ZXh0LmRhdGEgPSBkYXRhO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9hcmd1bWVudChhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycgJiYgIShhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgJ2xlbmd0aCcgaW4gYXJnKSkge1xuICAgICAgICBsZXQgbXNnID0gJ3sjZWFjaH0gb25seSBpdGVyYXRlcyBvdmVyIGFycmF5LWxpa2Ugb2JqZWN0cy4nO1xuICAgICAgICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBhcmcgJiYgU3ltYm9sLml0ZXJhdG9yIGluIGFyZykge1xuICAgICAgICAgICAgbXNnICs9ICcgWW91IGNhbiB1c2UgYSBzcHJlYWQgdG8gY29udmVydCB0aGlzIGl0ZXJhYmxlIGludG8gYW4gYXJyYXkuJztcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zbG90cyhuYW1lLCBzbG90LCBrZXlzKSB7XG4gICAgZm9yIChjb25zdCBzbG90X2tleSBvZiBPYmplY3Qua2V5cyhzbG90KSkge1xuICAgICAgICBpZiAoIX5rZXlzLmluZGV4T2Yoc2xvdF9rZXkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYDwke25hbWV9PiByZWNlaXZlZCBhbiB1bmV4cGVjdGVkIHNsb3QgXCIke3Nsb3Rfa2V5fVwiLmApO1xuICAgICAgICB9XG4gICAgfVxufVxuY2xhc3MgU3ZlbHRlQ29tcG9uZW50RGV2IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAoIW9wdGlvbnMudGFyZ2V0ICYmICFvcHRpb25zLiQkaW5saW5lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ3RhcmdldCcgaXMgYSByZXF1aXJlZCBvcHRpb25cIik7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG4gICAgJGRlc3Ryb3koKSB7XG4gICAgICAgIHN1cGVyLiRkZXN0cm95KCk7XG4gICAgICAgIHRoaXMuJGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWQnKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH07XG4gICAgfVxuICAgICRjYXB0dXJlX3N0YXRlKCkgeyB9XG4gICAgJGluamVjdF9zdGF0ZSgpIHsgfVxufVxuZnVuY3Rpb24gbG9vcF9ndWFyZCh0aW1lb3V0KSB7XG4gICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZmluaXRlIGxvb3AgZGV0ZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEh0bWxUYWcsIFN2ZWx0ZUNvbXBvbmVudCwgU3ZlbHRlQ29tcG9uZW50RGV2LCBTdmVsdGVFbGVtZW50LCBhY3Rpb25fZGVzdHJveWVyLCBhZGRfYXR0cmlidXRlLCBhZGRfY2xhc3NlcywgYWRkX2ZsdXNoX2NhbGxiYWNrLCBhZGRfbG9jYXRpb24sIGFkZF9yZW5kZXJfY2FsbGJhY2ssIGFkZF9yZXNpemVfbGlzdGVuZXIsIGFkZF90cmFuc2Zvcm0sIGFmdGVyVXBkYXRlLCBhcHBlbmQsIGFwcGVuZF9kZXYsIGFzc2lnbiwgYXR0ciwgYXR0cl9kZXYsIGF0dHJpYnV0ZV90b19vYmplY3QsIGJlZm9yZVVwZGF0ZSwgYmluZCwgYmluZGluZ19jYWxsYmFja3MsIGJsYW5rX29iamVjdCwgYnViYmxlLCBjaGVja19vdXRyb3MsIGNoaWxkcmVuLCBjbGFpbV9jb21wb25lbnQsIGNsYWltX2VsZW1lbnQsIGNsYWltX3NwYWNlLCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY29tcHV0ZV9yZXN0X3Byb3BzLCBjb21wdXRlX3Nsb3RzLCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVzY2FwZSwgZXNjYXBlZCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRDb250ZXh0LCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzLCBnZXRfc2xvdF9jaGFuZ2VzLCBnZXRfc2xvdF9jb250ZXh0LCBnZXRfc3ByZWFkX29iamVjdCwgZ2V0X3NwcmVhZF91cGRhdGUsIGdldF9zdG9yZV92YWx1ZSwgZ2xvYmFscywgZ3JvdXBfb3V0cm9zLCBoYW5kbGVfcHJvbWlzZSwgaGFzX3Byb3AsIGlkZW50aXR5LCBpbml0LCBpbnNlcnQsIGluc2VydF9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfY3Jvc3NvcmlnaW4sIGlzX2VtcHR5LCBpc19mdW5jdGlvbiwgaXNfcHJvbWlzZSwgbGlzdGVuLCBsaXN0ZW5fZGV2LCBsb29wLCBsb29wX2d1YXJkLCBtaXNzaW5nX2NvbXBvbmVudCwgbW91bnRfY29tcG9uZW50LCBub29wLCBub3RfZXF1YWwsIG5vdywgbnVsbF90b19lbXB0eSwgb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcywgb25EZXN0cm95LCBvbk1vdW50LCBvbmNlLCBvdXRyb19hbmRfZGVzdHJveV9ibG9jaywgcHJldmVudF9kZWZhdWx0LCBwcm9wX2RldiwgcXVlcnlfc2VsZWN0b3JfYWxsLCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2RhdGEsIHNldF9kYXRhX2Rldiwgc2V0X2lucHV0X3R5cGUsIHNldF9pbnB1dF92YWx1ZSwgc2V0X25vdywgc2V0X3JhZiwgc2V0X3N0b3JlX3ZhbHVlLCBzZXRfc3R5bGUsIHNldF9zdmdfYXR0cmlidXRlcywgc3BhY2UsIHNwcmVhZCwgc3RvcF9wcm9wYWdhdGlvbiwgc3Vic2NyaWJlLCBzdmdfZWxlbWVudCwgdGV4dCwgdGljaywgdGltZV9yYW5nZXNfdG9fYXJyYXksIHRvX251bWJlciwgdG9nZ2xlX2NsYXNzLCB0cmFuc2l0aW9uX2luLCB0cmFuc2l0aW9uX291dCwgdXBkYXRlX2tleWVkX2VhY2gsIHVwZGF0ZV9zbG90LCB2YWxpZGF0ZV9jb21wb25lbnQsIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQsIHZhbGlkYXRlX2VhY2hfa2V5cywgdmFsaWRhdGVfc2xvdHMsIHZhbGlkYXRlX3N0b3JlLCB4bGlua19hdHRyIH07XG4iLCI8c2NyaXB0PlxuICBleHBvcnQgbGV0IHR5cGUgPSAnJ1xuICBleHBvcnQgbGV0IHBhY2sgPSAnZmFzJ1xuICBleHBvcnQgbGV0IGljb25cbiAgZXhwb3J0IGxldCBzaXplID0gJydcbiAgZXhwb3J0IGxldCBjdXN0b21DbGFzcyA9ICcnXG4gIGV4cG9ydCBsZXQgY3VzdG9tU2l6ZSA9ICcnXG4gIGV4cG9ydCBsZXQgaXNDbGlja2FibGUgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzTGVmdCA9IGZhbHNlXG4gIGV4cG9ydCBsZXQgaXNSaWdodCA9IGZhbHNlXG5cbiAgbGV0IG5ld0N1c3RvbVNpemUgPSAnJ1xuICBsZXQgbmV3VHlwZSA9ICcnXG5cbiAgJDogbmV3UGFjayA9IHBhY2sgfHwgJ2ZhcydcblxuICAkOiB7XG4gICAgaWYgKGN1c3RvbVNpemUpIG5ld0N1c3RvbVNpemUgPSBjdXN0b21TaXplXG4gICAgZWxzZSB7XG4gICAgICBzd2l0Y2ggKHNpemUpIHtcbiAgICAgICAgY2FzZSAnaXMtc21hbGwnOlxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2lzLW1lZGl1bSc6XG4gICAgICAgICAgbmV3Q3VzdG9tU2l6ZSA9ICdmYS1sZydcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpcy1sYXJnZSc6XG4gICAgICAgICAgbmV3Q3VzdG9tU2l6ZSA9ICdmYS0zeCdcbiAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIG5ld0N1c3RvbVNpemUgPSAnJ1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICQ6IHtcbiAgICBpZiAoIXR5cGUpIG5ld1R5cGUgPSAnJ1xuICAgIGxldCBzcGxpdFR5cGUgPSBbXVxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNwbGl0VHlwZSA9IHR5cGUuc3BsaXQoJy0nKVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBrZXkgaW4gdHlwZSkge1xuICAgICAgICBpZiAodHlwZVtrZXldKSB7XG4gICAgICAgICAgc3BsaXRUeXBlID0ga2V5LnNwbGl0KCctJylcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzcGxpdFR5cGUubGVuZ3RoIDw9IDEpIG5ld1R5cGUgPSAnJ1xuICAgIGVsc2UgbmV3VHlwZSA9IGBoYXMtdGV4dC0ke3NwbGl0VHlwZVsxXX1gXG4gIH1cbjwvc2NyaXB0PlxuXG48c3BhbiBjbGFzcz1cImljb24ge3NpemV9IHtuZXdUeXBlfSB7KGlzTGVmdCAmJiAnaXMtbGVmdCcpIHx8ICcnfSB7KGlzUmlnaHQgJiYgJ2lzLXJpZ2h0JykgfHwgJyd9XCIgY2xhc3M6aXMtY2xpY2thYmxlPXtpc0NsaWNrYWJsZX0gb246Y2xpY2s+XG4gIDxpIGNsYXNzPVwie25ld1BhY2t9IGZhLXtpY29ufSB7Y3VzdG9tQ2xhc3N9IHtuZXdDdXN0b21TaXplfVwiIC8+XG48L3NwYW4+XG4iLCJpbXBvcnQgeyBub29wLCBzYWZlX25vdF9lcXVhbCwgc3Vic2NyaWJlLCBydW5fYWxsLCBpc19mdW5jdGlvbiB9IGZyb20gJy4uL2ludGVybmFsL2luZGV4Lm1qcyc7XG5leHBvcnQgeyBnZXRfc3RvcmVfdmFsdWUgYXMgZ2V0IH0gZnJvbSAnLi4vaW50ZXJuYWwvaW5kZXgubWpzJztcblxuY29uc3Qgc3Vic2NyaWJlcl9xdWV1ZSA9IFtdO1xuLyoqXG4gKiBDcmVhdGVzIGEgYFJlYWRhYmxlYCBzdG9yZSB0aGF0IGFsbG93cyByZWFkaW5nIGJ5IHN1YnNjcmlwdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyfXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gcmVhZGFibGUodmFsdWUsIHN0YXJ0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3Vic2NyaWJlOiB3cml0YWJsZSh2YWx1ZSwgc3RhcnQpLnN1YnNjcmliZVxuICAgIH07XG59XG4vKipcbiAqIENyZWF0ZSBhIGBXcml0YWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgYm90aCB1cGRhdGluZyBhbmQgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0geyo9fXZhbHVlIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7U3RhcnRTdG9wTm90aWZpZXI9fXN0YXJ0IHN0YXJ0IGFuZCBzdG9wIG5vdGlmaWNhdGlvbnMgZm9yIHN1YnNjcmlwdGlvbnNcbiAqL1xuZnVuY3Rpb24gd3JpdGFibGUodmFsdWUsIHN0YXJ0ID0gbm9vcCkge1xuICAgIGxldCBzdG9wO1xuICAgIGNvbnN0IHN1YnNjcmliZXJzID0gW107XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSkge1xuICAgICAgICBpZiAoc2FmZV9ub3RfZXF1YWwodmFsdWUsIG5ld192YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICAgICAgaWYgKHN0b3ApIHsgLy8gc3RvcmUgaXMgcmVhZHlcbiAgICAgICAgICAgICAgICBjb25zdCBydW5fcXVldWUgPSAhc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIHNbMV0oKTtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5wdXNoKHMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJ1bl9xdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJfcXVldWUubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWVbaV1bMF0oc3Vic2NyaWJlcl9xdWV1ZVtpICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJfcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlKGZuKSB7XG4gICAgICAgIHNldChmbih2YWx1ZSkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdWJzY3JpYmUocnVuLCBpbnZhbGlkYXRlID0gbm9vcCkge1xuICAgICAgICBjb25zdCBzdWJzY3JpYmVyID0gW3J1biwgaW52YWxpZGF0ZV07XG4gICAgICAgIHN1YnNjcmliZXJzLnB1c2goc3Vic2NyaWJlcik7XG4gICAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHN0b3AgPSBzdGFydChzZXQpIHx8IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgcnVuKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gc3Vic2NyaWJlcnMuaW5kZXhPZihzdWJzY3JpYmVyKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICAgICAgICBzdG9wID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2V0LCB1cGRhdGUsIHN1YnNjcmliZSB9O1xufVxuZnVuY3Rpb24gZGVyaXZlZChzdG9yZXMsIGZuLCBpbml0aWFsX3ZhbHVlKSB7XG4gICAgY29uc3Qgc2luZ2xlID0gIUFycmF5LmlzQXJyYXkoc3RvcmVzKTtcbiAgICBjb25zdCBzdG9yZXNfYXJyYXkgPSBzaW5nbGVcbiAgICAgICAgPyBbc3RvcmVzXVxuICAgICAgICA6IHN0b3JlcztcbiAgICBjb25zdCBhdXRvID0gZm4ubGVuZ3RoIDwgMjtcbiAgICByZXR1cm4gcmVhZGFibGUoaW5pdGlhbF92YWx1ZSwgKHNldCkgPT4ge1xuICAgICAgICBsZXQgaW5pdGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgICAgICBsZXQgcGVuZGluZyA9IDA7XG4gICAgICAgIGxldCBjbGVhbnVwID0gbm9vcDtcbiAgICAgICAgY29uc3Qgc3luYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZm4oc2luZ2xlID8gdmFsdWVzWzBdIDogdmFsdWVzLCBzZXQpO1xuICAgICAgICAgICAgaWYgKGF1dG8pIHtcbiAgICAgICAgICAgICAgICBzZXQocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsZWFudXAgPSBpc19mdW5jdGlvbihyZXN1bHQpID8gcmVzdWx0IDogbm9vcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdW5zdWJzY3JpYmVycyA9IHN0b3Jlc19hcnJheS5tYXAoKHN0b3JlLCBpKSA9PiBzdWJzY3JpYmUoc3RvcmUsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdmFsdWVzW2ldID0gdmFsdWU7XG4gICAgICAgICAgICBwZW5kaW5nICY9IH4oMSA8PCBpKTtcbiAgICAgICAgICAgIGlmIChpbml0ZWQpIHtcbiAgICAgICAgICAgICAgICBzeW5jKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHBlbmRpbmcgfD0gKDEgPDwgaSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgaW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgc3luYygpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodW5zdWJzY3JpYmVycyk7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IGRlcml2ZWQsIHJlYWRhYmxlLCB3cml0YWJsZSB9O1xuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICcuLi9zdG9yZS9pbmRleC5tanMnO1xuaW1wb3J0IHsgbm93LCBsb29wLCBhc3NpZ24gfSBmcm9tICcuLi9pbnRlcm5hbC9pbmRleC5tanMnO1xuaW1wb3J0IHsgbGluZWFyIH0gZnJvbSAnLi4vZWFzaW5nL2luZGV4Lm1qcyc7XG5cbmZ1bmN0aW9uIGlzX2RhdGUob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIHRpY2tfc3ByaW5nKGN0eCwgbGFzdF92YWx1ZSwgY3VycmVudF92YWx1ZSwgdGFyZ2V0X3ZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50X3ZhbHVlID09PSAnbnVtYmVyJyB8fCBpc19kYXRlKGN1cnJlbnRfdmFsdWUpKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgZGVsdGEgPSB0YXJnZXRfdmFsdWUgLSBjdXJyZW50X3ZhbHVlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IHZlbG9jaXR5ID0gKGN1cnJlbnRfdmFsdWUgLSBsYXN0X3ZhbHVlKSAvIChjdHguZHQgfHwgMSAvIDYwKTsgLy8gZ3VhcmQgZGl2IGJ5IDBcbiAgICAgICAgY29uc3Qgc3ByaW5nID0gY3R4Lm9wdHMuc3RpZmZuZXNzICogZGVsdGE7XG4gICAgICAgIGNvbnN0IGRhbXBlciA9IGN0eC5vcHRzLmRhbXBpbmcgKiB2ZWxvY2l0eTtcbiAgICAgICAgY29uc3QgYWNjZWxlcmF0aW9uID0gKHNwcmluZyAtIGRhbXBlcikgKiBjdHguaW52X21hc3M7XG4gICAgICAgIGNvbnN0IGQgPSAodmVsb2NpdHkgKyBhY2NlbGVyYXRpb24pICogY3R4LmR0O1xuICAgICAgICBpZiAoTWF0aC5hYnMoZCkgPCBjdHgub3B0cy5wcmVjaXNpb24gJiYgTWF0aC5hYnMoZGVsdGEpIDwgY3R4Lm9wdHMucHJlY2lzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0X3ZhbHVlOyAvLyBzZXR0bGVkXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjdHguc2V0dGxlZCA9IGZhbHNlOyAvLyBzaWduYWwgbG9vcCB0byBrZWVwIHRpY2tpbmdcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHJldHVybiBpc19kYXRlKGN1cnJlbnRfdmFsdWUpID9cbiAgICAgICAgICAgICAgICBuZXcgRGF0ZShjdXJyZW50X3ZhbHVlLmdldFRpbWUoKSArIGQpIDogY3VycmVudF92YWx1ZSArIGQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50X3ZhbHVlKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBjdXJyZW50X3ZhbHVlLm1hcCgoXywgaSkgPT4gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlW2ldLCBjdXJyZW50X3ZhbHVlW2ldLCB0YXJnZXRfdmFsdWVbaV0pKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGN1cnJlbnRfdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IG5leHRfdmFsdWUgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBrIGluIGN1cnJlbnRfdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIG5leHRfdmFsdWVba10gPSB0aWNrX3NwcmluZyhjdHgsIGxhc3RfdmFsdWVba10sIGN1cnJlbnRfdmFsdWVba10sIHRhcmdldF92YWx1ZVtrXSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gbmV4dF92YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHNwcmluZyAke3R5cGVvZiBjdXJyZW50X3ZhbHVlfSB2YWx1ZXNgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzcHJpbmcodmFsdWUsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHN0b3JlID0gd3JpdGFibGUodmFsdWUpO1xuICAgIGNvbnN0IHsgc3RpZmZuZXNzID0gMC4xNSwgZGFtcGluZyA9IDAuOCwgcHJlY2lzaW9uID0gMC4wMSB9ID0gb3B0cztcbiAgICBsZXQgbGFzdF90aW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCBjdXJyZW50X3Rva2VuO1xuICAgIGxldCBsYXN0X3ZhbHVlID0gdmFsdWU7XG4gICAgbGV0IHRhcmdldF92YWx1ZSA9IHZhbHVlO1xuICAgIGxldCBpbnZfbWFzcyA9IDE7XG4gICAgbGV0IGludl9tYXNzX3JlY292ZXJ5X3JhdGUgPSAwO1xuICAgIGxldCBjYW5jZWxfdGFzayA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIHNldChuZXdfdmFsdWUsIG9wdHMgPSB7fSkge1xuICAgICAgICB0YXJnZXRfdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgIGNvbnN0IHRva2VuID0gY3VycmVudF90b2tlbiA9IHt9O1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCBvcHRzLmhhcmQgfHwgKHNwcmluZy5zdGlmZm5lc3MgPj0gMSAmJiBzcHJpbmcuZGFtcGluZyA+PSAxKSkge1xuICAgICAgICAgICAgY2FuY2VsX3Rhc2sgPSB0cnVlOyAvLyBjYW5jZWwgYW55IHJ1bm5pbmcgYW5pbWF0aW9uXG4gICAgICAgICAgICBsYXN0X3RpbWUgPSBub3coKTtcbiAgICAgICAgICAgIGxhc3RfdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSB0YXJnZXRfdmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdHMuc29mdCkge1xuICAgICAgICAgICAgY29uc3QgcmF0ZSA9IG9wdHMuc29mdCA9PT0gdHJ1ZSA/IC41IDogK29wdHMuc29mdDtcbiAgICAgICAgICAgIGludl9tYXNzX3JlY292ZXJ5X3JhdGUgPSAxIC8gKHJhdGUgKiA2MCk7XG4gICAgICAgICAgICBpbnZfbWFzcyA9IDA7IC8vIGluZmluaXRlIG1hc3MsIHVuYWZmZWN0ZWQgYnkgc3ByaW5nIGZvcmNlc1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFzaykge1xuICAgICAgICAgICAgbGFzdF90aW1lID0gbm93KCk7XG4gICAgICAgICAgICBjYW5jZWxfdGFzayA9IGZhbHNlO1xuICAgICAgICAgICAgdGFzayA9IGxvb3Aobm93ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2FuY2VsX3Rhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsX3Rhc2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW52X21hc3MgPSBNYXRoLm1pbihpbnZfbWFzcyArIGludl9tYXNzX3JlY292ZXJ5X3JhdGUsIDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW52X21hc3MsXG4gICAgICAgICAgICAgICAgICAgIG9wdHM6IHNwcmluZyxcbiAgICAgICAgICAgICAgICAgICAgc2V0dGxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZHQ6IChub3cgLSBsYXN0X3RpbWUpICogNjAgLyAxMDAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0X3ZhbHVlID0gdGlja19zcHJpbmcoY3R4LCBsYXN0X3ZhbHVlLCB2YWx1ZSwgdGFyZ2V0X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBsYXN0X3RpbWUgPSBub3c7XG4gICAgICAgICAgICAgICAgbGFzdF92YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHN0b3JlLnNldCh2YWx1ZSA9IG5leHRfdmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChjdHguc2V0dGxlZCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICFjdHguc2V0dGxlZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdWxmaWwgPT4ge1xuICAgICAgICAgICAgdGFzay5wcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbiA9PT0gY3VycmVudF90b2tlbilcbiAgICAgICAgICAgICAgICAgICAgZnVsZmlsKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHNwcmluZyA9IHtcbiAgICAgICAgc2V0LFxuICAgICAgICB1cGRhdGU6IChmbiwgb3B0cykgPT4gc2V0KGZuKHRhcmdldF92YWx1ZSwgdmFsdWUpLCBvcHRzKSxcbiAgICAgICAgc3Vic2NyaWJlOiBzdG9yZS5zdWJzY3JpYmUsXG4gICAgICAgIHN0aWZmbmVzcyxcbiAgICAgICAgZGFtcGluZyxcbiAgICAgICAgcHJlY2lzaW9uXG4gICAgfTtcbiAgICByZXR1cm4gc3ByaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRfaW50ZXJwb2xhdG9yKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gYiB8fCBhICE9PSBhKVxuICAgICAgICByZXR1cm4gKCkgPT4gYTtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIGE7XG4gICAgaWYgKHR5cGUgIT09IHR5cGVvZiBiIHx8IEFycmF5LmlzQXJyYXkoYSkgIT09IEFycmF5LmlzQXJyYXkoYikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW50ZXJwb2xhdGUgdmFsdWVzIG9mIGRpZmZlcmVudCB0eXBlJyk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgIGNvbnN0IGFyciA9IGIubWFwKChiaSwgaSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGdldF9pbnRlcnBvbGF0b3IoYVtpXSwgYmkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHQgPT4gYXJyLm1hcChmbiA9PiBmbih0KSk7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAoIWEgfHwgIWIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBjYW5ub3QgYmUgbnVsbCcpO1xuICAgICAgICBpZiAoaXNfZGF0ZShhKSAmJiBpc19kYXRlKGIpKSB7XG4gICAgICAgICAgICBhID0gYS5nZXRUaW1lKCk7XG4gICAgICAgICAgICBiID0gYi5nZXRUaW1lKCk7XG4gICAgICAgICAgICBjb25zdCBkZWx0YSA9IGIgLSBhO1xuICAgICAgICAgICAgcmV0dXJuIHQgPT4gbmV3IERhdGUoYSArIHQgKiBkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGIpO1xuICAgICAgICBjb25zdCBpbnRlcnBvbGF0b3JzID0ge307XG4gICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgaW50ZXJwb2xhdG9yc1trZXldID0gZ2V0X2ludGVycG9sYXRvcihhW2tleV0sIGJba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gaW50ZXJwb2xhdG9yc1trZXldKHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBiIC0gYTtcbiAgICAgICAgcmV0dXJuIHQgPT4gYSArIHQgKiBkZWx0YTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgaW50ZXJwb2xhdGUgJHt0eXBlfSB2YWx1ZXNgKTtcbn1cbmZ1bmN0aW9uIHR3ZWVuZWQodmFsdWUsIGRlZmF1bHRzID0ge30pIHtcbiAgICBjb25zdCBzdG9yZSA9IHdyaXRhYmxlKHZhbHVlKTtcbiAgICBsZXQgdGFzaztcbiAgICBsZXQgdGFyZ2V0X3ZhbHVlID0gdmFsdWU7XG4gICAgZnVuY3Rpb24gc2V0KG5ld192YWx1ZSwgb3B0cykge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXRfdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgIGxldCBwcmV2aW91c190YXNrID0gdGFzaztcbiAgICAgICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgbGV0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDQwMCwgZWFzaW5nID0gbGluZWFyLCBpbnRlcnBvbGF0ZSA9IGdldF9pbnRlcnBvbGF0b3IgfSA9IGFzc2lnbihhc3NpZ24oe30sIGRlZmF1bHRzKSwgb3B0cyk7XG4gICAgICAgIGlmIChkdXJhdGlvbiA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzX3Rhc2spIHtcbiAgICAgICAgICAgICAgICBwcmV2aW91c190YXNrLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzayA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSB0YXJnZXRfdmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgbGV0IGZuO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKG5vdyA8IHN0YXJ0KVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYgKCFzdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgZm4gPSBpbnRlcnBvbGF0ZSh2YWx1ZSwgbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uKHZhbHVlLCBuZXdfdmFsdWUpO1xuICAgICAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByZXZpb3VzX3Rhc2spIHtcbiAgICAgICAgICAgICAgICBwcmV2aW91c190YXNrLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgcHJldmlvdXNfdGFzayA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBlbGFwc2VkID0gbm93IC0gc3RhcnQ7XG4gICAgICAgICAgICBpZiAoZWxhcHNlZCA+IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3RvcmUuc2V0KHZhbHVlID0gbmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBzdG9yZS5zZXQodmFsdWUgPSBmbihlYXNpbmcoZWxhcHNlZCAvIGR1cmF0aW9uKSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFzay5wcm9taXNlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBzZXQsXG4gICAgICAgIHVwZGF0ZTogKGZuLCBvcHRzKSA9PiBzZXQoZm4odGFyZ2V0X3ZhbHVlLCB2YWx1ZSksIG9wdHMpLFxuICAgICAgICBzdWJzY3JpYmU6IHN0b3JlLnN1YnNjcmliZVxuICAgIH07XG59XG5cbmV4cG9ydCB7IHNwcmluZywgdHdlZW5lZCB9O1xuIiwiPHNjcmlwdD5cbiAgaW1wb3J0IHsgc2V0Q29udGV4dCwgZ2V0Q29udGV4dCwgb25Nb3VudCwgb25EZXN0cm95LCBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCB7IGdldCwgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXG4gIGltcG9ydCBJY29uIGZyb20gJy4uL0ljb24uc3ZlbHRlJ1xuXG4gIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKClcblxuICAvKiogSW5kZXggb2YgdGhlIGFjdGl2ZSB0YWIgKHplcm8tYmFzZWQpXG4gICAqIEBzdmVsdGUtcHJvcCB7TnVtYmVyfSBbdmFsdWU9MF1cbiAgICogKi9cbiAgZXhwb3J0IGxldCB2YWx1ZSA9IDBcblxuICAvKiogU2l6ZSBvZiB0YWJzXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbc2l6ZV1cbiAgICogQHZhbHVlcyAkJHNpemVzJCRcbiAgICogKi9cbiAgZXhwb3J0IGxldCBzaXplID0gJydcblxuICAvKiogUG9zaXRpb24gb2YgdGFicyBsaXN0LCBob3Jpem9udGFsbHkuIEJ5IGRlZmF1bHQgdGhleSdyZSBwb3NpdGlvbmVkIHRvIHRoZSBsZWZ0XG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbcG9zaXRpb25dXG4gICAqIEB2YWx1ZXMgaXMtY2VudGVyZWQsIGlzLXJpZ2h0XG4gICAqICovXG4gIGV4cG9ydCBsZXQgcG9zaXRpb24gPSAnJ1xuXG4gIC8qKiBTdHlsZSBvZiB0YWJzXG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbc3R5bGVdXG4gICAqIEB2YWx1ZXMgaXMtYm94ZWQsIGlzLXRvZ2dsZSwgaXMtdG9nZ2xlLXJvdW5kZWQsIGlzLWZ1bGx3aWR0aFxuICAgKiAqL1xuICBleHBvcnQgbGV0IHN0eWxlID0gJydcblxuICBleHBvcnQgbGV0IGV4cGFuZGVkID0gZmFsc2VcblxuICBsZXQgYWN0aXZlVGFiID0gMFxuICAkOiBjaGFuZ2VUYWIodmFsdWUpXG5cbiAgY29uc3QgdGFicyA9IHdyaXRhYmxlKFtdKVxuXG4gIGNvbnN0IHRhYkNvbmZpZyA9IHtcbiAgICBhY3RpdmVUYWIsXG4gICAgdGFicyxcbiAgfVxuXG4gIHNldENvbnRleHQoJ3RhYnMnLCB0YWJDb25maWcpXG5cbiAgLy8gVGhpcyBvbmx5IHJ1bnMgYXMgdGFicyBhcmUgYWRkZWQvcmVtb3ZlZFxuICBjb25zdCB1bnN1YnNjcmliZSA9IHRhYnMuc3Vic2NyaWJlKHRzID0+IHtcbiAgICBpZiAodHMubGVuZ3RoID4gMCAmJiB0cy5sZW5ndGggPiB2YWx1ZSAtIDEpIHtcbiAgICAgIHRzLmZvckVhY2godCA9PiB0LmRlYWN0aXZhdGUoKSlcbiAgICAgIGlmICh0c1t2YWx1ZV0pIHRzW3ZhbHVlXS5hY3RpdmF0ZSgpXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIGNoYW5nZVRhYih0YWJOdW1iZXIpIHtcbiAgICBjb25zdCB0cyA9IGdldCh0YWJzKVxuICAgIC8vIE5PVEU6IGNoYW5nZSB0aGlzIGJhY2sgdG8gdXNpbmcgY2hhbmdlVGFiIGluc3RlYWQgb2YgYWN0aXZhdGUvZGVhY3RpdmF0ZSBvbmNlIHRyYW5zaXRpb25zL2FuaW1hdGlvbnMgYXJlIHdvcmtpbmdcbiAgICBpZiAodHNbYWN0aXZlVGFiXSkgdHNbYWN0aXZlVGFiXS5kZWFjdGl2YXRlKClcbiAgICBpZiAodHNbdGFiTnVtYmVyXSkgdHNbdGFiTnVtYmVyXS5hY3RpdmF0ZSgpXG4gICAgLy8gdHMuZm9yRWFjaCh0ID0+IHQuY2hhbmdlVGFiKHsgZnJvbTogYWN0aXZlVGFiLCB0bzogdGFiTnVtYmVyIH0pKVxuICAgIGFjdGl2ZVRhYiA9IHRhYkNvbmZpZy5hY3RpdmVUYWIgPSB0YWJOdW1iZXJcbiAgICBkaXNwYXRjaCgnYWN0aXZlVGFiQ2hhbmdlZCcsIHRhYk51bWJlcilcbiAgfVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIGNoYW5nZVRhYihhY3RpdmVUYWIpXG4gIH0pXG5cbiAgb25EZXN0cm95KCgpID0+IHtcbiAgICB1bnN1YnNjcmliZSgpXG4gIH0pXG48L3NjcmlwdD5cblxuPHN0eWxlIGxhbmc9XCJzY3NzXCI+XG4gIC50YWJzLXdyYXBwZXIge1xuICAgICYuaXMtZnVsbHdpZHRoIHtcbiAgICAgIC8qIFRPRE8gKi9cbiAgICB9XG5cbiAgICAudGFiLWNvbnRlbnQge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJ0YWJzLXdyYXBwZXJcIiBjbGFzczppcy1mdWxsd2lkdGg9e2V4cGFuZGVkfT5cbiAgPG5hdiBjbGFzcz1cInRhYnMge3NpemV9IHtwb3NpdGlvbn0ge3N0eWxlfVwiPlxuICAgIDx1bD5cbiAgICAgIHsjZWFjaCAkdGFicyBhcyB0YWIsIGluZGV4fVxuICAgICAgICA8bGkgY2xhc3M6aXMtYWN0aXZlPXtpbmRleCA9PT0gYWN0aXZlVGFifT5cbiAgICAgICAgICA8YSBocmVmIG9uOmNsaWNrfHByZXZlbnREZWZhdWx0PXsoKSA9PiBjaGFuZ2VUYWIoaW5kZXgpfT5cbiAgICAgICAgICAgIHsjaWYgdGFiLmljb259XG4gICAgICAgICAgICAgIDxJY29uIHBhY2s9e3RhYi5pY29uUGFja30gaWNvbj17dGFiLmljb259IC8+XG4gICAgICAgICAgICB7L2lmfVxuXG4gICAgICAgICAgICA8c3Bhbj57dGFiLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgIDwvbGk+XG4gICAgICB7L2VhY2h9XG4gICAgPC91bD5cbiAgPC9uYXY+XG4gIDxzZWN0aW9uIGNsYXNzPVwidGFiLWNvbnRlbnRcIj5cbiAgICA8c2xvdCAvPlxuICA8L3NlY3Rpb24+XG48L2Rpdj5cbiIsIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGJlZm9yZVVwZGF0ZSwgc2V0Q29udGV4dCwgZ2V0Q29udGV4dCwgdGljaywgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IEljb24gZnJvbSAnLi4vSWNvbi5zdmVsdGUnXG5cbiAgLyoqIExhYmVsIGZvciB0YWJcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IGxhYmVsXG4gICAqICovXG4gIGV4cG9ydCBsZXQgbGFiZWxcblxuICAvKiogU2hvdyB0aGlzIGljb24gb24gbGVmdC1zaWRlIG9mIHRoZSB0YWJcbiAgICogQHN2ZWx0ZS1wcm9wIHtTdHJpbmd9IFtpY29uXVxuICAgKiAqL1xuICBleHBvcnQgbGV0IGljb24gPSAnJ1xuXG4gIC8qKiBGb250YXdlc29tZSBpY29uIHBhY2sgdG8gdXNlLiBCeSBkZWZhdWx0IHRoZSA8Y29kZT5JY29uPC9jb2RlPiBjb21wb25lbnQgdXNlcyA8Y29kZT5mYXM8L2NvZGU+XG4gICAqIEBzdmVsdGUtcHJvcCB7U3RyaW5nfSBbaWNvblBhY2tdXG4gICAqIEB2YWx1ZXMgPGNvZGU+ZmFzPC9jb2RlPiwgPGNvZGU+ZmFiPC9jb2RlPiwgZXRjLi4uXG4gICAqICovXG4gIGV4cG9ydCBsZXQgaWNvblBhY2sgPSAnJ1xuXG4gIGxldCBhY3RpdmUgPSBmYWxzZVxuXG4gIGxldCBlbFxuICBsZXQgaW5kZXhcbiAgbGV0IHN0YXJ0aW5nID0gZmFsc2VcbiAgbGV0IGRpcmVjdGlvbiA9ICcnXG4gIGxldCBpc0luID0gZmFsc2VcblxuICBjb25zdCB0YWJDb25maWcgPSBnZXRDb250ZXh0KCd0YWJzJylcblxuICBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hhbmdlVGFiKHsgZnJvbSwgdG8gfSkge1xuICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuXG5cbiAgICAvLyBjb25zb2xlLmxvZyh7IGluZGV4LCBmcm9tLCB0byB9LCB0byA9PT0gaW5kZXgpXG4gICAgaWYgKGZyb20gPT09IGluZGV4KSB7XG4gICAgICAvLyBUcmFuc2l0aW9uIG91dFxuICAgICAgZGlyZWN0aW9uID0gaW5kZXggPCB0byA/ICdsZWZ0JyA6ICdyaWdodCdcbiAgICB9IGVsc2UgaWYgKHRvID09PSBpbmRleCkge1xuICAgICAgLy8gVHJhbnNpdGlvbiBpbjsgc3RhcnQgYXQgZGlyZWN0aW9uIHdoZW4gcmVuZGVyZWQsIHRoZW4gcmVtb3ZlIGl0XG4gICAgICAvLyBjb25zb2xlLmxvZygnVFJBTlNJVElPTicsIHsgaW5kZXgsIHRvLCBhY3RpdmUgfSlcbiAgICAgIGFjdGl2ZSA9IHRydWVcbiAgICAgIGRpcmVjdGlvbiA9IGluZGV4ID4gZnJvbSA/ICdyaWdodCcgOiAnbGVmdCdcbiAgICAgIC8vIGF3YWl0IHRpY2soKVxuICAgICAgLy8gZGlyZWN0aW9uID0gJydcbiAgICB9IGVsc2UgZGlyZWN0aW9uID0gJydcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUluZGV4KCkge1xuICAgIGlmICghZWwpIHJldHVyblxuICAgIGluZGV4ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChlbC5wYXJlbnROb2RlLmNoaWxkcmVuLCBlbClcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHRyYW5zaXRpb25lbmQoZXZlbnQpIHtcbiAgICAvLyBjb25zb2xlLmxvZyh7IGluZGV4LCBhY3RpdmUsIGFjdGl2ZVRhYjogdGFiQ29uZmlnLmFjdGl2ZVRhYiB9KVxuICAgIC8vIGNvbnNvbGUubG9nKGV2ZW50LnRhcmdldClcbiAgICBhY3RpdmUgPSBpbmRleCA9PT0gdGFiQ29uZmlnLmFjdGl2ZVRhYlxuICAgIGF3YWl0IHRpY2soKVxuICAgIGRpcmVjdGlvbiA9ICcnXG4gIH1cblxuICB0YWJDb25maWcudGFicy5zdWJzY3JpYmUodGFicyA9PiB7XG4gICAgdXBkYXRlSW5kZXgoKVxuICB9KVxuXG4gIG9uTW91bnQoKCkgPT4ge1xuICAgIHVwZGF0ZUluZGV4KClcblxuICAgIHRhYkNvbmZpZy50YWJzLnVwZGF0ZSh0YWJzID0+IFtcbiAgICAgIC4uLnRhYnMsXG4gICAgICB7XG4gICAgICAgIGluZGV4LFxuICAgICAgICBsYWJlbCxcbiAgICAgICAgaWNvbixcbiAgICAgICAgaWNvblBhY2ssXG4gICAgICAgIGFjdGl2YXRlOiAoKSA9PiAoYWN0aXZlID0gdHJ1ZSksXG4gICAgICAgIGRlYWN0aXZhdGU6ICgpID0+IChhY3RpdmUgPSBmYWxzZSksXG4gICAgICAgIGNoYW5nZVRhYixcbiAgICAgIH0sXG4gICAgXSlcbiAgfSlcblxuICBiZWZvcmVVcGRhdGUoYXN5bmMgKCkgPT4ge1xuICAgIGlmIChpbmRleCA9PT0gdGFiQ29uZmlnLmFjdGl2ZVRhYiAmJiBkaXJlY3Rpb24pIHtcbiAgICAgIGF3YWl0IHRpY2soKVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRpcmVjdGlvbiA9ICcnXG4gICAgICB9KVxuICAgIH1cbiAgfSlcbjwvc2NyaXB0PlxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj5cbiAgLy8gTk9URTogYWRkIHRyYW5zaXRpb25zL2FuaW1hdGlvbnMgYmFjayBvbmNlIHRoZXkncmUgd29ya2luZ1xuICAudGFiIHtcbiAgICBkaXNwbGF5OiBub25lO1xuICAgIGZsZXg6IDEgMCAxMDAlO1xuICAgIC8vIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm07XG4gICAgLy8gdHJhbnNpdGlvbjogdHJhbnNmb3JtIDQwMG1zIGVhc2UtaW47XG5cbiAgICAmLmlzLWFjdGl2ZSB7XG4gICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAvLyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG4gICAgfVxuXG4gICAgLy8gJi5zdGFydGluZyB7XG4gICAgLy8gICB0cmFuc2l0aW9uOiBub25lO1xuICAgIC8vIH1cblxuICAgIC8vICYubGVmdCB7XG4gICAgLy8gICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTEwMCUpO1xuICAgIC8vIH1cblxuICAgIC8vICYucmlnaHQge1xuICAgIC8vICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDEwMCUpO1xuICAgIC8vIH1cblxuICAgIC8vICYuc3RhcnRpbmcge1xuICAgIC8vICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICAvLyB9XG4gIH1cbjwvc3R5bGU+XG5cbjxkaXZcbiAgY2xhc3M9XCJ0YWIge2RpcmVjdGlvbn1cIlxuICBjbGFzczppcy1hY3RpdmU9e2FjdGl2ZX1cbiAgYmluZDp0aGlzPXtlbH1cbiAgYXJpYS1oaWRkZW49eyFhY3RpdmV9XG4gIG9uOnRyYW5zaXRpb25lbmQ9e3RyYW5zaXRpb25lbmR9PlxuICA8c2xvdCB7bGFiZWx9IHtpY29uUGFja30ge2ljb259IC8+XG48L2Rpdj5cbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcclxuICBvcGVuRGlzYWJsZWQ6IGZhbHNlLFxyXG4gIHNhdmVEaXNhYmxlZDogdHJ1ZSxcclxuICBnb0Rpc2FibGVkOiB0cnVlLFxyXG4gIGNvbnRlbnQ6ICcnLFxyXG4gIGZwYXRoOiAnJyxcclxuICBwYXRoOiAnJ1xyXG59KVxyXG4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IHRvcDtcclxuZXhwb3J0IGxldCBibG9jaz1mYWxzZTtcclxuXHJcbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcclxuICByZXR1cm4gdG9wID8gYGhlaWdodDogY2FsYygxMDB2aCAtICR7dG9wfXB4KTtgIDogJyc7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidmJveCBsZWZ0XCI+XHJcbiAgeyNpZiBibG9ja31cclxuICAgIDxzbG90Pjwvc2xvdD5cclxuICB7OmVsc2V9XHJcbiAgICA8ZGl2IGNsYXNzPVwidGFibGUtY29udGFpbmVyXCIgc3R5bGU9XCJ7cmVzaXplKCl9XCI+XHJcbiAgICAgIDxzbG90Pjwvc2xvdD5cclxuICAgIDwvZGl2PlxyXG4gIHsvaWZ9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udmJveCB7XHJcbiAgZmxleDogYXV0bztcclxuICBkaXNwbGF5OiBmbGV4O1xyXG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG59XHJcbi52Ym94LmxlZnQge1xyXG4gIHdpZHRoOiAxMDAlO1xyXG59XHJcbi50YWJsZS1jb250YWluZXIge1xyXG4gIG92ZXJmbG93OiBhdXRvO1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgdG9wO1xyXG5cclxuaW1wb3J0IHtzcHJpbmd9IGZyb20gJ3N2ZWx0ZS9tb3Rpb24nXHJcbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSc7XHJcblxyXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG4gIFxyXG5sZXQgZHJvcFRhcmdldDtcclxuZnVuY3Rpb24gZHJhZ2dhYmxlKG5vZGUsIHBhcmFtcykge1xyXG4gIFxyXG4gIGxldCBsYXN0WDtcclxuICBsZXQgcGFyZW50WDtcclxuICBsZXQgb2Zmc2V0WCA9IDBcclxuICBjb25zdCBvZmZzZXQgPSBzcHJpbmcoe3g6IG9mZnNldFgsIHk6IDB9LCB7XHJcblx0XHRzdGlmZm5lc3M6IDAuMixcclxuXHRcdGRhbXBpbmc6IDAuNFxyXG5cdH0pO1xyXG5cclxuICBvZmZzZXQuc3Vic2NyaWJlKG9mZnNldCA9PiB7XHJcbiAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcbiAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgIGNvbnN0IGxlZnQgPSBwYXJlbnRYICsgb2Zmc2V0LnhcclxuICAgICAgcGFyZW50LnN0eWxlLmxlZnQgPSBgJHtsZWZ0fXB4YDtcclxuICAgICAgcGFyZW50LnN0eWxlLndpZHRoID0gYGNhbGMoMTAwdncgLSAke2xlZnR9cHhgO1xyXG4gICAgfVxyXG4gIH0pXHJcblxyXG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duKTtcclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2Vkb3duKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRsYXN0WCA9IGV2ZW50LmNsaWVudFg7XHJcbiAgICBwYXJlbnRYID0gbm9kZS5wYXJlbnROb2RlLm9mZnNldExlZnQ7XHJcbiAgICBub2RlLmNsYXNzTGlzdC5hZGQoJ2RyYWdnZWQnKVxyXG5cclxuICAgIGRpc3BhdGNoKCdkcmFnc3RhcnQnLCB7dGFyZ2V0Om5vZGUsIGxhc3RYfSk7XHJcblxyXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSk7XHJcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNldXApO1xyXG5cdH1cclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlTW91c2Vtb3ZlKGUpIHtcclxuICAgIG9mZnNldFggKz0gZS5jbGllbnRYIC0gbGFzdFg7XHJcbiAgICBvZmZzZXQuc2V0KHt4OiBvZmZzZXRYLCB5OiAwfSk7XHJcbiAgICBcclxuXHRcdGxhc3RYID0gZS5jbGllbnRYO1xyXG4gICAgZGlzcGF0Y2goJ2RyYWcnLCB7dGFyZ2V0Om5vZGUsIGxlZnQ6IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0fSk7XHJcblx0fVxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZXVwKGV2ZW50KSB7XHJcbiAgICBvZmZzZXRYID0gMDtcclxuICAgIGRyb3BUYXJnZXQgPSBudWxsO1xyXG4gICAgbGFzdFggPSB1bmRlZmluZWQ7XHJcbiAgICBwYXJlbnRYID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIG5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnZHJhZ2dlZCcpO1xyXG4gICAgb2Zmc2V0LnNldCh7eDogbm9kZS5vZmZzZXRMZWZ0LCB5OiAwfSk7XHJcbiAgICBkaXNwYXRjaCgnZHJhZ2VuZCcsIHt0YXJnZXQ6IG5vZGUsIGxlZnQ6IG5vZGUucGFyZW50Tm9kZS5vZmZzZXRMZWZ0fSk7XHJcbiAgICBcclxuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUpO1xyXG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBoYW5kbGVNb3VzZXVwKTtcclxuXHR9XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuXHRcdGRlc3Ryb3koKSB7XHJcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcclxuICByZXR1cm4gdG9wID8gYGhlaWdodDogY2FsYygxMDB2aCAtICR7dG9wfXB4KTtgIDogJyc7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwicmVzaXplXCIgdXNlOmRyYWdnYWJsZSBzdHlsZT1cIntyZXNpemUoKX1cIj4gPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5yZXNpemUge1xyXG4gIHdpZHRoOiAycHg7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIGhlaWdodDogY2FsYygxMDB2aCAtIDI3cHgpO1xyXG4gIGJhY2tncm91bmQtY29sb3I6ICNmM2M0OWQ7XHJcbiAgY3Vyc29yOiBjb2wtcmVzaXplO1xyXG4gIHotaW5kZXg6IDU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IHRvcDtcclxuZXhwb3J0IGxldCBsZWZ0O1xyXG5cclxuaW1wb3J0IHtjcmVhdGVFdmVudERpc3BhdGNoZXJ9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCBTcGxpdHRlciBmcm9tICcuL1NwbGl0dGVyLnN2ZWx0ZSc7XHJcblxyXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG5cclxuZnVuY3Rpb24gcmVzaXplKCkge1xyXG4gIGxldCBjc3MgPSBgbGVmdDogJHtsZWZ0fXB4O3dpZHRoOiBjYWxjKDEwMHZ3IC0gJHtsZWZ0fXB4KTtgXHJcbiAgaWYgKHRvcCkge1xyXG4gICAgY3NzICs9IGBoZWlnaHQ6IGNhbGMoMTAwdmggLSAke3RvcH1weCk7YDtcclxuICB9XHJcbiAgcmV0dXJuIGNzcztcclxufVxyXG5cclxuZnVuY3Rpb24gZHJhZ2dlZChlKSB7XHJcbiAgZGlzcGF0Y2goJ2RyYWcnLCAgZS5kZXRhaWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKGUpIHtcclxuICBkaXNwYXRjaCgnZHJhZ2VuZCcsICBlLmRldGFpbCk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidmJveCByaWdodFwiIHN0eWxlPVwie3Jlc2l6ZShsZWZ0KX1cIj5cclxuICA8U3BsaXR0ZXIgb246ZHJhZz17ZHJhZ2dlZH0gb246ZHJhZ2VuZD17ZHJhZ2VuZH0ge3RvcH0vPlxyXG4gIDxzbG90Pjwvc2xvdD5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi52Ym94IHtcclxuICBmbGV4OiBhdXRvO1xyXG4gIGRpc3BsYXk6IGZsZXg7XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbn1cclxuLnZib3gucmlnaHQge1xyXG4gIHJpZ2h0OiAwO1xyXG4gIGxlZnQ6IDE2M3B4O1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBiYWNrZ3JvdW5kOiAjZjFmN2Y3ZTM7XHJcbiAgd2lkdGg6IGNhbGMoMTAwdncgLSAxNjNweCk7XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjdweCk7XHJcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcclxufVxyXG5cclxuXHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBsZWZ0ID0gMDtcclxuXHJcbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcclxuICBsZXQgY3NzID0gJydcclxuICBpZiAobGVmdCkge1xyXG4gICAgY3NzICs9IGB3aWR0aDogY2FsYygxMDB2dyAtICR7bGVmdH1weCk7YFxyXG4gIH1cclxuICByZXR1cm4gY3NzO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRhYmxlIGNsYXNzPVwidGFibGUtaGVhZGVyXCIgc3R5bGU9XCJ7cmVzaXplKGxlZnQpfVwiPlxyXG4gIDx0cj5cclxuICAgIDx0ZD5cclxuICAgICAgPGRpdiBjbGFzcz1cInRkLWhlYWRlclwiPlxyXG4gICAgICAgIDxzbG90Pjwvc2xvdD5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L3RkPlxyXG4gIDwvdHI+XHJcbjwvdGFibGU+XHJcblxyXG48c3R5bGU+XHJcbi50YWJsZS1oZWFkZXIge1xyXG4gIHBvc2l0aW9uOiBmaXhlZDtcclxufVxyXG4udGQtaGVhZGVyIHtcclxuICBwYWRkaW5nLWxlZnQ6IDVweDtcclxufVxyXG50YWJsZSB7XHJcbiAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcclxuICBmb250LWZhbWlseTogIENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXNpemU6IDEycHg7XHJcbiAgd2lkdGg6IDEwMCU7XHJcbn1cclxudGQge1xyXG4gIC8qIGJvcmRlcjogMXB4IHNvbGlkICM5OTk7ICovXHJcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNjMGQ4Y2NhMTtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiBhbGljZWJsdWU7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBMaXN0O1xyXG5leHBvcnQgbGV0IGxlZnQ7XHJcbmV4cG9ydCBsZXQgdGl0bGU7XHJcbmV4cG9ydCBsZXQgZHJhZ2VuZDtcclxuZXhwb3J0IGxldCBzaG93ID0gMTtcclxuZXhwb3J0IGxldCBwcm9wcyA9IHt9O1xyXG5leHBvcnQgbGV0IHRvcCA9IFwiMFwiO1xyXG5cclxuaW1wb3J0IFZCb3ggZnJvbSAnLi4vYm94L1ZCb3guc3ZlbHRlJztcclxuaW1wb3J0IEJTdGF0aWMgZnJvbSAnLi4vYm94L0JTdGF0aWMuc3ZlbHRlJztcclxuaW1wb3J0IEJSZXNpemUgZnJvbSAnLi4vYm94L0JSZXNpemUuc3ZlbHRlJztcclxuaW1wb3J0IEJIZWFkZXIgZnJvbSAnLi4vYm94L0JIZWFkZXIuc3ZlbHRlJztcclxuaW1wb3J0IEJUYWJsZSBmcm9tICcuLi9ib3gvQlRhYmxlLnN2ZWx0ZSc7XHJcbjwvc2NyaXB0PlxyXG5cclxuPFZCb3g+XHJcbiAgPEJTdGF0aWMge3RvcH0+XHJcbiAgICA8QkhlYWRlcj5cclxuICAgICAgeyNpZiB0eXBlb2YgdGl0bGUgPT09ICdzdHJpbmcnfVxyXG4gICAgICAgIHt0aXRsZX1cclxuICAgICAgezplbHNlfVxyXG4gICAgICAgIDxzdmVsdGU6Y29tcG9uZW50IHRoaXM9e3RpdGxlfS8+XHJcbiAgICAgIHsvaWZ9XHJcbiAgICA8L0JIZWFkZXI+XHJcbiAgICA8ZGl2IGNsYXNzPVwiZGV0YWlscy1saXN0XCI+PHN2ZWx0ZTpjb21wb25lbnQgdGhpcz17TGlzdH0gey4uLnByb3BzfS8+PC9kaXY+XHJcbiAgPC9CU3RhdGljPlxyXG4gIHsjaWYgc2hvd31cclxuICA8QlJlc2l6ZSB7bGVmdH0gb246ZHJhZ2VuZD17ZHJhZ2VuZH0ge3RvcH0+XHJcbiAgICA8c2xvdD48L3Nsb3Q+XHJcbiAgPC9CUmVzaXplPlxyXG4gIHsvaWZ9XHJcbjwvVkJveD5cclxuXHJcbjxzdHlsZT5cclxuICAuZGV0YWlscy1saXN0IHtcclxuICAgIG1hcmdpbi10b3A6IDE5cHg7XHJcbiAgICBmb250LWZhbWlseTogQ29uc29sYXMsIEx1Y2lkYSBDb25zb2xlLCBDb3VyaWVyIE5ldywgbW9ub3NwYWNlO1xyXG4gICAgZm9udC1zaXplOiAxMnB4O1xyXG4gIH1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IGVkaXRvcjtcclxuZXhwb3J0IGxldCBzb3VyY2U7XHJcblxyXG5mdW5jdGlvbiBidG5NaW4oKSB7XHJcbiAgY29uc3QgbW9uYWNvID0gd2luZG93Lm1pdG0uZWRpdG9yW2VkaXRvcl1cclxuICBtb25hY28gJiYgbW9uYWNvLnRyaWdnZXIoJ2ZvbGQnLCAnZWRpdG9yLmZvbGRBbGwnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuUGx1cygpIHtcclxuICBjb25zdCBtb25hY28gPSB3aW5kb3cubWl0bS5lZGl0b3JbZWRpdG9yXVxyXG4gIG1vbmFjbyAmJiBtb25hY28udHJpZ2dlcigndW5mb2xkJywgJ2VkaXRvci51bmZvbGRBbGwnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuT3BlbigpIHtcclxuICBjb25zb2xlLmxvZyhzb3VyY2UpO1xyXG4gIHdzX19zZW5kKCdvcGVuRm9sZGVyJywgc291cmNlLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIE9wZW4hJyk7XHJcbiAgfSk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cclxuPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tcGx1c1wiIG9uOmNsaWNrPVwie2J0blBsdXN9XCI+WysrXTwvYnV0dG9uPiAtXHJcbjxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLW9wZW5cIiBkaXNhYmxlZD17c291cmNlLm9wZW5EaXNhYmxlZH0gb246Y2xpY2s9XCJ7YnRuT3Blbn1cIj5PcGVuPC9idXR0b24+IC1cclxuXHJcbjxzdHlsZT5cclxuYnV0dG9uIHtcclxuICBib3JkZXI6IDA7XHJcbiAgcGFkZGluZzogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuLnRsYiB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IEV4YnV0dG9uIGZyb20gJy4uL21vbmFjby9FeGJ1dHRvbi5zdmVsdGUnO1xyXG5cclxuZnVuY3Rpb24gYnRuU2F2ZShlKSB7XHJcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH19ID0gd2luZG93Lm1pdG07XHJcbiAgaWYgKF9yb3V0ZSkge1xyXG4gICAgY29uc3QgY29udGVudCA9IF9yb3V0ZS5nZXRWYWx1ZSgpXHJcbiAgICBzb3VyY2UudXBkYXRlKG4gPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLm4sXHJcbiAgICAgICAgY29udGVudCxcclxuICAgICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgZWRpdGJ1ZmZlcjogY29udGVudFxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgY29uc29sZS5sb2coJHNvdXJjZSk7XHJcbiAgICB3c19fc2VuZCgnc2F2ZVJvdXRlJywgJHNvdXJjZSwgZGF0YSA9PiB7XHJcbiAgICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHsuLi5uLCBzYXZlRGlzYWJsZWQ6IHRydWV9fSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdEb25lIFNhdmUhJyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bnMoaWQpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzW2lkXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJvdXRlLnVybHMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidG5VcmwoaWQpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzWyRzb3VyY2UuaXRlbV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybHMpIHtcclxuICAgIHJldHVybiByb3V0ZS51cmxzW2lkXTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYnRuVGFnKGUpIHtcclxuICBjaHJvbWUudGFicy51cGRhdGUoe3VybDogZS50YXJnZXQuZGF0YXNldC51cmx9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuR28oZSkge1xyXG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUudXJsKSB7XHJcbiAgICBjaHJvbWUudGFicy51cGRhdGUoe3VybDogcm91dGUudXJsfSk7XHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNpZiAkc291cmNlLnBhdGh9XHJcblx0PGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICB7I2VhY2ggYnRucygkc291cmNlLml0ZW0pIGFzIGl0ZW19XHJcbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5UYWd9XCJcclxuICBkYXRhLXVybD1cIntidG5VcmwoaXRlbSl9XCI+e2l0ZW19PC9idXR0b24+IC0gXHJcbiAgey9lYWNofVxyXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLWdvXCIgZGlzYWJsZWQ9eyRzb3VyY2UuZ29EaXNhYmxlZH0gb246Y2xpY2s9XCJ7YnRuR299XCI+R288L2J1dHRvbj4uXHJcbiAgPC9kaXY+XHJcbnsvaWZ9XHJcbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cclxuUGF0aDp7JHNvdXJjZS5wYXRofVxyXG57I2lmICRzb3VyY2UucGF0aH1cclxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxyXG4gIDxFeGJ1dHRvbiBzb3VyY2U9eyRzb3VyY2V9IGVkaXRvcj1cIl9yb3V0ZVwiLz5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1zYXZlXCIgZGlzYWJsZWQ9eyRzb3VyY2Uuc2F2ZURpc2FibGVkfSBvbjpjbGljaz1cIntidG5TYXZlfVwiPlNhdmU8L2J1dHRvbj5cclxuICA8L2Rpdj5cclxuey9pZn1cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi5maWxlLXBhdGgge1xyXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICBmb250LWZhbWlseTogYXV0bztcclxuICBmb250LXNpemU6IDAuOWVtO1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG59XHJcbi5idG4tY29udGFpbmVyIHtcclxuICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgbWFyZ2luLXRvcDogLTFweDtcclxuICBwYWRkaW5nLXJpZ2h0OiA0cHg7XHJcbiAgcGFkZGluZy1ib3R0b206IDNweDtcclxuICByaWdodDogMDtcclxuICB6LWluZGV4OiA1O1xyXG4gIHRvcDogLTJweDtcclxufVxyXG4uYnRuLWNvbnRhaW5lciBidXR0b24ge1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcclxuICBjdXJzb3I6IGF1dG87XHJcbn1cclxuLnRsYiB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG59XHJcbjwvc3R5bGU+IiwiZXhwb3J0IGNvbnN0IGNmZyA9ICB7XHJcbiAgbGFuZ3VhZ2U6ICdqYXZhc2NyaXB0JyxcclxuICAvLyB0aGVtZTogXCJ2cy1kYXJrXCIsXHJcbiAgbWluaW1hcDoge1xyXG4gICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgfSxcclxuICB2YWx1ZTogJycsXHJcbiAgZm9udEZhbWlseTogWydDYXNjYWRpYSBDb2RlJywgJ0NvbnNvbGFzJywgJ0NvdXJpZXIgTmV3JywgJ21vbm9zcGFjZSddLFxyXG4gIGZvbnRMaWdhdHVyZXM6IHRydWUsXHJcbiAgZm9udFNpemU6IDExXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCByZXNpemUgPSBlZGl0b3IgPT4ge1xyXG4gIHJldHVybiBlbnRyaWVzID0+IHtcclxuICAgIGNvbnN0IHt3aWR0aCwgaGVpZ2h0fSA9IGVudHJpZXNbMF0uY29udGVudFJlY3RcclxuICAgIGVkaXRvci5sYXlvdXQoe3dpZHRoLCBoZWlnaHR9KVxyXG4gIH0gIFxyXG59XHJcbiIsIjxzY3JpcHQ+XHJcbiAgaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbiAgaW1wb3J0IHsgY2ZnLCByZXNpemUgfSBmcm9tICcuLi9tb25hY28vaW5pdCc7XHJcblxyXG4gIGV4cG9ydCBsZXQgb25DaGFuZ2U7XHJcblxyXG4gIG9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gICAgZnVuY3Rpb24gaW5pdENvZGVFZGl0b3Ioc3JjKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkIG1vbmFjbzogcm91dGUnKVxyXG4gICAgICBjb25zdCBlbGVtZW50ID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28nKTtcclxuICAgICAgY29uc3QgX3JvdXRlID0gIHdpbmRvdy5tb25hY28uZWRpdG9yLmNyZWF0ZShlbGVtZW50LCBjZmcpO1xyXG4gICAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoX3JvdXRlKSlcclxuICAgICAgcm8ub2JzZXJ2ZShlbGVtZW50KTtcclxuXHJcbiAgICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcm91dGUgPSBfcm91dGU7XHJcbiAgICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcm91dGVFbCA9IGVsZW1lbnQ7XHJcblxyXG4gICAgICBfcm91dGUub25EaWRDaGFuZ2VNb2RlbENvbnRlbnQob25DaGFuZ2UpO1xyXG4gICAgICBfcm91dGUuc2V0VmFsdWUoc3JjKTtcclxuICAgIH1cclxuICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcm91dGVFZGl0ID0gaW5pdENvZGVFZGl0b3I7XHJcbiAgfSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cImVkaXQtY29udGFpbmVyXCI+XHJcbiAgPGRpdiBpZD1cIm1vbmFjb1wiPjwvZGl2PlxyXG48L2Rpdj5cclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3QgcmVyZW5kZXIgPSB3cml0YWJsZSh7XHJcbiAgdG9nZ2xlOiB0cnVlLFxyXG59KVxyXG4iLCJpbXBvcnQgeyByZXJlbmRlciB9IGZyb20gJy4vcmVyZW5kZXIuanMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVybHMgKCkge1xyXG4gIGNvbnNvbGUubG9nKCd1cmxzIGlzIGNhbGxlZCEnKVxyXG4gIHJlcmVuZGVyLnNldCh7XHJcbiAgICB0b2dnbGU6IHRydWVcclxuICB9KVxyXG59XHJcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IGxpc3QgPSB3cml0YWJsZSh7XHJcbiAgcm91dGV6OiBbXVxyXG59KVxyXG5cclxuZXhwb3J0IGNvbnN0IHRhZ3MgPSB3cml0YWJsZSh7XHJcbiAgZmlsdGVyVXJsOiB0cnVlLFxyXG4gIF9fdGFnMToge30sXHJcbiAgX190YWcyOiB7fSxcclxuICBfX3RhZzM6IHt9LFxyXG4gIHJvdXRlOiAnJyxcclxuICB1bmlxOiB0cnVlLFxyXG4gIGxpc3Q6IHRydWVcclxufSlcclxuXHJcbmV4cG9ydCBjb25zdCBldXJscyA9IHdyaXRhYmxlKHtcclxuICBleHBhbmRlZDogZmFsc2VcclxufSlcclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5leHBvcnQgbGV0IGdyb3VwID0gJyc7XHJcbmV4cG9ydCBsZXQgb25DaGFuZ2U7XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGUucHJldmVudERlZmF1bHQoKVxyXG4gIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICBsZXQge2VsZW1lbnR9ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICBjb25zdCB7IGVkaXRvcjogeyBfcm91dGUsIF9yb3V0ZUVkaXQgfSwgZmlsZXMgfSA9IG1pdG07XHJcbiAgY29uc3QgdXJsID0gbWl0bS5yb3V0ZXNbZWxlbWVudF0udXJsO1xyXG4gIGNvbnN0IG9iaiA9IGZpbGVzLnJvdXRlW2VsZW1lbnRdO1xyXG4gIGNvbnNvbGUubG9nKGl0ZW0sIGVsZW1lbnQsIG9iaik7XHJcblxyXG4gIGlmIChfcm91dGU9PT11bmRlZmluZWQpIHtcclxuICAgIF9yb3V0ZUVkaXQob2JqLmNvbnRlbnQpXHJcbiAgfSBlbHNlIHtcclxuICAgIF9yb3V0ZS5zZXRWYWx1ZShvYmouY29udGVudCB8fCAnJyk7XHJcbiAgICBfcm91dGUucmV2ZWFsTGluZSgxKTtcclxuICB9XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBvbkNoYW5nZShmYWxzZSk7XHJcblxyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGdvRGlzYWJsZWQ6ICh1cmw9PT11bmRlZmluZWQpLFxyXG4gICAgICAgIGNvbnRlbnQ6IG9iai5jb250ZW50LFxyXG4gICAgICAgIGZwYXRoOiBvYmouZnBhdGgsXHJcbiAgICAgICAgcGF0aDogb2JqLnBhdGgsXHJcbiAgICAgICAgaXRlbTogZWxlbWVudCxcclxuICAgICAgfVxyXG4gICAgfSwgMSk7XHJcbiAgfSlcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHtncm91cH0geyRzb3VyY2UuZnBhdGg9PT1pdGVtLmZwYXRofVwiXHJcbiAgZGF0YS1lbGVtZW50PXtpdGVtLmVsZW1lbnR9XHJcbiAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXHJcbj57aXRlbS50aXRsZX08L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnRkLWl0ZW0ge1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBwYWRkaW5nOiAwLjFyZW07XHJcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XHJcbiAgcGFkZGluZy1sZWZ0OiAxMHB4O1xyXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzBkOGNjYTE7XHJcbn1cclxuLnRkLWl0ZW0udHJ1ZSB7XHJcbiAgY29sb3I6IGJsdWU7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBiYWNrZ3JvdW5kOiBncmVlbnllbGxvdztcclxuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzM2MzhiZmExO1xyXG59XHJcbmRpdi5jaGlsZCB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG4gIHBhZGRpbmctbGVmdDogMTJweDtcclxuICBiYWNrZ3JvdW5kOiBiZWlnZTtcclxufVxyXG5kaXYuZ3JvdXAge1xyXG4gIGJvcmRlcjogbm9uZTtcclxuICBwYWRkaW5nOiAwO1xyXG4gIG1hcmdpbi1sZWZ0OiA5cHg7XHJcbiAgbWFyZ2luLXRvcDogLTE1cHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBvbkNoYW5nZTtcclxuXHJcbmltcG9ydCB7IHVybHMgfSBmcm9tICcuLi90YWdzL3VybC1kZWJvdW5jZSc7XHJcbmltcG9ydCB7IGxpc3QgfSBmcm9tICcuLi90YWdzL3N0b3Jlcyc7XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcclxuXHJcbmxldCByZXJlbmRlciA9IDA7XHJcbmxldCBkYXRhID0gW107XHJcblxyXG4kOiBfZGF0YSA9IGRhdGE7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcm91dGUvbGlzdCcpO1xyXG4gIF93c19jb25uZWN0LnJvdXRlT25Nb3VudCA9ICgpID0+IHdzX19zZW5kKCdnZXRSb3V0ZScsICcnLCByb3V0ZUhhbmRsZXIpO1xyXG59KTtcclxuXHJcbmNvbnN0IHJvdXRlSGFuZGxlciA9IG9iaiA9PiB7XHJcbiAgY29uc29sZS53YXJuKCd3c19fc2VuZChnZXRSb3V0ZSknLCBvYmopO1xyXG4gIHdpbmRvdy5taXRtLnJvdXRlcyA9IG9iai5yb3V0ZXNcclxuICB3aW5kb3cubWl0bS5yb3V0ZXogPSBvYmoucm91dGV6XHJcbiAgbGlzdC5zZXQoe1xyXG4gICAgLi4uJGxpc3QsXHJcbiAgICByb3V0ZXo6IG9iai5yb3V0ZXpcclxuICB9KVxyXG4gIGNvbnN0IHtyb3V0ZXN9ID0gd2luZG93Lm1pdG1cclxuICBmb3IgKGNvbnN0IGlkIGluIG9iai5yb3V0ZXMpIHtcclxuICAgIGNvbnN0IFtzdWIsIG5zcGFjZV0gPSBpZC5zcGxpdCgnQCcpXHJcbiAgICBpZiAobnNwYWNlKSB7XHJcbiAgICAgIHJvdXRlc1tpZF0uX2NoaWxkbnMgPSByb3V0ZXNbbnNwYWNlXS5fY2hpbGRucyB8fCB7bGlzdDoge30sIF9zdWJuczogJyd9XHJcbiAgICAgIC8vIHJvdXRlc1tpZF0uX3N1Ym5zID0gcm91dGVzW25zcGFjZV0uX3N1Ym5zIHx8ICcnXHJcbiAgICB9ICAgICBcclxuICB9XHJcbiAgaWYgKG9iai5fdGFnc18pIHtcclxuICAgIHdpbmRvdy5taXRtLl9fdGFnMSA9IG9iai5fdGFnc18uX190YWcxO1xyXG4gICAgd2luZG93Lm1pdG0uX190YWcyID0gb2JqLl90YWdzXy5fX3RhZzI7XHJcbiAgICB3aW5kb3cubWl0bS5fX3RhZzMgPSBvYmouX3RhZ3NfLl9fdGFnMztcclxuICAgIHdpbmRvdy5taXRtLl9fdGFnNCA9IG9iai5fdGFnc18uX190YWc0O1xyXG4gICAgd2luZG93Lm1pdG0uX191cmxzID0gb2JqLl90YWdzXy5fX3VybHM7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHVybHMoKSwgMSlcclxuICB9XHJcbiAgaWYgKHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlPT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG9iai5maWxlcztcclxuICAgIGRhdGEgPSBvYmouZmlsZXM7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IHtyb3V0ZX0gPSB3aW5kb3cubWl0bS5maWxlcztcclxuICAgIGNvbnN0IHtmaWxlc30gPSBvYmo7XHJcbiAgICBjb25zdCBuZXdSb3V0ZSA9IHt9O1xyXG4gICAgZm9yIChsZXQgayBpbiBmaWxlcykge1xyXG4gICAgICBuZXdSb3V0ZVtrXSA9IHJvdXRlW2tdID8gcm91dGVba10gOiBmaWxlc1trXTtcclxuICAgICAgbmV3Um91dGVba10uY29udGVudCA9IGZpbGVzW2tdLmNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBkYXRhID0gbmV3Um91dGU7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5yb3V0ZSA9IG5ld1JvdXRlXHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgcmVjZWl2aW5nIHdzIHBhY2tldFxyXG4gICAqIGllOiB3aW5kb3cubWl0bS5maWxlcy5nZXRSb3V0ZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XHJcbiAgICovXHJcbiAgY29uc3Qge2dldFJvdXRlX2V2ZW50c30gPSB3aW5kb3cubWl0bS5maWxlcztcclxuICBmb3IgKGxldCBrZXkgaW4gZ2V0Um91dGVfZXZlbnRzKSB7XHJcbiAgICBnZXRSb3V0ZV9ldmVudHNba2V5XShkYXRhKTtcclxuICB9XHJcbiAgcmVyZW5kZXIgPSByZXJlbmRlciArIDE7XHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cy5yb3V0ZVRhYmxlID0gKCkgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCdyb3V0ZVRhYmxlIGdldHRpbmcgY2FsbGVkISEhJyk7XHJcbiAgd2luZG93LndzX19zZW5kKCdnZXRSb3V0ZScsICcnLCByb3V0ZUhhbmRsZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB4bGlzdChhbGwpIHtcclxuICByZXR1cm4gT2JqZWN0LmtleXMoX2RhdGEpLmZpbHRlcih4ID0+ICF4Lm1hdGNoKCdAJykpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoaWxkcyhpdGVtKSB7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbaXRlbV1cclxuICByZXR1cm4gT2JqZWN0LmtleXMocm91dGUuX2NoaWxkbnMubGlzdClcclxufVxyXG5cclxuZnVuY3Rpb24gaXNHcm91cChpdGVtKSB7XHJcbiAgY29uc3Qgcm91dGUgPSB3aW5kb3cubWl0bS5yb3V0ZXNbaXRlbV1cclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhyb3V0ZS5fY2hpbGRucy5saXN0KVxyXG4gIHJldHVybiBhcnIubGVuZ3RoXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG57I2VhY2ggeGxpc3QoX2RhdGEpIGFzIGl0ZW19XHJcbiAgeyNpZiBpc0dyb3VwKGl0ZW0pfVxyXG4gIDxkZXRhaWxzPlxyXG4gICAgPHN1bW1hcnkgY2xhc3M9XCJzcGFjZTFcIj5cclxuICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtLCAuLi5fZGF0YVtpdGVtXX19IHtvbkNoYW5nZX0gZ3JvdXA9XCJncm91cFwiLz5cclxuICAgIDwvc3VtbWFyeT5cclxuICAgIHsjZWFjaCBjaGlsZHMoaXRlbSkgYXMgaXRlbTJ9XHJcbiAgICAgIDxJdGVtIGl0ZW09e3tlbGVtZW50OiBpdGVtMiwgLi4uX2RhdGFbaXRlbTJdfX0ge29uQ2hhbmdlfSBncm91cD1cImNoaWxkXCIvPlxyXG4gICAgey9lYWNofVxyXG4gIDwvZGV0YWlscz5cclxuICB7OmVsc2V9XHJcbiAgICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSB7b25DaGFuZ2V9Lz5cclxuICB7L2lmfVxyXG57L2VhY2h9XHJcblxyXG48c3R5bGU+XHJcbnN1bW1hcnkge1xyXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzBkOGNjYTE7XHJcbiAgcGFkZGluZy1sZWZ0OiAycHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxuaW1wb3J0IFZCb3gyIGZyb20gJy4uL2JveC9WQm94Mi5zdmVsdGUnO1xyXG5pbXBvcnQgQnV0dG9uIGZyb20gJy4vQnV0dG9uLnN2ZWx0ZSc7XHJcbmltcG9ydCBFZGl0b3IgZnJvbSAnLi9FZGl0b3Iuc3ZlbHRlJztcclxuaW1wb3J0IExpc3QgZnJvbSAnLi9MaXN0LnN2ZWx0ZSc7XHJcblxyXG5sZXQgbGVmdCA9IDE2NTtcclxuY29uc3QgdG9wID0gJzQ3JztcclxuY29uc3QgdGl0bGUgPSAnLVJvdXRlKHMpLScgXHJcbmNvbnN0IGlkID0gJ3JvdXRlTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcm91dGUvaW5kZXgnKTtcclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoaWQsIGZ1bmN0aW9uKG9wdCkge1xyXG4gICAgb3B0W2lkXSAmJiAobGVmdCA9IG9wdFtpZF0pXHJcbiAgfSk7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gZHJhZ2VuZCh7ZGV0YWlsfSkge1xyXG4gIGxlZnQgPSBkZXRhaWwubGVmdFxyXG4gIGNvbnN0IGRhdGEgPSB7fVxyXG4gIGRhdGFbaWRdID0gbGVmdFxyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldChkYXRhKVxyXG59XHJcblxyXG5sZXQgX3RpbWVvdXQgPSBudWxsO1xyXG5mdW5jdGlvbiBvbkNoYW5nZShlKSB7XHJcbiAgY29uc3QgeyBlZGl0b3I6IHsgX3JvdXRlIH19ID0gd2luZG93Lm1pdG07XHJcbiAgbGV0IHNhdmVEaXNhYmxlZDtcclxuICBpZiAoZT09PWZhbHNlKSB7XHJcbiAgICBzYXZlRGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xyXG4gICAgICAuLi5uLFxyXG4gICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgIGVkaXRidWZmZXI6IF9yb3V0ZS5nZXRWYWx1ZSgpXHJcbiAgICB9fSlcclxuICB9XHJcbiAgX3RpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KF90aW1lb3V0KTtcclxuICBfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgaWYgKF9yb3V0ZSl7XHJcbiAgICAgIHNhdmVEaXNhYmxlZCA9IChfcm91dGUuZ2V0VmFsdWUoKT09PSRzb3VyY2UuZWRpdGJ1ZmZlcilcclxuICAgICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xyXG4gICAgICAgIC4uLm4sXHJcbiAgICAgICAgc2F2ZURpc2FibGVkXHJcbiAgICAgIH19KTtcclxuICAgICAgY29uc29sZS5sb2coZSk7XHJcbiAgICB9XHJcbiAgfSwgNTAwKSAgXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48QnV0dG9uLz5cclxuPFZCb3gyIHt0aXRsZX0ge3RvcH0ge2xlZnR9IHtkcmFnZW5kfSB7TGlzdH0gcHJvcHM9e3tvbkNoYW5nZX19PlxyXG4gIDxFZGl0b3Ige29uQ2hhbmdlfS8+XHJcbjwvVkJveDI+XHJcbiIsIi8vIGZlYXQ6IHByb2ZpbGVcclxuaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3Qgc291cmNlID0gd3JpdGFibGUoe1xyXG4gIG9wZW5EaXNhYmxlZDogZmFsc2UsXHJcbiAgc2F2ZURpc2FibGVkOiB0cnVlLFxyXG4gIGdvRGlzYWJsZWQ6IHRydWUsXHJcbiAgY29udGVudDogJycsXHJcbiAgZnBhdGg6ICcnLFxyXG4gIHBhdGg6ICcnXHJcbn0pXHJcbiIsIjxzY3JpcHQ+Ly8gZmVhdDogcHJvZmlsZVxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBFeGJ1dHRvbiBmcm9tICcuLi9tb25hY28vRXhidXR0b24uc3ZlbHRlJztcclxuXHJcbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xyXG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlIH19ID0gd2luZG93Lm1pdG07XHJcbiAgaWYgKF9wcm9maWxlKSB7XHJcbiAgICBjb25zdCBjb250ZW50ID0gX3Byb2ZpbGUuZ2V0VmFsdWUoKVxyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGNvbnRlbnQsXHJcbiAgICAgICAgc2F2ZURpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgIGVkaXRidWZmZXI6IGNvbnRlbnRcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGNvbnNvbGUubG9nKCRzb3VyY2UpO1xyXG4gICAgd3NfX3NlbmQoJ3NhdmVQcm9maWxlJywgJHNvdXJjZSwgZGF0YSA9PiB7XHJcbiAgICAgIHNvdXJjZS51cGRhdGUobiA9PiB7cmV0dXJuIHsuLi5uLCBzYXZlRGlzYWJsZWQ6IHRydWV9fSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdEb25lIFNhdmUhJyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XHJcbiAgY29uc29sZS5sb2coJHNvdXJjZSk7XHJcbiAgd3NfX3NlbmQoJ29wZW5Gb2xkZXInLCAkc291cmNlLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIE9wZW4hJyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bnMoaWQpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzW2lkXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUudXJscykge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHJvdXRlLnVybHMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidG5VcmwoaWQpIHtcclxuICBjb25zdCByb3V0ZSA9IG1pdG0ucm91dGVzWyRzb3VyY2UuaXRlbV07XHJcbiAgaWYgKHJvdXRlICYmIHJvdXRlLnVybHMpIHtcclxuICAgIHJldHVybiByb3V0ZS51cmxzW2lkXTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYnRuVGFnKGUpIHtcclxuICBjaHJvbWUudGFicy51cGRhdGUoe3VybDogZS50YXJnZXQuZGF0YXNldC51cmx9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuR28oZSkge1xyXG4gIGNvbnN0IHJvdXRlID0gbWl0bS5yb3V0ZXNbJHNvdXJjZS5pdGVtXTtcclxuICBpZiAocm91dGUgJiYgcm91dGUudXJsKSB7XHJcbiAgICBjaHJvbWUudGFicy51cGRhdGUoe3VybDogcm91dGUudXJsfSk7XHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNpZiAkc291cmNlLnBhdGh9XHJcblx0PGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICB7I2VhY2ggYnRucygkc291cmNlLml0ZW0pIGFzIGl0ZW19XHJcbiAgPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBvbjpjbGljaz1cIntidG5UYWd9XCJcclxuICBkYXRhLXVybD1cIntidG5VcmwoaXRlbSl9XCI+e2l0ZW19PC9idXR0b24+XHJcbiAgey9lYWNofVxyXG4gIDwhLS0gPGJ1dHRvbiBjbGFzcz1cInRsYiBidG4tZ29cIiBkaXNhYmxlZD17JHNvdXJjZS5nb0Rpc2FibGVkfSBvbjpjbGljaz1cIntidG5Hb31cIj5HbzwvYnV0dG9uPi4gLS0+XHJcbiAgPC9kaXY+XHJcbnsvaWZ9XHJcbjxkaXYgY2xhc3M9XCJmaWxlLXBhdGhcIj5cclxuUGF0aDp7JHNvdXJjZS5wYXRofVxyXG57I2lmICRzb3VyY2UucGF0aH1cclxuXHQ8ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxyXG4gIDxFeGJ1dHRvbiBzb3VyY2U9eyRzb3VyY2V9IGVkaXRvcj1cIl9wcm9maWxlXCIvPlxyXG4gIDxidXR0b24gY2xhc3M9XCJ0bGIgYnRuLXNhdmVcIiBkaXNhYmxlZD17JHNvdXJjZS5zYXZlRGlzYWJsZWR9IG9uOmNsaWNrPVwie2J0blNhdmV9XCI+U2F2ZTwvYnV0dG9uPlxyXG4gIDwvZGl2PlxyXG57L2lmfVxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLmZpbGUtcGF0aCB7XHJcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gIGZvbnQtZmFtaWx5OiBhdXRvO1xyXG4gIGZvbnQtc2l6ZTogMC45ZW07XHJcbiAgY29sb3I6IGJsdWU7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIge1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBtYXJnaW4tdG9wOiAtMXB4O1xyXG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcclxuICBwYWRkaW5nLWJvdHRvbTogM3B4O1xyXG4gIHJpZ2h0OiAwO1xyXG4gIHotaW5kZXg6IDU7XHJcbiAgdG9wOiAtMnB4O1xyXG59XHJcbi5idG4tY29udGFpbmVyIGJ1dHRvbiB7XHJcbiAgZm9udC1zaXplOiAxMHB4O1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxufVxyXG4uYnRuLWNvbnRhaW5lciBidXR0b246ZGlzYWJsZWQge1xyXG4gIGN1cnNvcjogYXV0bztcclxufVxyXG4udGxiIHtcclxuICBib3JkZXI6IG5vbmU7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG4gIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG4gIGltcG9ydCB7IGNmZywgcmVzaXplIH0gZnJvbSAnLi4vbW9uYWNvL2luaXQnO1xyXG5cclxuICBleHBvcnQgbGV0IG9uQ2hhbmdlO1xyXG5cclxuICBvbk1vdW50KGFzeW5jICgpID0+IHtcclxuICAgIGZ1bmN0aW9uIGluaXRDb2RlRWRpdG9yKHNyYykge1xyXG4gICAgICBjb25zb2xlLmxvZygnbG9hZCBtb25hY286IHByb2ZpbGUnKVxyXG4gICAgICBjb25zdCBlbGVtZW50ID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9maWxlJyk7XHJcbiAgICAgIGNvbnN0IF9wcm9maWxlID0gIHdpbmRvdy5tb25hY28uZWRpdG9yLmNyZWF0ZShlbGVtZW50LCBjZmcpO1xyXG4gICAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoX3Byb2ZpbGUpKVxyXG4gICAgICByby5vYnNlcnZlKGVsZW1lbnQpO1xyXG5cclxuICAgICAgd2luZG93Lm1pdG0uZWRpdG9yLl9wcm9maWxlID0gX3Byb2ZpbGU7XHJcbiAgICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVsID0gZWxlbWVudDtcclxuXHJcbiAgICAgIF9wcm9maWxlLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KG9uQ2hhbmdlKTtcclxuICAgICAgX3Byb2ZpbGUuc2V0VmFsdWUoc3JjKTtcclxuICAgIH1cclxuICAgIHdpbmRvdy5taXRtLmVkaXRvci5fcHJvZmlsZUVkaXQgPSBpbml0Q29kZUVkaXRvcjtcclxuICB9KTtcclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwiZWRpdC1jb250YWluZXJcIj5cclxuICA8ZGl2IGlkPVwicHJvZmlsZVwiPlxyXG4gIDwvZGl2PlxyXG48L2Rpdj5cclxuIiwiPHNjcmlwdD4gLy8gZmVhdDogcHJvZmlsZVxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW07XHJcbmV4cG9ydCBsZXQgb25DaGFuZ2U7XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGxldCB7aXRlbX0gPSBlLnRhcmdldC5kYXRhc2V0O1xyXG4gIGNvbnN0IHsgZWRpdG9yOiB7IF9wcm9maWxlLCBfcHJvZmlsZUVkaXQgfSwgZmlsZXMgfSA9IG1pdG07XHJcbiAgY29uc3Qgb2JqID0gZmlsZXMucHJvZmlsZVtpdGVtXTtcclxuICBjb25zdCB1cmwgPSBpdGVtO1xyXG4gIGNvbnNvbGUubG9nKGl0ZW0sIG9iaik7XHJcblxyXG4gIGlmIChfcHJvZmlsZT09PXVuZGVmaW5lZCkge1xyXG4gICAgX3Byb2ZpbGVFZGl0KG9iai5jb250ZW50KTtcclxuICB9IGVsc2Uge1xyXG4gICAgX3Byb2ZpbGUuc2V0VmFsdWUob2JqLmNvbnRlbnQgfHwgJycpO1xyXG4gICAgX3Byb2ZpbGUucmV2ZWFsTGluZSgxKTtcclxuICB9XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBvbkNoYW5nZShmYWxzZSk7XHJcblxyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5uLFxyXG4gICAgICAgIGdvRGlzYWJsZWQ6ICh1cmw9PT11bmRlZmluZWQpLFxyXG4gICAgICAgIGNvbnRlbnQ6IG9iai5jb250ZW50LFxyXG4gICAgICAgIGZwYXRoOiBvYmouZnBhdGgsXHJcbiAgICAgICAgcGF0aDogb2JqLnBhdGgsXHJcbiAgICAgICAgaXRlbSxcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSwgMSk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidGQtaXRlbSB7JHNvdXJjZS5mcGF0aD09PWl0ZW0uZnBhdGh9XCJcclxuICBkYXRhLWl0ZW09e2l0ZW0uZWxlbWVudH1cclxuICBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuPntpdGVtLnRpdGxlfTwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udGQtaXRlbSB7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIHBhZGRpbmc6IDAuMXJlbTtcclxuICBsaW5lLWhlaWdodDogMTVweDtcclxuICBwYWRkaW5nLWxlZnQ6IDVweDtcclxuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2MwZDhjY2ExO1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBvbkNoYW5nZTtcclxuXHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgSXRlbSBmcm9tICcuL0l0ZW0uc3ZlbHRlJztcclxuXHJcbmxldCByZXJlbmRlciA9IDA7XHJcbmxldCBkYXRhID0gW107XHJcblxyXG4kOiBfZGF0YSA9IGRhdGE7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcHJvZmlsZS9saXN0Jyk7XHJcbiAgX3dzX2Nvbm5lY3QucHJvZmlsZU9uTW91bnQgPSAoKSA9PiB3c19fc2VuZCgnZ2V0UHJvZmlsZScsICcnLCBwcm9maWxlSGFuZGxlcik7XHJcbn0pO1xyXG5cclxuY29uc3QgcHJvZmlsZUhhbmRsZXIgPSBvYmogPT4ge1xyXG4gIGNvbnNvbGUud2Fybignd3NfX3NlbmQoZ2V0UHJvZmlsZSknLCBvYmopO1xyXG4gIGlmICh3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlPT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlID0gb2JqO1xyXG4gICAgZGF0YSA9IG9iajtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3Qge3Byb2ZpbGV9ID0gd2luZG93Lm1pdG0uZmlsZXM7XHJcbiAgICBjb25zdCBuZXdwcm9maWxlID0ge307XHJcbiAgICBmb3IgKGxldCBrIGluIG9iaikge1xyXG4gICAgICBuZXdwcm9maWxlW2tdID0gcHJvZmlsZVtrXSA/IHByb2ZpbGVba10gOiBvYmpba107XHJcbiAgICAgIG5ld3Byb2ZpbGVba10uY29udGVudCA9IG9ialtrXS5jb250ZW50O1xyXG4gICAgfVxyXG4gICAgZGF0YSA9IG5ld3Byb2ZpbGU7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5wcm9maWxlID0gbmV3cHJvZmlsZVxyXG4gIH1cclxuICAvKipcclxuICAgKiBldmVudCBoYW5kbGVyIGFmdGVyIHJlY2VpdmluZyB3cyBwYWNrZXRcclxuICAgKiBpZTogd2luZG93Lm1pdG0uZmlsZXMuZ2V0UHJvZmlsZV9ldmVudHMgPSB7ZXZlbnRPYmplY3QuLi59XHJcbiAgICovXHJcbiAgY29uc3Qge2dldFByb2ZpbGVfZXZlbnRzfSA9IHdpbmRvdy5taXRtLmZpbGVzO1xyXG4gIGZvciAobGV0IGtleSBpbiBnZXRQcm9maWxlX2V2ZW50cykge1xyXG4gICAgZ2V0UHJvZmlsZV9ldmVudHNba2V5XShkYXRhKTtcclxuICB9XHJcbiAgcmVyZW5kZXIgPSByZXJlbmRlciArIDE7XHJcbn1cclxuXHJcbndpbmRvdy5taXRtLmZpbGVzLnByb2ZpbGVfZXZlbnRzLnByb2ZpbGVUYWJsZSA9ICgpID0+IHtcclxuICBjb25zb2xlLmxvZygncHJvZmlsZVRhYmxlIGdldHRpbmcgY2FsbGVkISEhJyk7XHJcbiAgd2luZG93LndzX19zZW5kKCdnZXRQcm9maWxlJywgJycsIHByb2ZpbGVIYW5kbGVyKTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YSkgYXMgaXRlbX1cclxuICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFbaXRlbV19fSB7b25DaGFuZ2V9Lz5cclxuey9lYWNofVxyXG4iLCI8c2NyaXB0PiAvLyBmZWF0OiBwcm9maWxlXHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XHJcbmltcG9ydCBCdXR0b24gZnJvbSAnLi9CdXR0b24uc3ZlbHRlJztcclxuaW1wb3J0IEVkaXRvciBmcm9tICcuL0VkaXRvci5zdmVsdGUnO1xyXG5pbXBvcnQgTGlzdCBmcm9tICcuL0xpc3Quc3ZlbHRlJztcclxuXHJcbmxldCBsZWZ0ID0gMTY1O1xyXG5jb25zdCB0b3AgPSAnNDcnO1xyXG5jb25zdCB0aXRsZSA9ICctUHJvZmlsZShzKS0nIFxyXG5jb25zdCBpZCA9ICdwcm9maWxlTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgcHJvZmlsZS9pbmRleCcpO1xyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XHJcbiAgICBvcHRbaWRdICYmIChsZWZ0ID0gb3B0W2lkXSlcclxuICB9KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XHJcbiAgY29uc3QgZGF0YSA9IHt9XHJcbiAgZGF0YVtpZF0gPSBsZWZ0XHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXHJcbn1cclxuXHJcbmxldCBfdGltZW91dCA9IG51bGw7XHJcbmZ1bmN0aW9uIG9uQ2hhbmdlKGUpIHtcclxuICBjb25zdCB7IGVkaXRvcjogeyBfcHJvZmlsZSB9fSA9IHdpbmRvdy5taXRtO1xyXG4gIGxldCBzYXZlRGlzYWJsZWQ7XHJcbiAgaWYgKGU9PT1mYWxzZSkge1xyXG4gICAgc291cmNlLnVwZGF0ZShuID0+IHtyZXR1cm4ge1xyXG4gICAgICAuLi5uLFxyXG4gICAgICBzYXZlRGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgIGVkaXRidWZmZXI6IF9wcm9maWxlLmdldFZhbHVlKClcclxuICAgIH19KVxyXG4gICAgXHJcbiAgfVxyXG4gIF90aW1lb3V0ICYmIGNsZWFyVGltZW91dChfdGltZW91dCk7XHJcbiAgX3RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGlmIChfcHJvZmlsZSl7XHJcbiAgICAgIHNhdmVEaXNhYmxlZCA9IChfcHJvZmlsZS5nZXRWYWx1ZSgpPT09JHNvdXJjZS5lZGl0YnVmZmVyKVxyXG4gICAgICBzb3VyY2UudXBkYXRlKG4gPT4ge3JldHVybiB7XHJcbiAgICAgICAgLi4ubixcclxuICAgICAgICBzYXZlRGlzYWJsZWRcclxuICAgICAgfX0pO1xyXG4gICAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgIH1cclxuICB9LCA1MDApICBcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24vPlxyXG48VkJveDIge3RpdGxlfSB7dG9wfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fSBwcm9wcz17e29uQ2hhbmdlfX0+XHJcbiAgPEVkaXRvciB7b25DaGFuZ2V9Lz5cclxuPC9WQm94Mj5cclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3QgbG9nc3RvcmUgPSB3cml0YWJsZSh7XHJcbiAgcmVzcEhlYWRlcjoge30sXHJcbiAgcmVzcG9uc2U6ICcnLFxyXG4gIGhlYWRlcnM6ICcnLFxyXG4gIGxvZ2lkOiAnJyxcclxuICB0aXRsZTogJycsXHJcbiAgcGF0aDogJycsXHJcbiAgdXJsOiAnJyxcclxuICBleHQ6ICcnXHJcbn0pXHJcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IGNsaWVudCA9IHdyaXRhYmxlKHtcclxuICAuLi53aW5kb3cubWl0bS5jbGllbnRcclxufSlcclxuIiwiaW1wb3J0IHsgd3JpdGFibGUgfSBmcm9tICdzdmVsdGUvc3RvcmUnXHJcblxyXG5leHBvcnQgY29uc3Qgc3RhdGVzID0gd3JpdGFibGUoe1xyXG4gIGNoZXZyb246ICdbPj5dJyxcclxuICBzdGF0ZTI6IHt9LFxyXG4gIHN0YXRlMzoge30sXHJcbn0pXHJcbiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgcTtcclxuZXhwb3J0IGxldCBuYW1lO1xyXG5pbXBvcnQgeyBzdGF0ZXMgfSBmcm9tICcuL3N0YXRlcy5qcyc7XHJcbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSc7XHJcblxyXG5jb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG5cclxuZnVuY3Rpb24gYnRuQ2xvc2UoZSkge1xyXG4gIGNvbnN0IGFsbCA9IHsuLi4kc3RhdGVzfVxyXG4gIGFsbFtuYW1lXVtxXSA9IGZhbHNlXHJcbiAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAke3F9IGRldGFpbHNbb3Blbl1gKVxyXG4gIG5vZGVzLmZvckVhY2gobm9kZSA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpKVxyXG4gIHN0YXRlcy5zZXQoYWxsKVxyXG4gIGRpc3BhdGNoKCdtZXNzYWdlJywge2FsbCwgbmFtZX0pIC8vIGZlYXQ6IGF1dG8gY29sbGFwc2VkIGJldHdlZW4gdGFnMiAmIHRhZzNcclxuXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48YnV0dG9uIGNsYXNzPVwiY29sbGFwc2VcIiBvbjpjbGljaz1cIntidG5DbG9zZX1cIj5bLV08L2J1dHRvbj5cclxuXHJcbjxzdHlsZT5cclxuYnV0dG9uIHtcclxuICBib3JkZXI6IDA7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIGNvbG9yOiAjMDAyYWZmO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgbWFyZ2luLXJpZ2h0OiAtNXB4O1xyXG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgcGFkZGluZzogMXB4IDFweCAycHggMXB4O1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IHE7XHJcbmV4cG9ydCBsZXQgbmFtZTtcclxuaW1wb3J0IHsgc3RhdGVzIH0gZnJvbSAnLi9zdGF0ZXMuanMnO1xyXG5pbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnO1xyXG5cclxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oZSkge1xyXG4gIGNvbnN0IGFsbCA9IHsuLi4kc3RhdGVzfVxyXG4gIGFsbFtuYW1lXVtxXSA9ICFhbGxbbmFtZV1bcV1cclxuICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCR7cX0gZGV0YWlsc2ApXHJcbiAgaWYgKGFsbFtuYW1lXVtxXSkge1xyXG4gICAgbm9kZXMuZm9yRWFjaChub2RlID0+IG5vZGUuc2V0QXR0cmlidXRlKCdvcGVuJywgJycpKVxyXG4gIH0gZWxzZSB7XHJcbiAgICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4gbm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKSlcclxuICB9XHJcbiAgc3RhdGVzLnNldChhbGwpXHJcbiAgZGlzcGF0Y2goJ21lc3NhZ2UnLCB7YWxsLCBuYW1lfSkgLy8gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnM1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGJ1dHRvbiBvbjpjbGljayBjbGFzcz1cImV4cGFuZFwiIG9uOmNsaWNrPVwie2J0bk9wZW59XCI+WzxiPis8L2I+XTwvYnV0dG9uPlxyXG5cclxuPHN0eWxlPlxyXG5idXR0b24ge1xyXG4gIGJvcmRlcjogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgY29sb3I6ICMwMDJhZmY7XHJcbiAgbWFyZ2luLXRvcDogLTFweDtcclxuICBtYXJnaW4tcmlnaHQ6IC01cHg7XHJcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcclxuICBwYWRkaW5nOiAxcHggMXB4IDJweCAxcHg7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogNzAwO1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCAgQ29sbGFwc2UgZnJvbSAnLi4vYnV0dG9uL0NvbGxhcHNlLnN2ZWx0ZSc7XHJcbmltcG9ydCAgRXhwYW5kIGZyb20gJy4uL2J1dHRvbi9FeHBhbmQuc3ZlbHRlJztcclxubGV0IHN0ID0ge1xyXG4gIGNvbGxhcHNlOiB0cnVlLFxyXG4gIGV4cGFuZDogZmFsc2VcclxufTtcclxuXHJcbmZ1bmN0aW9uIGJ0bkNsZWFyKGUpIHtcclxuICBjb25zdCBkYXRhID0ge31cclxuICBjb25zdCBhcnIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzdW1tYXJ5LnRydWUnKTtcclxuICBpZiAoYXJyLmxlbmd0aCkge1xyXG4gICAgY29uc3QgZm9sZGVycyA9IFtdXHJcbiAgICBmb3IgKGxldCBub2RlIG9mIGFycikge1xyXG4gICAgICBmb2xkZXJzLnB1c2gobm9kZS5kYXRhc2V0LnBhdGgpXHJcbiAgICB9XHJcbiAgICBkYXRhLmZvbGRlcnMgPSBmb2xkZXJzXHJcbiAgfVxyXG4gIHdzX19zZW5kKCdjbGVhckxvZ3MnLCBkYXRhLCBkYXRhID0+IHtcclxuICAgIC8vIGxvZ3MgdmlldyB3aWxsIGJlIGNsb3NlIHdoZW4gLmxvZ19ldmVudHMuTG9nc1RhYmxlXHJcbiAgICAvLyBsb2dzdG9yZS5zZXQoKSB0byBlbXB0eSBvbiBUYWJsZS5zdmVsdGUgXHJcbiAgICB3aW5kb3cubWl0bS5jbGllbnQuY2xlYXIgPSB0cnVlO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgQ2xlYXIhJyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvb2dsZShwcm9wKSB7XHJcbiAgY2xpZW50LnVwZGF0ZShuID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIC4uLiRjbGllbnQsXHJcbiAgICAgIC4uLnByb3AsXHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgY29uc29sZS5sb2coJGNsaWVudCk7XHJcbiAgd3NfX3NlbmQoJ3NldENsaWVudCcsIHsuLi5wcm9wfSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBjaGFuZ2Ugc3RhdGUnLCBkYXRhKTtcclxuICAgIHdpbmRvdy5taXRtLmNsaWVudCA9IGRhdGE7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bkhvc3Rzd2NoKGUpIHtcclxuICB0b29nbGUoe25vaG9zdGxvZ3M6ICFlLnRhcmdldC5jaGVja2VkfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bkFyZ3N3Y2goZSkge1xyXG4gIHRvb2dsZSh7bm9hcmdsb2dzOiAhZS50YXJnZXQuY2hlY2tlZH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBob3N0ZmxhZygpIHtcclxuICByZXR1cm4gIXdpbmRvdy5taXRtLmNsaWVudC5ub2hvc3Rsb2dzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhcmdzZmxhZygpIHtcclxuICByZXR1cm4gIXdpbmRvdy5taXRtLmNsaWVudC5ub2FyZ2xvZ3M7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiIHN0eWxlPVwidG9wOiAxcHg7XCI+XHJcbiAgPGlucHV0IGNsYXNzPVwic3RvcFwiIG9uOmNsaWNrPVwie2J0bkNsZWFyfVwiIHR5cGU9XCJpbWFnZVwiIHNyYz1cImltYWdlcy9zdG9wLnN2Z1wiIGFsdD1cIlwiLz5cclxuICA8Q29sbGFwc2Uge3N0fSBxPVwiI2xpc3QtbG9nc1wiPjwvQ29sbGFwc2U+XHJcbiAgPEV4cGFuZCB7c3R9IHE9XCIjbGlzdC1sb2dzXCI+PC9FeHBhbmQ+XHJcbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj5cclxuICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBvbjpjbGljaz17YnRuSG9zdHN3Y2h9IGNoZWNrZWQ9e2hvc3RmbGFnKCl9Pmhvc3RcclxuICA8L2xhYmVsPlxyXG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XHJcbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0bkFyZ3N3Y2h9IGNoZWNrZWQ9e2FyZ3NmbGFnKCl9PmFyZ3NcclxuICA8L2xhYmVsPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLmJ0bi1jb250YWluZXIge1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICBtYXJnaW4tdG9wOiAtMXB4O1xyXG4gIGxlZnQ6IDQ4cHg7XHJcbiAgdG9wOiAtM3B4O1xyXG59XHJcbi5jaGVja2JveCB7XHJcbiAgdmVydGljYWwtYWxpZ246IHRvcDtcclxuICBwYWRkaW5nLXRvcDogMnB4O1xyXG59XHJcbi5jaGVja2JveCBpbnB1dCB7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIG1hcmdpbi1yaWdodDogMnB4O1xyXG4gIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XHJcbn1cclxuaW5wdXQuc3RvcCB7XHJcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gIG1hcmdpbi1yaWdodDogMTBweDtcclxuICB0b3A6IDEuNXB4O1xyXG4gIGxlZnQ6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5cclxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gJy4uL290aGVyL3N0b3Jlcy5qcyc7XHJcblxyXG5jb25zdCBtID0ge1xyXG4gIFBPU1Q6ICAncG9zdCcsXHJcbiAgUFVUOiAgICdwdXQgJyxcclxuICBHRVQ6ICAgJ2dldCAnLFxyXG4gIERFTEVURTonZGVsICcsXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVtcHR5KCkge1xyXG4gIGxvZ3N0b3JlLnNldCh7XHJcbiAgICByZXNwSGVhZGVyOiB7fSxcclxuICAgIHJlc3BvbnNlOiAnJyxcclxuICAgIGhlYWRlcnM6ICcnLFxyXG4gICAgbG9naWQ6ICcnLFxyXG4gICAgdGl0bGU6ICcnLFxyXG4gICAgcGF0aDogJycsXHJcbiAgICB1cmw6ICcnLFxyXG4gICAgZXh0OiAnJyxcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGxldCB7bG9naWR9ID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQ7XHJcbiAgaWYgKGxvZ2lkPT09JGxvZ3N0b3JlLmxvZ2lkKSB7XHJcbiAgICBlbXB0eSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBlbXB0eSgpO1xyXG4gICAgY29uc3QgbyA9IHdpbmRvdy5taXRtLmZpbGVzLmxvZ1tpdGVtLmtleV1bbG9naWRdO1xyXG4gICAgY29uc3Qgc3JjID0ge1xyXG4gICAgICByZXNwSGVhZGVyOiBvLnJlc3BIZWFkZXIsXHJcbiAgICAgIHJlc3BvbnNlOiAnPGVtcHR5PicsXHJcbiAgICAgIGhlYWRlcnM6ICc8ZW1wdHk+JyxcclxuICAgICAgbG9naWQ6IGxvZ2lkLFxyXG4gICAgICB0aXRsZTogby50aXRsZSxcclxuICAgICAgcGF0aDogby5wYXRoLFxyXG4gICAgICB1cmw6IGxvZ2lkLnJlcGxhY2UoL14uK1xcLm1pdG0tcGxheS8sJ2h0dHBzOi8vbG9jYWxob3N0OjMwMDEnKSxcclxuICAgICAgZXh0OiBvLmV4dCxcclxuICAgIH1cclxuICAgIGlmIChvLnRpdGxlLm1hdGNoKCcucG5nJykpIHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgbG9nc3RvcmUudXBkYXRlKG4gPT4gc3JjKVxyXG4gICAgICB9LCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdzX19zZW5kKCdnZXRDb250ZW50Jywge2ZwYXRoOiBsb2dpZH0sICh7aGVhZGVycywgcmVzcG9uc2UsIGV4dH0pID0+IHtcclxuICAgICAgICBsb2dzdG9yZS51cGRhdGUobiA9PiB7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAuLi5zcmMsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICBoZWFkZXJzLFxyXG4gICAgICAgICAgICBleHQsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YXR1cyh7Z2VuZXJhbDpnfSkge1xyXG4gIGlmIChnPT09dW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gJydcclxuICB9XHJcbiAgcmV0dXJuIGBfJHtNYXRoLnRydW5jKGcuc3RhdHVzLzEwMCl9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhdHVzMih7Z2VuZXJhbDpnfSkge1xyXG4gIGlmIChnPT09dW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gJydcclxuICB9XHJcbiAgcmV0dXJuIGcuc3RhdHVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtZXRob2Qoe2dlbmVyYWw6Z30pIHtcclxuICBpZiAoZz09PXVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuICcnXHJcbiAgfVxyXG4gIHJldHVybiBgJHttW2cubWV0aG9kXX1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtZXRob2QyKHtnZW5lcmFsOmd9KSB7XHJcbiAgaWYgKGc9PT11bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnJ1xyXG4gIH1cclxuICByZXR1cm4gbVtnLm1ldGhvZF0gKyAoZy5leHQgPyBgPCR7Zy5leHQucGFkRW5kKDQsICcgJyl9PiBgIDogJycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cmwoe2dlbmVyYWw6Z30pIHtcclxuICBsZXQgbXNnXHJcbiAgaWYgKGc9PT11bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnJ1xyXG4gIH1cclxuICBpZiAoZy51cmwubWF0Y2goJy9sb2cvJykpIHtcclxuICAgIG1zZyA9IGcudXJsLnNwbGl0KCdAJylbMV07XHJcbiAgfSBlbHNlIGlmICgkY2xpZW50Lm5vaG9zdGxvZ3MpIHtcclxuICAgIG1zZyA9IGcucGF0aDtcclxuICB9IGVsc2Uge1xyXG4gICAgbXNnID0gYCR7Zy51cmwuc3BsaXQoJz8nKVswXX1gO1xyXG4gIH1cclxuICBpZiAoJGNsaWVudC5ub2hvc3Rsb2dzKSB7XHJcbiAgICBpZiAoZy51cmwubWF0Y2goJy1zc2hvdEAnKSkge1xyXG4gICAgICBtc2cgPSBnLnVybC5zcGxpdCgnficpLnBvcCgpXHJcbiAgICB9IGVsc2UgaWYgKGcuZXh0PT09JycpIHtcclxuICAgICAgY29uc3QgW2ExLGEyXSA9IG1zZy5zcGxpdCgnLS0nKTtcclxuICAgICAgbXNnID0gYTIgfHwgYTE7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChnLnVybC5tYXRjaCgnLXNzaG90QCcpKSB7XHJcbiAgICBtc2cgPSAobmV3IFVSTChtc2cpKS5wYXRobmFtZSBcclxuICB9XHJcbiAgcmV0dXJuIG1zZztcclxufVxyXG5cclxuZnVuY3Rpb24gcHRoKHtnZW5lcmFsOmd9KSB7XHJcbiAgaWYgKGc9PT11bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnJ1xyXG4gIH1cclxuICBpZiAoJGNsaWVudC5ub2FyZ2xvZ3MgfHwgZy51cmwubWF0Y2goJy9sb2cvJykpIHtcclxuICAgIHJldHVybiAnJztcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgcGFybXMgPSBnLnVybC5zcGxpdCgnPycpWzFdO1xyXG4gICAgcmV0dXJuIHBhcm1zID8gYD8ke3Bhcm1zfWAgOiAnJztcclxuICB9XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwidGQtaXRlbSB7JGxvZ3N0b3JlLmxvZ2lkPT09aXRlbS5sb2dpZH1cIlxyXG5kYXRhLWxvZ2lkPXtpdGVtLmxvZ2lkfVxyXG5vbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCJcclxuPlxyXG4gIDxzcGFuIGNsYXNzPVwic3RhdHVzIHtzdGF0dXMoaXRlbSl9XCI+e3N0YXR1czIoaXRlbSl9PC9zcGFuPlxyXG4gIDxzcGFuIGNsYXNzPVwibWV0aG9kIHttZXRob2QoaXRlbSl9XCI+e21ldGhvZDIoaXRlbSl9PC9zcGFuPlxyXG4gIDxzcGFuIGNsYXNzPVwidXJsXCI+e3VybChpdGVtKX08L3NwYW4+XHJcbiAgPHNwYW4gY2xhc3M9XCJwcm1cIj57cHRoKGl0ZW0pfTwvc3Bhbj5cclxuPC9kaXY+XHJcblxyXG48c3R5bGU+XHJcbi50ZC1pdGVtOmhvdmVyIHtcclxuICBjb2xvcjogYmx1ZTtcclxuICBiYWNrZ3JvdW5kOiB5ZWxsb3dcclxuICAvKiBmb250LXdlaWdodDogYm9sZGVyOyAqL1xyXG59XHJcbi50ZC1pdGVtIHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgcGFkZGluZzogMC4xcmVtO1xyXG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xyXG59XHJcbi5zdGF0dXMge1xyXG4gIGNvbG9yOiBncmVlbjtcclxuICBmb250LXdlaWdodDogYm9sZDtcclxufVxyXG4uc3RhdHVzLl80LFxyXG4uc3RhdHVzLl81IHtcclxuICBjb2xvcjogcmVkO1xyXG59XHJcbi5tZXRob2Qge1xyXG4gIGNvbG9yOiBncmVlbjtcclxuICBmb250LXdlaWdodDogYm9sZDtcclxufVxyXG4ubWV0aG9kLnB1dCB7XHJcbiAgY29sb3I6ICM3ZTI2YTc7XHJcbn1cclxuLm1ldGhvZC5wb3N0IHtcclxuICBjb2xvcjogI2E3MjY3ZjtcclxufVxyXG4ubWV0aG9kLmRlbGV0ZSB7XHJcbiAgY29sb3I6IHJlZDtcclxufVxyXG4ucHJtIHtcclxuICBjb2xvcjogI2NjYjdiNztcclxuICBtYXJnaW4tbGVmdDogLTZweDtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmV4cG9ydCBsZXQgaXRlbTsgXHJcbmV4cG9ydCBsZXQga2V5O1xyXG5cclxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5sZXQgX2NoZWNrZWQgPSBmYWxzZTtcclxuXHJcbmZ1bmN0aW9uIGRhdGEoaSkge1xyXG4gIGNvbnN0IGlkID0gT2JqZWN0LmtleXMoaSlbMF1cclxuICBjb25zdCBhcnIgPSBpW2lkXS5wYXRoLnNwbGl0KCcvJylcclxuICBhcnIucG9wKClcclxuICByZXR1cm4gYXJyLmpvaW4oJy8nKVxyXG59XHJcblxyXG5mdW5jdGlvbiBjbGlja0hhbmRsZXIoZSkge1xyXG4gIGNvbnN0IG5vZGUgPSBlLmN1cnJlbnRUYXJnZXQ7XHJcbiAgbGV0IHtwYXRofSA9IG5vZGUucGFyZW50RWxlbWVudC5kYXRhc2V0O1xyXG4gIF9jaGVja2VkID0gbm9kZS5jaGVja2VkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBrbGFzcyhzdG9yZSkge1xyXG4gIGZvciAoY29uc3QgaXRtIGluIGl0ZW0pIHtcclxuICAgIGlmIChpdG09PT1zdG9yZS5sb2dpZCkge1xyXG4gICAgICByZXR1cm4gJyBjaGsnXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAnJ1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHN1bW1hcnlcclxuICBkYXRhLXBhdGg9e2RhdGEoaXRlbSl9XHJcbiAgY2xhc3M9XCJ7X2NoZWNrZWR9e2tsYXNzKCRsb2dzdG9yZSl9XCJcclxuPlxyXG4gIDxpbnB1dCBvbjpjbGljaz1cIntjbGlja0hhbmRsZXJ9XCIgdHlwZT1cImNoZWNrYm94XCIgLz5cclxuICB7QGh0bWwga2V5fVxyXG48L3N1bW1hcnk+XHJcblxyXG48c3R5bGU+XHJcbiAgc3VtbWFyeS5jaGsge1xyXG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICAgIGJhY2tncm91bmQ6ICNlNmY3ZDk7XHJcbiAgfVxyXG4gIHN1bW1hcnkudHJ1ZSB7XHJcbiAgICBiYWNrZ3JvdW5kOiAjZjNkZGRkO1xyXG4gIH1cclxuICBzdW1tYXJ5OmhvdmVyIHtcclxuICAgIGJhY2tncm91bmQ6ICNlYWU0ZjE7XHJcbiAgfVxyXG4gIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXSB7XHJcbiAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xyXG4gIH1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xyXG5pbXBvcnQgU3VtbWFyeSBmcm9tICcuL1N1bW1hcnkuc3ZlbHRlJztcclxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSAnLi4vb3RoZXIvc3RvcmVzLmpzJztcclxuXHJcbmxldCByZXJlbmRlciA9IDA7XHJcbmxldCBkYXRhID0gW107XHJcblxyXG4kOiBfZGF0YSA9IGRhdGE7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncy9saXN0Jyk7XHJcbiAgX3dzX2Nvbm5lY3QubG9nT25Nb3VudCA9ICgpID0+IHdzX19zZW5kKCdnZXRMb2cnLCAnJywgbG9nSGFuZGxlcik7XHJcbn0pO1xyXG5cclxuY29uc3QgbG9nSGFuZGxlciA9IG9iaiA9PiB7XHJcbiAgY29uc29sZS53YXJuKCd3c19fc2VuZChnZXRMb2cpJywgb2JqKTtcclxuICBpZiAoIHdpbmRvdy5taXRtLmNsaWVudC5jbGVhcikge1xyXG4gICAgZGVsZXRlIHdpbmRvdy5taXRtLmNsaWVudC5jbGVhcjtcclxuICAgIGxvZ3N0b3JlLnNldCh7XHJcbiAgICAgIHJlc3BIZWFkZXI6IHt9LFxyXG4gICAgICByZXNwb25zZTogJycsXHJcbiAgICAgIGhlYWRlcnM6ICcnLFxyXG4gICAgICBsb2dpZDogJycsXHJcbiAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgcGF0aDogJycsXHJcbiAgICAgIHVybDogJycsXHJcbiAgICAgIGV4dDogJycsXHJcbiAgICB9KVxyXG4gIH1cclxuICBjb25zdCB7ZmlsZXN9ID0gd2luZG93Lm1pdG1cclxuICBpZiAoZmlsZXMubG9nPT09dW5kZWZpbmVkKSB7XHJcbiAgICBmaWxlcy5sb2cgPSBvYmo7XHJcbiAgICBkYXRhID0gb2JqO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCB7bG9nfSA9IGZpbGVzO1xyXG4gICAgY29uc3QgbmV3TG9nID0ge307XHJcbiAgICBmb3IgKGxldCBrIGluIG9iaikge1xyXG4gICAgICBuZXdMb2dba10gPSBvYmpba107XHJcbiAgICB9XHJcbiAgICBkYXRhID0gbmV3TG9nO1xyXG4gICAgY29uc3QgbG4xID0gT2JqZWN0LmtleXMobG9nKVxyXG4gICAgY29uc3QgbG4yID0gT2JqZWN0LmtleXMobmV3TG9nKVxyXG4gICAgaWYgKGxuMjxsbjEpIHtcclxuICAgICAgY29uc3Qgbm9kZXMxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QtbG9ncyBkZXRhaWxzW29wZW5dJylcclxuICAgICAgbm9kZXMxLmZvckVhY2gobm9kZSA9PiBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpKVxyXG5cclxuICAgICAgY29uc3Qgbm9kZXMyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xpc3QtbG9ncyBzdW1tYXJ5IGlucHV0OmNoZWNrZWQnKVxyXG4gICAgICBub2RlczIuZm9yRWFjaChub2RlID0+IG5vZGUuY2hlY2tlZCA9IGZhbHNlKVxyXG4gICAgfVxyXG4gICAgZmlsZXMubG9nID0gbmV3TG9nXHJcbiAgfVxyXG59XHJcblxyXG53aW5kb3cubWl0bS5maWxlcy5sb2dfZXZlbnRzLkxvZ3NUYWJsZSA9ICgpID0+IHtcclxuICB3c19fc2VuZCgnZ2V0TG9nJywgJycsIGxvZ0hhbmRsZXIpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vaG9zdGxvZ3MoZmxhZykge1xyXG4gIGNvbnNvbGUubG9nKCdub2hvc3Rsb2dzJywgZmxhZyk7XHJcbn1cclxuXHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBpZD1cImxpc3QtbG9nc1wiPlxyXG4gIHsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YSkgYXMga2V5LCBpfVxyXG4gICAgPGRldGFpbHM+PFN1bW1hcnkgaXRlbT17X2RhdGFba2V5XX0ge2tleX0gLz5cclxuICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhW2tleV0pIGFzIGxvZ2lkfVxyXG4gICAgICA8SXRlbSBpdGVtPXt7XHJcbiAgICAgICAga2V5LFxyXG4gICAgICAgIGxvZ2lkLFxyXG4gICAgICAgIC4uLl9kYXRhW2tleV1bbG9naWRdLFxyXG4gICAgICAgIG5vaG9zdGxvZ3M6ICRjbGllbnQubm9ob3N0bG9ncyxcclxuICAgICAgICB9fS8+XHJcbiAgICAgIHsvZWFjaH1cclxuICAgIDwvZGV0YWlscz4gIFxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcbiIsImltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IHRhYnN0b3JlID0gd3JpdGFibGUoe1xyXG4gIGVkaXRvcjoge30sXHJcbiAgdGFiOiAwXHJcbn0pXHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xyXG5pbXBvcnQgeyBsb2dzdG9yZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIGJ0bk1pbigpIHtcclxuICBjb25zdCB7dGFiLCBlZGl0b3J9ID0gJHRhYnN0b3JlO1xyXG4gIGNvbnN0IGlkID0gYGVkaXQke3RhYisxfWA7XHJcbiAgZWRpdG9yW2lkXS50cmlnZ2VyKCdmb2xkJywgJ2VkaXRvci5mb2xkQWxsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0blBsdXMoKSB7XHJcbiAgY29uc3Qge3RhYiwgZWRpdG9yfSA9ICR0YWJzdG9yZTtcclxuICBjb25zdCBpZCA9IGBlZGl0JHt0YWIrMX1gO1xyXG4gIGVkaXRvcltpZF0udHJpZ2dlcignZm9sZCcsICdlZGl0b3IudW5mb2xkQWxsJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XHJcbiAgbGV0IGFyciA9ICRsb2dzdG9yZS5wYXRoLnNwbGl0KCcvJylcclxuICBhcnIucG9wKCk7XHJcbiAgY29uc3QgcGF0aCA9IGFyci5qb2luKCcvJyk7XHJcbiAgY29uc29sZS5sb2coe3BhdGh9KTtcclxuICB3c19fc2VuZCgnb3BlbkZvbGRlcicsIHtwYXRofSwgZGF0YSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnRG9uZSBPcGVuIScpO1xyXG4gIH0pO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1taW5cIiAgb246Y2xpY2s9XCJ7YnRuTWlufVwiID5bLS1dPC9idXR0b24+IC1cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1wbHVzXCIgb246Y2xpY2s9XCJ7YnRuUGx1c31cIj5bKytdPC9idXR0b24+IC1cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1vcGVuXCIgb246Y2xpY2s9XCJ7YnRuT3Blbn1cIj5PcGVuPC9idXR0b24+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IC0ycHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcclxuICBib3JkZXI6IDA7XHJcbiAgcGFkZGluZzogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uOmRpc2FibGVkIHtcclxuICBjdXJzb3I6IGF1dG87XHJcbn1cclxuLnRsYiB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgY2ZnLCByZXNpemUgfSBmcm9tICcuLi9tb25hY28vaW5pdCc7XHJcbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7IFRhYiB9IGZyb20gJ3N2ZWxtYSc7XHJcblxyXG5jb25zdCBvcHRpb24gPSB7XHJcbiAgLi4uY2ZnLFxyXG4gIHJlYWRPbmx5OiB0cnVlLFxyXG4gIGNvbnRleHRtZW51OiBmYWxzZSxcclxufVxyXG5cclxubGV0IG5vZGUxO1xyXG5sZXQgbm9kZTI7XHJcbmxldCBub2RlMztcclxuXHJcbmxldCBlZGl0MTtcclxubGV0IGVkaXQyO1xyXG5sZXQgZWRpdDM7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncyAtIEJhc2VUYWIuc3ZlbHRlJyk7XHJcbiAgY29uc29sZS5sb2coJGxvZ3N0b3JlKVxyXG4gIGNvbnN0IGV4dCA9ICRsb2dzdG9yZS5leHQ9PT0nanMnID8gJ2phdmFzY3JpcHQnIDogJGxvZ3N0b3JlLmV4dFxyXG4gIGNvbnN0IGhkcnMgPSBKU09OLnBhcnNlKCRsb2dzdG9yZS5oZWFkZXJzKTtcclxuICBjb25zdCBjc3AzID0gaGRycy5DU1AgfHwge307XHJcbiAgY29uc3QgdmFsMSA9IHtcclxuICAgIC4uLm9wdGlvbixcclxuICAgIGxhbmd1YWdlOiAnanNvbicsXHJcbiAgICB2YWx1ZTogJGxvZ3N0b3JlLmhlYWRlcnMsXHJcbiAgfTtcclxuICBjb25zdCB2YWwyID0ge1xyXG4gICAgLi4ub3B0aW9uLFxyXG4gICAgbGFuZ3VhZ2U6IGV4dCxcclxuICAgIHZhbHVlOiAkbG9nc3RvcmUucmVzcG9uc2UsXHJcbiAgfTtcclxuICBjb25zdCB2YWwzID0ge1xyXG4gICAgLi4ub3B0aW9uLFxyXG4gICAgbGFuZ3VhZ2U6ICdqc29uJyxcclxuICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeShjc3AzLCBudWxsLCAyKSxcclxuICB9O1xyXG4gIGNvbnN0IGN0eXBlID0gJGxvZ3N0b3JlLnJlc3BIZWFkZXJbXCJjb250ZW50LXR5cGVcIl0gfHwgJ3RleHQvcGxhaW4nO1xyXG4gIGlmIChjdHlwZS5tYXRjaCgnaHRtbCcpKSB7XHJcbiAgICB2YWwyLnZhbHVlID0gdmFsMi52YWx1ZS5cclxuICAgIHJlcGxhY2UoL1xcXFxuXFxcXG4vZywgJycpLlxyXG4gICAgcmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpLlxyXG4gICAgcmVwbGFjZSgvXFxcXHQvZywgJ1xcdCcpLlxyXG4gICAgcmVwbGFjZSgvXFxcXFwiL2csICdcIicpLlxyXG4gICAgcmVwbGFjZSgvXlwiLywgJycpLlxyXG4gICAgcmVwbGFjZSgvXCIkLywgJycpO1xyXG4gICAgdmFsMi5sYW5ndWFnZSA9ICdodG1sJztcclxuICB9XHJcblxyXG4gIG5vZGUxID0gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb25hY28xJyk7XHJcbiAgbm9kZTIgPSB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vbmFjbzInKTtcclxuICBub2RlMyA9IHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9uYWNvMycpO1xyXG5cclxuICBlZGl0MSA9ICB3aW5kb3cubW9uYWNvLmVkaXRvci5jcmVhdGUobm9kZTEsIHZhbDEpO1xyXG4gIGVkaXQyID0gIHdpbmRvdy5tb25hY28uZWRpdG9yLmNyZWF0ZShub2RlMiwgdmFsMik7XHJcbiAgZWRpdDMgPSAgd2luZG93Lm1vbmFjby5lZGl0b3IuY3JlYXRlKG5vZGUzLCB2YWwzKTtcclxuXHJcbiAgY29uc29sZS5sb2coJ2xvYWQgbW9uYWNvOiBsb2dzIDEsMiwzJylcclxuICBjb25zdCBybzEgPSBuZXcgUmVzaXplT2JzZXJ2ZXIocmVzaXplKGVkaXQxKSk7XHJcbiAgY29uc3Qgcm8yID0gbmV3IFJlc2l6ZU9ic2VydmVyKHJlc2l6ZShlZGl0MikpO1xyXG4gIGNvbnN0IHJvMyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUoZWRpdDMpKTtcclxuXHJcbiAgcm8xLm9ic2VydmUobm9kZTEpO1xyXG4gIHJvMi5vYnNlcnZlKG5vZGUyKTtcclxuICBybzMub2JzZXJ2ZShub2RlMyk7XHJcblxyXG4gIHRhYnN0b3JlLnNldCh7XHJcbiAgICAuLi4kdGFic3RvcmUsXHJcbiAgICAgIGVkaXRvcjoge1xyXG4gICAgICAgIGVkaXQxLFxyXG4gICAgICAgIGVkaXQyLFxyXG4gICAgICAgIGVkaXQzLFxyXG4gICAgICB9LFxyXG4gIH0pXHJcbn0pO1xyXG5mdW5jdGlvbiBpc0NTUCgpIHtcclxuICBjb25zdCBoID0gJGxvZ3N0b3JlLnJlc3BIZWFkZXI7XHJcbiAgY29uc3QgY3NwID0gaFsnY29udGVudC1zZWN1cml0eS1wb2xpY3knXSB8fCBoWydjb250ZW50LXNlY3VyaXR5LXBvbGljeS1yZXBvcnQtb25seSddO1xyXG4gIHJldHVybiBjc3A7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48VGFiIGxhYmVsPVwiSGVhZGVyc1wiPlxyXG4gIDxkaXYgY2xhc3M9XCJ2aWV3LWNvbnRhaW5lclwiPlxyXG4gICAgPGRpdiBpZD1cIm1vbmFjbzFcIj5cclxuICAgIDwvZGl2PlxyXG4gIDwvZGl2PlxyXG48L1RhYj5cclxuPFRhYiBsYWJlbD1cIlJlc3BvbnNlXCI+XHJcbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XHJcbiAgICA8ZGl2IGlkPVwibW9uYWNvMlwiPlxyXG4gICAgPC9kaXY+XHJcbiAgPC9kaXY+XHJcbjwvVGFiPlxyXG48VGFiIGxhYmVsPVwiQ1NQXCI+XHJcbiAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XHJcbiAgICA8ZGl2IGlkPVwibW9uYWNvM1wiPlxyXG4gIDwvZGl2PlxyXG48L1RhYj5cclxuXHJcbjxzdHlsZT5cclxuLnZpZXctY29udGFpbmVyIHtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNTBweCk7XHJcbn1cclxuI21vbmFjbzEsXHJcbiNtb25hY28yLFxyXG4jbW9uYWNvMyB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIHRvcDogMDtcclxuICBsZWZ0OiAwO1xyXG4gIGJvdHRvbTogMDtcclxuICByaWdodDogMDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcclxuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XHJcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xyXG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcclxuXHJcbm9uTW91bnQoKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1qc29uIGEnKTtcclxuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xyXG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcclxuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcclxuICAgICAgICAgIHRhYjogaSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIDUwMCk7XHJcbn0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24yLz5cclxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWpzb25cIiBzaXplPVwiaXMtc21hbGxcIj5cclxuICA8QmFzZVRhYi8+XHJcbjwvVGFicz5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJ3N2ZWxtYSc7XHJcbmltcG9ydCB7IHRhYnN0b3JlIH0gZnJvbSAnLi90YWIuanMnO1xyXG5pbXBvcnQgQnV0dG9uMiBmcm9tICcuL0J1dHRvbjIuc3ZlbHRlJztcclxuaW1wb3J0IEJhc2VUYWIgZnJvbSAnLi9CYXNlVGFiLnN2ZWx0ZSc7XHJcblxyXG5vbk1vdW50KCgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItaHRtbCBhJyk7XHJcbiAgICBmb3IgKGxldCBbaSxub2RlXSBvZiBub2Rlcy5lbnRyaWVzKCkpIHtcclxuICAgICAgbm9kZS5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRhYnN0b3JlLnNldCh7XHJcbiAgICAgICAgICAuLi4kdGFic3RvcmUsXHJcbiAgICAgICAgICB0YWI6IGksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCA1MDApO1xyXG59KTtcclxuPC9zY3JpcHQ+XHJcblxyXG48QnV0dG9uMi8+XHJcbjxUYWJzIHZhbHVlPXskdGFic3RvcmUudGFifSBzdHlsZT1cImlzLWJveGVkIHRhYi1odG1sXCIgc2l6ZT1cImlzLXNtYWxsXCI+XHJcbiAgPEJhc2VUYWIvPlxyXG48L1RhYnM+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xyXG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcclxuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XHJcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xyXG5cclxub25Nb3VudCgoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLXRleHQgYScpO1xyXG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XHJcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0YWJzdG9yZS5zZXQoe1xyXG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxyXG4gICAgICAgICAgdGFiOiBpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgNTAwKTtcclxufSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPEJ1dHRvbjIvPlxyXG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItdGV4dFwiIHNpemU9XCJpcy1zbWFsbFwiPlxyXG4gIDxCYXNlVGFiLz5cclxuPC9UYWJzPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgVGFicywgVGFiIH0gZnJvbSAnc3ZlbG1hJztcclxuaW1wb3J0IHsgdGFic3RvcmUgfSBmcm9tICcuL3RhYi5qcyc7XHJcbmltcG9ydCBCdXR0b24yIGZyb20gJy4vQnV0dG9uMi5zdmVsdGUnO1xyXG5pbXBvcnQgQmFzZVRhYiBmcm9tICcuL0Jhc2VUYWIuc3ZlbHRlJztcclxuXHJcbm9uTW91bnQoKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1jc3MgYScpO1xyXG4gICAgZm9yIChsZXQgW2ksbm9kZV0gb2Ygbm9kZXMuZW50cmllcygpKSB7XHJcbiAgICAgIG5vZGUub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0YWJzdG9yZS5zZXQoe1xyXG4gICAgICAgICAgLi4uJHRhYnN0b3JlLFxyXG4gICAgICAgICAgdGFiOiBpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgNTAwKTtcclxufSk7XHJcbjwvc2NyaXB0PlxyXG5cclxuPEJ1dHRvbjIvPlxyXG48VGFicyB2YWx1ZT17JHRhYnN0b3JlLnRhYn0gc3R5bGU9XCJpcy1ib3hlZCB0YWItY3NzXCIgc2l6ZT1cImlzLXNtYWxsXCI+XHJcbiAgPEJhc2VUYWIvPlxyXG48L1RhYnM+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xyXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xyXG5pbXBvcnQgeyB0YWJzdG9yZSB9IGZyb20gJy4vdGFiLmpzJztcclxuaW1wb3J0IEJ1dHRvbjIgZnJvbSAnLi9CdXR0b24yLnN2ZWx0ZSc7XHJcbmltcG9ydCBCYXNlVGFiIGZyb20gJy4vQmFzZVRhYi5zdmVsdGUnO1xyXG5cclxub25Nb3VudCgoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWpzIGEnKTtcclxuICAgIGZvciAobGV0IFtpLG5vZGVdIG9mIG5vZGVzLmVudHJpZXMoKSkge1xyXG4gICAgICBub2RlLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGFic3RvcmUuc2V0KHtcclxuICAgICAgICAgIC4uLiR0YWJzdG9yZSxcclxuICAgICAgICAgIHRhYjogaSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIDUwMCk7XHJcbn0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24yLz5cclxuPFRhYnMgdmFsdWU9eyR0YWJzdG9yZS50YWJ9IHN0eWxlPVwiaXMtYm94ZWQgdGFiLWpzXCIgc2l6ZT1cImlzLXNtYWxsXCI+XHJcbiAgPEJhc2VUYWIvPlxyXG48L1RhYnM+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IGxvZ3N0b3JlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgSnNvbiBmcm9tICcuL0pzb24uc3ZlbHRlJztcclxuaW1wb3J0IEh0bWwgZnJvbSAnLi9IdG1sLnN2ZWx0ZSc7XHJcbmltcG9ydCBUZXh0IGZyb20gJy4vVGV4dC5zdmVsdGUnO1xyXG5pbXBvcnQgQ3NzIGZyb20gJy4vQ3NzLnN2ZWx0ZSc7XHJcbmltcG9ydCBKcyBmcm9tICcuL0pzLnN2ZWx0ZSc7XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cIml0ZW0tc2hvd1wiPlxyXG4gIHsjaWYgJGxvZ3N0b3JlLnRpdGxlLm1hdGNoKCcucG5nJyl9XHJcbiAgICA8aW1nIHNyYz1cInskbG9nc3RvcmUudXJsfVwiIGFsdD1cImltYWdlXCIvPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2pzb24nfVxyXG4gICAgPEpzb24vPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2h0bWwnfVxyXG4gICAgPEh0bWwvPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J3R4dCd9XHJcbiAgICA8VGV4dC8+XHJcbiAgezplbHNlIGlmICRsb2dzdG9yZS5leHQ9PT0nY3NzJ31cclxuICAgIDxDc3MvPlxyXG4gIHs6ZWxzZSBpZiAkbG9nc3RvcmUuZXh0PT09J2pzJ31cclxuICAgIDxKcy8+XHJcbiAgezplbHNlfVxyXG4gICAgPHByZT57JGxvZ3N0b3JlLnJlc3BvbnNlfTwvcHJlPlxyXG4gIHsvaWZ9XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uaXRlbS1zaG93IHtcclxuICBtYXJnaW4tbGVmdDogMnB4O1xyXG59XHJcbi5pdGVtLXNob3cgcHJle1xyXG4gIHBhZGRpbmc6IDAgMCAwIDVweDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgbG9nc3RvcmUgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5pbXBvcnQgVkJveDIgZnJvbSAnLi4vYm94L1ZCb3gyLnN2ZWx0ZSc7XHJcbmltcG9ydCB0aXRsZSBmcm9tICcuL1RpdGxlLnN2ZWx0ZSc7XHJcbmltcG9ydCBMaXN0IGZyb20gJy4vTGlzdC5zdmVsdGUnO1xyXG5pbXBvcnQgU2hvdyBmcm9tICcuL1Nob3cuc3ZlbHRlJztcclxuXHJcbmxldCBsZWZ0ID0gMTYzO1xyXG5jb25zdCB0b3AgPSAnNDcnO1xyXG5jb25zdCBpZCA9ICdsb2dzTGVmdCc7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgbG9ncy9pbmRleCcpO1xyXG4gIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChpZCwgZnVuY3Rpb24ob3B0KSB7XHJcbiAgICBvcHRbaWRdICYmIChsZWZ0ID0gb3B0W2lkXSlcclxuICB9KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XHJcbiAgY29uc3QgZGF0YSA9IHt9XHJcbiAgZGF0YVtpZF0gPSBsZWZ0XHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48VkJveDIge3RpdGxlfSB7dG9wfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fSBzaG93PXskbG9nc3RvcmUubG9naWR9PlxyXG4gIDxTaG93Lz5cclxuPC9WQm94Mj5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdXJscyB9IGZyb20gJy4vdXJsLWRlYm91bmNlJztcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmxldCBhdXRvU2F2ZSA9IHRydWU7XHJcbmxldCBfdGFncyA9ICR0YWdzO1xyXG5cclxuZnVuY3Rpb24gYnRuUmVzZXQoZSkge1xyXG4gIHdpbmRvdy5taXRtLmZpbGVzLnJvdXRlX2V2ZW50cy5yb3V0ZVRhYmxlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ0blNhdmUoZSkge1xyXG4gIGNvbnN0IHtfX3RhZzEsIF9fdGFnMiwgX190YWczLCByb3V0ZXN9ID0gd2luZG93Lm1pdG07XHJcbiAgY29uc3QgX2NoaWxkbnMgPSB7fVxyXG4gIGZvciAoY29uc3QgbnMgaW4gcm91dGVzKSB7XHJcbiAgICBfY2hpbGRuc1tuc10gPSByb3V0ZXNbbnNdLl9jaGlsZG5zXHJcbiAgfVxyXG4gIGNvbnN0IHRhZ3MgPSB7XHJcbiAgICBfY2hpbGRucyxcclxuICAgIF9fdGFnMSxcclxuICAgIF9fdGFnMixcclxuICAgIF9fdGFnMyxcclxuICB9O1xyXG4gIGNvbnNvbGUubG9nKCdzYXZlVGFncycsIGUudGFyZ2V0KTtcclxuICB3c19fc2VuZCgnc2F2ZVRhZ3MnLCB0YWdzKTtcclxuICB1cmxzKClcclxufVxyXG5cclxub25Nb3VudCgoKSA9PiB7XHJcbiAgbGV0IGRlYm91bmNlID0gZmFsc2U7XHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNldC10YWdzJykub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGNvbnN0IHt0eXBlfSA9IGUudGFyZ2V0LmF0dHJpYnV0ZXM7XHJcbiAgICBpZiAodHlwZSkge1xyXG4gICAgICBjb25zdCB7dmFsdWV9ID0gdHlwZTtcclxuICAgICAgaWYgKGF1dG9TYXZlICYmIHZhbHVlPT09J2NoZWNrYm94Jykge1xyXG4gICAgICAgIGlmIChkZWJvdW5jZSkge1xyXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGVib3VuY2UgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgIGRlYm91bmNlID0gZmFsc2U7XHJcbiAgICAgICAgICBidG5TYXZlKGUpO1xyXG4gICAgICAgIH0sNTApXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICB3aW5kb3cubWl0bS5icm93c2VyLmNoZ1VybF9ldmVudHMudGFnc0V2ZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmxvZygnVXBkYXRlIHRhZ3MhJyk7XHJcbiAgICB0YWdzLnNldCh7Li4uJHRhZ3N9KTtcclxuICB9XHJcbn0pO1xyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJidG4tY29udGFpbmVyXCI+XHJcbiAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxyXG4gICAgPGlucHV0XHJcbiAgICB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgYmluZDpjaGVja2VkPXskdGFncy5saXN0fS8+XHJcbiAgICByb3V0ZXNcclxuICA8L2xhYmVsPlxyXG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cclxuICAgIDxpbnB1dFxyXG4gICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgIGJpbmQ6Y2hlY2tlZD17JHRhZ3MudW5pcX0vPlxyXG4gICAgZml0XHJcbiAgPC9sYWJlbD5cclxuICA8IS0tIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cclxuICAgIDxpbnB1dCBcclxuICAgIHR5cGU9XCJjaGVja2JveFwiXHJcbiAgICBvbjpjbGljaz1cInt1cmxzfVwiXHJcbiAgICBiaW5kOmNoZWNrZWQ9eyR0YWdzLmZpbHRlclVybH0vPlxyXG4gICAgY3VycmVudC10YWJcclxuICA8L2xhYmVsPiAtLT5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blJlc2V0fVwiIGRpc2FibGVkPXthdXRvU2F2ZX0+UmVzZXQ8L2J1dHRvbj5cclxuICA8YnV0dG9uIGNsYXNzPVwidGxiIGJ0bi1nb1wiIG9uOmNsaWNrPVwie2J0blNhdmV9XCIgIGRpc2FibGVkPXthdXRvU2F2ZX0+U2F2ZTwvYnV0dG9uPlxyXG4gIDxsYWJlbCBjbGFzcz1cImNoZWNrZXJcIj5cclxuICAgIDxpbnB1dFxyXG4gICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgIGJpbmQ6Y2hlY2tlZD17YXV0b1NhdmV9Lz5cclxuICAgIGF1dG9zYXZlXHJcbiAgPC9sYWJlbD5cclxuICAuXHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbiAgcGFkZGluZy1yaWdodDogNHB4O1xyXG4gIHBhZGRpbmctYm90dG9tOiAzcHg7XHJcbiAgcmlnaHQ6IDA7XHJcbiAgei1pbmRleDogNTtcclxuICB0b3A6IC0ycHg7XHJcbn1cclxuLmJ0bi1jb250YWluZXIgYnV0dG9uIHtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG59XHJcbi5idG4tY29udGFpbmVyIGJ1dHRvbjpkaXNhYmxlZCB7XHJcbiAgY3Vyc29yOiBhdXRvO1xyXG59XHJcbi5idG4tY29udGFpbmVyIGlucHV0IHtcclxuICB2ZXJ0aWNhbC1hbGlnbjogLTJweDtcclxufVxyXG4udGxiIHtcclxuICBib3JkZXI6IG5vbmU7XHJcbn1cclxuLmNoZWNrZXIge1xyXG4gIGNvbG9yOiBjaG9jb2xhdGU7XHJcbiAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICBmb250LXNpemU6IDEycHg7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IGNvbHM9M1xyXG5pbXBvcnQgeyBzdGF0ZXMgfSBmcm9tICcuL3N0YXRlcy5qcyc7XHJcblxyXG5mdW5jdGlvbiByZXNpemUoZSkge1xyXG4gIGNvbnN0IGFsbCA9IHsuLi4kc3RhdGVzfVxyXG4gIGFsbC5jaGV2cm9uID0gYWxsLmNoZXZyb249PT0nWzw8XScgPyAnWz4+XScgOiAnWzw8XSdcclxuICBzdGF0ZXMuc2V0KGFsbClcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxidXR0b25cclxuY2xhc3M9XCJmLXJpZ2h0XCIgXHJcbm9uOmNsaWNrPVwie3Jlc2l6ZX1cIlxyXG5zdHlsZT1cIntjb2xzPT09MyA/ICcnIDogJ2Rpc3BsYXk6bm9uZTsnfVwiXHJcbj57JHN0YXRlcy5jaGV2cm9ufTwvYnV0dG9uPlxyXG5cclxuPHN0eWxlPlxyXG5idXR0b24ge1xyXG4gIGJvcmRlcjogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgY29sb3I6ICMwMDJhZmY7XHJcbiAgbWFyZ2luLXRvcDogLTVweDtcclxuICBtYXJnaW4tcmlnaHQ6IC01cHg7XHJcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcclxuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcclxuICBwYWRkaW5nOiAycHggMXB4IDFweCAxcHg7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogNzAwO1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxufVxyXG4uZi1yaWdodCB7XHJcbiAgZmxvYXQ6cmlnaHQ7XHJcbiAgbWFyZ2luOiAwO1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdXJscyB9IGZyb20gJy4vdXJsLWRlYm91bmNlJztcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIGNsaWNrZWQoZSkge1xyXG4gIGNvbnN0IHtyb3V0ZXN9ID0gd2luZG93Lm1pdG1cclxuICBjb25zdCB7bnMsIGlkfSA9IGUudGFyZ2V0LmRhdGFzZXRcclxuICBjb25zdCB7X190YWcxLCBfX3RhZzIsIF9fdGFnM30gPSB3aW5kb3cubWl0bVxyXG4gIGNvbnN0IFsuLi5wcmVzZXRdID0gd2luZG93Lm1pdG0ucm91dGVzW25zXS5wcmVzZXRbaWRdLnRhZ3NcclxuICBmb3IgKGNvbnN0IHBhdGggaW4gX190YWczW25zXSkge1xyXG4gICAgY29uc3Qgc2VjcyA9IF9fdGFnM1tuc11bcGF0aF1cclxuICAgIGZvciAoY29uc3Qgc2VjIGluIHNlY3MpIHtcclxuICAgICAgY29uc3Qge3RhZ3N9ID0gc2Vjc1tzZWNdXHJcbiAgICAgIGZvciAoY29uc3QgdGFnIGluIHRhZ3MpIHtcclxuICAgICAgICB0YWdzW3RhZ10gPSAgcHJlc2V0LmluZGV4T2YoYHRhZzM6JHt0YWd9YCk+LTFcclxuICAgICAgICB0YWdzW3RhZ10gJiYgcHJlc2V0LnB1c2godGFnLnNwbGl0KCc6JykucG9wKCkpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZm9yIChjb25zdCB0YWcgaW4gX190YWcyW25zXSkge1xyXG4gICAgY29uc3QgX3RnID0gX190YWcyW25zXVt0YWddXHJcbiAgICBfdGcuc3RhdGUgPSAgcHJlc2V0LmluZGV4T2YodGFnKT4tMVxyXG4gICAgX3RnLnN0YXRlICYmIHByZXNldC5wdXNoKHRhZy5zcGxpdCgnOicpLnBvcCgpKVxyXG4gIH1cclxuICBmb3IgKGNvbnN0IHRhZyBpbiBfX3RhZzFbbnNdKSB7XHJcbiAgICBfX3RhZzFbbnNdW3RhZ10gPSBwcmVzZXQuaW5kZXhPZih0YWcpPi0xXHJcbiAgfVxyXG4gIGNvbnN0IF9jaGlsZG5zID0ge31cclxuICBmb3IgKGNvbnN0IG5zIGluIHJvdXRlcykge1xyXG4gICAgX2NoaWxkbnNbbnNdID0gcm91dGVzW25zXS5fY2hpbGRuc1xyXG4gIH1cclxuICBjb25zdCBfdGFncyA9IHtcclxuICAgIF9fdGFnMSxcclxuICAgIF9fdGFnMixcclxuICAgIF9fdGFnM1xyXG4gIH1cclxuICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICBjb25zdCBzdiA9IHtfY2hpbGRucywgLi4uX3RhZ3N9XHJcbiAgICB0YWdzLnNldCh7Li4uJHRhZ3MsIC4uLl90YWdzfSlcclxuICAgIHdzX19zZW5kKCdzYXZlVGFncycsIHN2KVxyXG4gICAgdXJscygpXHJcbiAgfSwgMSlcclxufVxyXG5mdW5jdGlvbiBpdGVtcyh0YWdzKSB7XHJcbiAgY29uc3QgYXJyID0gW11cclxuICBjb25zdCB7cm91dGVzLCBmbjoge29uZVNpdGV9fSA9IHdpbmRvdy5taXRtXHJcbiAgZm9yIChjb25zdCBucyBpbiByb3V0ZXMpIHtcclxuICAgIGNvbnN0IHtwcmVzZXR9ID0gcm91dGVzW25zXVxyXG4gICAgaWYgKHByZXNldCAmJiBvbmVTaXRlKHRhZ3MsIG5zKSkge1xyXG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHByZXNldCkge1xyXG4gICAgICAgIGFyci5wdXNoKHtucywgaWR9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBhcnJcclxufVxyXG5mdW5jdGlvbiB0aXRsZShpdGVtKSB7XHJcbiAgY29uc3Qge25zLCBpZH0gPSBpdGVtXHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLnJvdXRlc1tuc10ucHJlc2V0W2lkXS50aXRsZVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHNwYW4gY2xhc3M9XCJidXR0b24tY29udGFpbmVyXCI+XHJcbiAgUHJlc2V0OlxyXG4gIHsjZWFjaCBpdGVtcygkdGFncykgYXMgaXRlbX1cclxuICAgIDxidXR0b24gXHJcbiAgICBkYXRhLW5zPVwie2l0ZW0ubnN9XCJcclxuICAgIGRhdGEtaWQ9XCJ7aXRlbS5pZH1cIlxyXG4gICAgb246Y2xpY2s9XCJ7Y2xpY2tlZH1cIlxyXG4gICAgdGl0bGU9XCJ7dGl0bGUoaXRlbSl9XCJcclxuICAgID5be2l0ZW0uaWR9XTwvYnV0dG9uPlxyXG4gIHsvZWFjaH1cclxuPC9zcGFuPlxyXG5cclxuPHN0eWxlPlxyXG4uYnV0dG9uLWNvbnRhaW5lciB7XHJcbiAgZmxvYXQ6IHJpZ2h0O1xyXG4gIG1hcmdpbi10b3A6IC0xcHg7XHJcbn1cclxuYnV0dG9uIHtcclxuICBib3JkZXI6IDA7XHJcbiAgY3Vyc29yOiBwb2ludGVyO1xyXG4gIGNvbG9yOiAjMDAyYWZmO1xyXG4gIG1hcmdpbi10b3A6IDFweDtcclxuICBtYXJnaW4tcmlnaHQ6IDJweDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogMC42cHg7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgcGFkZGluZzogMnB4IDFweCAxcHggMXB4O1xyXG4gIGZvbnQtZmFtaWx5OiBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIENvdXJpZXIgTmV3LCBtb25vc3BhY2U7XHJcbiAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICBmb250LXNpemU6IDEwcHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuZXhwb3J0IGxldCBjb2xzO1xyXG4vKioqXHJcbiogZXg6XHJcbiogX190YWcxW25zXVtyZW1vdmUtYWRzfjFdID0gdHJ1ZVxyXG4qIF9fdGFnMVtuc11bcmVtb3ZlLWFkc34yXSA9IGZhbHNlXHJcbioqKi9cclxubGV0IHRncyA9IFtdO1xyXG5sZXQgbGlzdCA9IHt9O1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgY29uc3QgeyByb3V0ZXMsIGZuIH0gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCB7IHJlc2V0UnVsZTMsIG9uZVNpdGUgfSA9IGZuO1xyXG4gIGNvbnN0IHRhZ3NTdG9yZSA9ICR0YWdzO1xyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnN0IHtfX3RhZzEsX190YWcyLF9fdGFnM30gPSAkdGFncztcclxuICAgIGNvbnN0IHtkYXRhc2V0LCBjaGVja2VkfSA9IGUudGFyZ2V0O1xyXG4gICAgY29uc3Qge2l0ZW06IHRhZ30gPSBkYXRhc2V0O1xyXG4gICAgY29uc3QgW2dyb3VwMSwgaWQxXSA9IHRhZy5zcGxpdCgnficpO1xyXG5cclxuICAgIGZvciAobGV0IG5zIGluIF9fdGFnMSkge1xyXG4gICAgICBpZiAob25lU2l0ZSh0YWdzU3RvcmUsIG5zKSkge1xyXG4gICAgICAgIG5zID0gcm91dGVzW25zXS5fY2hpbGRucy5fc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG4gICAgICAgIF9fdGFnMVtuc11bdGFnXSA9IGNoZWNrZWRcclxuICAgICAgICBpZiAoaWQxICYmIGNoZWNrZWQpIHtcclxuICAgICAgICAgIGZvciAobGV0IHRnIGluIGxpc3QpIHtcclxuICAgICAgICAgICAgY29uc3QgW2dyb3VwMiwgaWQyXSA9IHRnLnNwbGl0KCd+Jyk7XHJcbiAgICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIgJiYgaWQxIT09aWQyKSB7XHJcbiAgICAgICAgICAgICAgaWYgKF9fdGFnMVtuc11bZ3JvdXAxXSE9PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgX190YWcxW25zXVtncm91cDFdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgX190YWcxW25zXVt0Z10gPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xyXG4gICAgICBpZiAob25lU2l0ZSh0YWdzU3RvcmUsIG5zKSkge1xyXG4gICAgICAgIG5zID0gcm91dGVzW25zXS5fY2hpbGRucy5fc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG4gICAgICAgIGNvbnN0IHRhZ3MgPSBfX3RhZzJbbnNdO1xyXG4gICAgICAgIGZvciAobGV0IHRnIGluIHRhZ3MpIHtcclxuICAgICAgICAgIGNvbnN0IHR5cDIgPSB0Zy5zcGxpdCgnOicpWzFdIHx8IHRnO1xyXG4gICAgICAgICAgaWYgKHRhZz09PXR5cDIpIHtcclxuICAgICAgICAgICAgdGFnc1t0Z10uc3RhdGUgPSBjaGVja2VkOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgICAgICAgICB9IFxyXG4gICAgICAgICAgaWYgKGdyb3VwMT09PXR5cDIuc3BsaXQoJ34nKVswXSkge1xyXG4gICAgICAgICAgICB0YWdzW3RnXS5zdGF0ZSA9IF9fdGFnMVtuc11bdHlwMl0gfHwgZmFsc2U7IC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXNldFJ1bGUzKCR0YWdzLCB0YWcpXHJcbiAgICB0YWdzLnNldCh7XHJcbiAgICAgIC4uLiR0YWdzLFxyXG4gICAgICBfX3RhZzEsXHJcbiAgICAgIF9fdGFnMixcclxuICAgICAgX190YWczLFxyXG4gICAgfSkgXHJcbiAgfSwgMTApO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyhpdGVtKSB7XHJcbiAgY29uc3QgeyBicm93c2VyIH0gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCBzbGMgPSAkdGFncy5fX3RhZzFbaXRlbV0gPyAnc2xjJyA6ICcnO1xyXG4gIGNvbnN0IGdycCA9ICR0YWdzLnRncm91cFtpdGVtXSA/ICdncnAnIDogJyc7XHJcbiAgbGV0IGl0bSA9ICcnXHJcbiAgaWYgKCR0YWdzLnRncm91cFtpdGVtXSkge1xyXG4gICAgZm9yIChjb25zdCBucyBvZiBicm93c2VyLm5zcykge1xyXG4gICAgICBjb25zdCB0YWczID0gJHRhZ3MuX190YWczW25zXSB8fCBbXVxyXG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHRhZzMpIHtcclxuICAgICAgICBjb25zdCBzZWNzID0gdGFnM1tpZF1cclxuICAgICAgICBmb3IgKGNvbnN0IHNlYyBpbiBzZWNzKSB7XHJcbiAgICAgICAgICBjb25zdCB0YWdzID0gc2Vjc1tzZWNdLnRhZ3MgLy8gZmVhdDogdXBkYXRlIF9fdGFnM1xyXG4gICAgICAgICAgZm9yIChjb25zdCB0YWcgaW4gdGFncykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbT09PXRhZy5zcGxpdCgnOicpLnBvcCgpKSB7XHJcbiAgICAgICAgICAgICAgaXRtID0gJ2l0bSdcclxuICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGxldCB1cmwgPSAnJ1xyXG4gIGZvciAoY29uc3QgbnMgb2YgYnJvd3Nlci5uc3MpIHtcclxuICAgIGNvbnN0IHRhZzMgPSAkdGFncy5fX3RhZzNbbnNdIHx8IFtdIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzNcclxuICAgIGZvciAoY29uc3QgaWQgaW4gdGFnMykge1xyXG4gICAgICBpZiAoaWQubWF0Y2goYDoke2l0ZW19OmApKSB7XHJcbiAgICAgICAgdXJsID0gJ3VybCdcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBgcnRhZyAke2dycH0gJHtzbGN9ICR7aXRtfSAke3VybH1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsaXN0VGFncyh0YWdzKSB7XHJcbiAgY29uc29sZS5sb2coJ3JlcmVuZGVyLi4uJyk7XHJcbiAgY29uc3Qge2Jyb3dzZXIsIHJvdXRlcywgZm46IHtvbmVTaXRlfX0gPSB3aW5kb3cubWl0bTtcclxuICBsaXN0ID0ge31cclxuICBjb25zdCBuc3MgPSBbXVxyXG4gIGZvciAobGV0IG5zIGluIHRhZ3MuX190YWcxKSB7XHJcbiAgICBuc3MucHVzaChucylcclxuICAgIGlmIChvbmVTaXRlKHRhZ3MsIG5zKSkge1xyXG4gICAgICBucyA9IHJvdXRlc1tuc10uX2NoaWxkbnMuX3N1Ym5zIHx8IG5zIC8vIGZlYXQ6IGNoZyB0byBjaGlsZCBuYW1lc3BhY2VcclxuICAgICAgY29uc3QgdGFnMSA9IHRhZ3MuX190YWcxW25zXVxyXG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHRhZzEpIHtcclxuICAgICAgICBpZiAobGlzdFtpZF09PT11bmRlZmluZWQgfHwgdGFnMVtpZF0pIHtcclxuICAgICAgICAgIGxpc3RbaWRdID0gdGFnMVtpZF1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgYnJvd3Nlci5uc3MgPSBuc3M7XHJcbiAgdGdzID0gT2JqZWN0LmtleXMobGlzdCkuc29ydCgpO1xyXG4gIHJldHVybiB0Z3M7XHJcbn1cclxuZnVuY3Rpb24gZW50ZXIoZSkge1xyXG4gIGNvbnN0IHsgcmNsYXNzIH0gPSB3aW5kb3cubWl0bS5mbjtcclxuICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI3VybHNgKVxyXG4gIGlmIChub2RlKSB7XHJcbiAgICBjb25zdCB7aXRlbX0gPSBlLnRhcmdldC5kYXRhc2V0O1xyXG4gICAgY29uc3Qga2xhc3MgPSBpdGVtLnJlcGxhY2UocmNsYXNzLCAnLScpXHJcbiAgICBjb25zdCBjc3MgPSBgXHJcbiAgICAudXJscyAuXyR7a2xhc3N9LFxyXG4gICAgLmZhcmcgLl8ke2tsYXNzfSxcclxuICAgIC50MiAuc3BhY2V4Ll8ke2tsYXNzfSxcclxuICAgIC50MyAuc3BhY2UzLl8ke2tsYXNzfSB7YmFja2dyb3VuZDogeWVsbG93O31cclxuICAgIC50MiAuc3BhY2UxLl8ke2tsYXNzfSxcclxuICAgIC50MyAuc3BhY2UxLl8ke2tsYXNzfSB7YmFja2dyb3VuZDogI2RiZjYwMSAhaW1wb3J0YW50O31gXHJcbiAgICBub2RlLmlubmVySFRNTCA9IGNzc1xyXG4gIH1cclxufVxyXG5mdW5jdGlvbiBsZWF2ZShlKSB7XHJcbiAgY29uc3Qge2l0ZW19ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI3VybHNgKVxyXG4gIGlmIChub2RlKSB7XHJcbiAgICBub2RlLmlubmVySFRNTCA9IGBgXHJcbiAgfVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNpZiBsaXN0VGFncygkdGFncykubGVuZ3RofVxyXG48dGQgc3R5bGU9XCJ7Y29scz4xID8gJycgOiAnZGlzcGxheTpub25lOyd9XCI+XHJcbiAgPGRpdiBjbGFzcz1cImJvcmRlclwiPlxyXG4gICAgeyNlYWNoIHRncyBhcyBpdGVtfVxyXG4gICAgPGRpdiBjbGFzcz1cInNwYWNlMCB7cm91dGV0YWcoaXRlbSl9XCI+XHJcbiAgICAgIDxsYWJlbCBcclxuICAgICAgZGF0YS1pdGVtPXtpdGVtfVxyXG4gICAgICBvbjptb3VzZWVudGVyPXtlbnRlcn1cclxuICAgICAgb246bW91c2VsZWF2ZT17bGVhdmV9XHJcbiAgICAgID5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XHJcbiAgICAgICAgb246Y2xpY2s9e2NsaWNrZWR9XHJcbiAgICAgICAgYmluZDpjaGVja2VkPXtsaXN0W2l0ZW1dfS8+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJiaWdcIj57aXRlbX08L3NwYW4+XHJcbiAgICAgIDwvbGFiZWw+XHJcbiAgICA8L2Rpdj5cclxuICAgIHsvZWFjaH1cclxuICA8L2Rpdj5cclxuPC90ZD5cclxuey9pZn1cclxuXHJcbjxzdHlsZT5cclxuICB0ZCB7XHJcbiAgICB3aWR0aDogMjAlO1xyXG4gIH1cclxuLmJvcmRlciB7XHJcbiAgYm9yZGVyOiAxcHggZG90dGVkO1xyXG59XHJcbi5zcGFjZTAge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBkYXJrYmx1ZTtcclxuICAvKiBiYWNrZ3JvdW5kOiBkZWVwc2t5Ymx1ZTsgKi9cclxufVxyXG4uc3BhY2UwIHNwYW4ge1xyXG4gIHZlcnRpY2FsLWFsaWduOiAxNSU7XHJcbn1cclxuLnNwYWNlMCAuYmlnIHtcclxuICBtYXJnaW4tbGVmdDogLTRweDtcclxuICBmb250LWZhbWlseTogc2VyaWY7XHJcbn1cclxuLnNwYWNlMD5sYWJlbCB7XHJcbiAgcGFkZGluZy1sZWZ0OiA2cHg7XHJcbn1cclxuLnNwYWNlMD5sYWJlbCBpbnB1dCB7XHJcbiAgdmVydGljYWwtYWxpZ246IC0wLjZweDtcclxufVxyXG4ucnRhZyB7XHJcbiAgY29sb3I6IGdyZXk7XHJcbn1cclxuLnJ0YWcuc2xjIHtcclxuICBjb2xvcjogZ3JlZW47XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxufVxyXG4ucnRhZy5zbGMuZ3JwIHtcclxuICBjb2xvcjogcmVkO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxuLnJ0YWcuc2xjLnVybCxcclxuLnJ0YWcuc2xjLmdycC5pdG0udXJsIHtcclxuICBjb2xvcjogI2MzNmUwMTtcclxufVxyXG4ucnRhZy5zbGMuZ3JwLml0bSB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG59XHJcbi5ydGFnLmdycCB7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogYmVpZ2U7XHJcbn1cclxuLnJ0YWcuZ3JwLml0bSwgLnJ0YWcudXJsIHtcclxuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgRXhwYW5kIGZyb20gJy4uL2J1dHRvbi9FeHBhbmQuc3ZlbHRlJztcclxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uL2J1dHRvbi9Db2xsYXBzZS5zdmVsdGUnO1xyXG5pbXBvcnQgeyBkYXRhc2V0X2RldiB9IGZyb20gJ3N2ZWx0ZS9pbnRlcm5hbCc7XHJcblxyXG5leHBvcnQgbGV0IG5zO1xyXG5jb25zdCBsaXN0ID0gd2luZG93Lm1pdG0ucm91dGVzW25zXS5fY2hpbGRucy5saXN0XHJcblxyXG5mdW5jdGlvbiBxKGtleSkge1xyXG4gIHJldHVybiBrZXkucmVwbGFjZSgvW0AuXS9nLCAnLScpXHJcbn1cclxuZnVuY3Rpb24gY2hpbGRucyhfbnMpIHtcclxuICBjb25zdCB7X2NoaWxkbnN9ID0gd2luZG93Lm1pdG0ucm91dGVzW25zXVxyXG4gIGlmIChfY2hpbGRucyAmJiBfY2hpbGRucy5saXN0IT09dW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoX2NoaWxkbnMubGlzdClcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIFtdXHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIHNldFN1Ym5zKGUpIHtcclxuICBjb25zdCB7Y2hlY2tlZCwgZGF0YXNldH0gPSBlLnRhcmdldFxyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgY29uc3Qge19jaGlsZG5zfSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuc11cclxuICAgIGNvbnN0IHtsaXN0fSA9IF9jaGlsZG5zXHJcbiAgICBjb25zdCB7aXRlbX0gPSBkYXRhc2V0XHJcbiAgICBfY2hpbGRucy5fc3VibnMgPSBsaXN0W2l0ZW1dID8gaXRlbSA6ICcnXHJcbiAgICBpZiAoY2hlY2tlZCkge1xyXG4gICAgICBmb3IgKGNvbnN0IGlkIGluIGxpc3QpIHtcclxuICAgICAgICBpZiAoaWQhPT1pdGVtKSB7XHJcbiAgICAgICAgICBsaXN0W2lkXSA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0YWdzLnNldCh7Li4uJHRhZ3N9KVxyXG4gIH0sIDEpO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInNwYWNlMFwiPlxyXG4gIDwhLS0gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnMyAtLT5cclxuICA8Q29sbGFwc2Ugb246bWVzc2FnZSBuYW1lPVwic3RhdGUyXCIgcT1cIntgLnQyLiR7cShucyl9YH1cIj48L0NvbGxhcHNlPlxyXG4gIDxFeHBhbmQgb246bWVzc2FnZSBuYW1lPVwic3RhdGUyXCIgcT1cIntgLnQyLiR7cShucyl9YH1cIj48L0V4cGFuZD5cclxuICA8c3BhbiBjbGFzcz1cIm5zXCI+XHJcbiAgICB7I2lmIG5zLm1hdGNoKCdfZ2xvYmFsXycpfVxyXG4gICAgICBbPHNwYW4+eycgKiAnfTwvc3Bhbj5dXHJcbiAgICB7OmVsc2V9XHJcbiAgICAgIHtucy5zcGxpdCgnQCcpLnBvcCgpfVxyXG4gICAgey9pZn1cclxuICA8L3NwYW4+XHJcbiAgeyNlYWNoIGNoaWxkbnMobnMpIGFzIGl0ZW19XHJcbiAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2VyXCI+XHJcbiAgICAgIDxpbnB1dFxyXG4gICAgICB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICBkYXRhLWl0ZW09XCJ7aXRlbX1cIlxyXG4gICAgICBvbjpjbGljaz1cIntzZXRTdWJuc31cIlxyXG4gICAgICBiaW5kOmNoZWNrZWQ9e2xpc3RbaXRlbV19Lz5cclxuICAgICAge2l0ZW0uc3BsaXQoJ0AnKVswXX1cclxuICAgIDwvbGFiZWw+XHJcbiAgey9lYWNofVxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnNwYWNlMCB7XHJcbiAgbGluZS1oZWlnaHQ6IDEuNTtcclxuICBmb250LXNpemU6IDE0cHg7XHJcbiAgZm9udC1mYW1pbHk6IHNlcmlmO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgY29sb3I6IGRhcmtibHVlO1xyXG4gIGJhY2tncm91bmQ6IGxpZ2h0Z3JleTtcclxufVxyXG5zcGFuLm5zIHtcclxuICBtYXJnaW46IDA7XHJcbn1cclxuc3Bhbi5ucyBzcGFuIHtcclxuICB2ZXJ0aWNhbC1hbGlnbjogLTVweDtcclxuICBsaW5lLWhlaWdodDogMC44O1xyXG4gIGZvbnQtc2l6ZTogMThweDtcclxufVxyXG5sYWJlbCB7XHJcbiAgZGlzcGxheTogY29udGVudHMgIWltcG9ydGFudDtcclxuICBmb250LXNpemU6IHNtYWxsO1xyXG4gIGNvbG9yOiBicm93bjtcclxufVxyXG5sYWJlbCBpbnB1dCB7XHJcbiAgbWFyZ2luOiAwIC0ycHg7XHJcbiAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcclxufVxyXG48L3N0eWxlPiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBUYWdzMlRpdGxlIGZyb20gJy4vVGFnczJfVGl0bGUuc3ZlbHRlJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbXM7XHJcbmV4cG9ydCBsZXQgbnM7XHJcblxyXG5mdW5jdGlvbiBjbGlja2VkKGUpIHtcclxuICBjb25zdCB7IHJlc2V0UnVsZTIsIHJlc2V0UnVsZTMgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGNvbnN0IHtfX3RhZzEsX190YWcyLF9fdGFnM30gPSAkdGFncztcclxuICBjb25zdCB7aXRlbX0gPSBlLnRhcmdldC5kYXRhc2V0O1xyXG4gIGNvbnN0IG5hbWVzcGFjZSA9IF9fdGFnMltuc107XHJcbiAgY29uc3QgdGFneCA9IHt9O1xyXG4gIGZvciAobGV0IGl0bSBpbiBuYW1lc3BhY2UpIHtcclxuICAgIHRhZ3hbaXRtXSA9IG5hbWVzcGFjZVtpdG1dXHJcbiAgfVxyXG4gIHNldFRpbWVvdXQoKCk9PntcclxuICAgIGNvbnNvbGUubG9nKCdlJywge19fdGFnMixfX3RhZzN9KTtcclxuICAgIHJlc2V0UnVsZTIoJHRhZ3MsIGl0ZW0sIG5zLCB0YWd4KVxyXG4gICAgcmVzZXRSdWxlMygkdGFncywgaXRlbSwgbnMpXHJcbiAgICB0YWdzLnNldCh7XHJcbiAgICAgIC4uLiR0YWdzLFxyXG4gICAgICBfX3RhZzEsXHJcbiAgICAgIF9fdGFnMixcclxuICAgICAgX190YWczLFxyXG4gICAgfSlcclxuICB9LCAxMCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGl0ZW1saXN0KGl0ZW1zKSB7XHJcbiAgY29uc3Qge2ZuOiB7c29ydFRhZ319ID0gd2luZG93Lm1pdG07XHJcbiAgbGV0IGFyciA9IE9iamVjdC5rZXlzKGl0ZW1zKTtcclxuICBpZiAoJHRhZ3MudW5pcSkge1xyXG4gICAgYXJyID0gYXJyLmZpbHRlcih4ID0+IHgubWF0Y2goJzonKSkuZmlsdGVyKHggPT4gIXgubWF0Y2goJ3VybDonKSlcclxuICB9XHJcbiAgcmV0dXJuIGFyci5zb3J0KHNvcnRUYWcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyh0YWdzLCBpdGVtKSB7XHJcbiAgY29uc3Qge19fdGFnMSwgX190YWcyLCBmbjoge3JjbGFzc319ID0gd2luZG93Lm1pdG1cclxuICBjb25zdCBfdGFncyA9IF9fdGFnMltuc11baXRlbV0udGFncyB8fCBbXSAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgY29uc3QgdGFnMiA9IGl0ZW0uc3BsaXQoJzonKVxyXG5cclxuICBsZXQga2xhc1xyXG4gIGlmICh0YWcyWzFdKSB7XHJcbiAgICBrbGFzID0gaXRlbXNbaXRlbV0uc3RhdGUgPyAncnRhZyBzbGMnIDogJ3J0YWcnOyAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgfSBlbHNlIHtcclxuICAgIGtsYXMgPSBpdGVtc1tpdGVtXS5zdGF0ZSA/ICdzdGFnIHNsYycgOiAnJzsgLy8gZmVhdDogdXBkYXRlIF9fdGFnMlxyXG4gIH1cclxuICBpZiAoaXRlbS5tYXRjaCgndXJsOicpKSB7XHJcbiAgICBrbGFzICs9ICcgdXJsJ1xyXG4gIH1cclxuICBmb3IgKGNvbnN0IHRhZyBvZiBfdGFncykge1xyXG4gICAgaWYgKF9fdGFnMVtuc11bdGFnXT09PWZhbHNlKSB7XHJcbiAgICAgIGtsYXMgKz0gJyBncmV5J1xyXG4gICAgICBicmVha1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4ga2xhcyArIGAgXyR7dGFnMi5wb3AoKS5yZXBsYWNlKHJjbGFzcywgJy0nKX1gXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3coaXRlbSkge1xyXG4gIGNvbnN0IHNob3J0ID0ge3JlcXVlc3Q6ICdyZXFzJywgcmVzcG9uc2U6ICdyZXNwJ31cclxuICBjb25zdCBbayx2XSA9IGl0ZW0uc3BsaXQoJzonKTtcclxuICBpZiAodj09PXVuZGVmaW5lZCkgcmV0dXJuIGs7XHJcbiAgcmV0dXJuIGAke3Z9eyR7c2hvcnRba10gfHwga319YDtcclxufVxyXG5mdW5jdGlvbiBsaW5rVGFncyhpdGVtKSB7XHJcbiAgY29uc3Qge3RhZ3N9ID0gd2luZG93Lm1pdG0uX190YWcyW25zXVtpdGVtXSAvLyBmZWF0OiB1cGRhdGUgX190YWcyXHJcbiAgY29uc3QgbGlua1RhZ3MgPSB0YWdzICYmIHRhZ3MubGVuZ3RoID8gYFske3RhZ3Muam9pbignLCcpfV1gIDogJydcclxuICByZXR1cm4gbGlua1RhZ3M7XHJcbn1cclxuZnVuY3Rpb24gaXNHcm91cChpdGVtKSB7XHJcbiAgY29uc3QgW3NlYywgdGFnXSA9IGl0ZW0uc3BsaXQoJzonKVxyXG4gIHJldHVybiB0YWcgJiYgc2VjIT09J3VybCdcclxufVxyXG5mdW5jdGlvbiB1cmxsaXN0KF90YWdzLCBpdGVtKSB7XHJcbiAgY29uc3Qge19fdGFnMiwgZm46IHsgbm9UYWdJblJ1bGUsIHVuaXEgfX0gPSB3aW5kb3cubWl0bTtcclxuICBjb25zdCB7dGFnc30gPSBfX3RhZzJbbnNdW2l0ZW1dIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICBpZiAodGFncyAmJiB0YWdzLmxlbmd0aCkge1xyXG4gICAgaXRlbSA9IGAke2l0ZW19ICR7dGFncy5qb2luKCcgJyl9YFxyXG4gIH1cclxuICBsZXQgb2JqID0gd2luZG93Lm1pdG0ucm91dGVzW25zXVtpdGVtXVxyXG4gIGlmIChvYmo9PT11bmRlZmluZWQpIHtcclxuICAgIG9iaiA9IFtdXHJcbiAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShvYmopKSB7XHJcbiAgICBvYmogPSBPYmplY3Qua2V5cyhvYmopXHJcbiAgfVxyXG4gIG9iaiA9IG9iai5tYXAobm9UYWdJblJ1bGUpLmZpbHRlcih1bmlxKVxyXG4gIHJldHVybiBvYmpcclxufVxyXG5mdW5jdGlvbiBhbGx0YWdzKHRhZ3MsIGl0ZW0sIHBhdGgpIHtcclxuICBjb25zdCB7IHRhZ3NJbl9fdGFnMyB9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgcmV0dXJuIHRhZ3NJbl9fdGFnMyh0YWdzLCBucywgcGF0aCwgaXRlbSlcclxufVxyXG5mdW5jdGlvbiBzcGFjZXgodGFncywgaXRlbSwgcGF0aCkge1xyXG4gIGxldCBrbGFzcyA9IGl0ZW1zW2l0ZW1dLnN0YXRlID8gJ3NsYycgOiAnJzsgLy8gZmVhdDogdXBkYXRlIF9fdGFnMlxyXG4gIGNvbnN0IHsgcmNsYXNzLCBpc1J1bGVPZmYgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGlzUnVsZU9mZih0YWdzLCBucywgcGF0aCkgJiYgKGtsYXNzICs9ICcgZ3JleScpO1xyXG4gIGNvbnN0IF90YWdzID0gYWxsdGFncyh0YWdzLCBpdGVtLCBwYXRoKVxyXG4gIF90YWdzLmxlbmd0aCAmJiAoa2xhc3MgKz0gYCBfJHtfdGFncy5qb2luKCcgXycpfWApXHJcbiAgcmV0dXJuIGAke2tsYXNzfSBfJHtpdGVtLnNwbGl0KCc6JylbMV0ucmVwbGFjZShyY2xhc3MsICctJyl9YFxyXG59XHJcbmZ1bmN0aW9uIHEoa2V5KSB7XHJcbiAgcmV0dXJuIGtleS5yZXBsYWNlKC9bQC5dL2csICctJylcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjaWYgT2JqZWN0LmtleXMoaXRlbXMpLmxlbmd0aH1cclxuPGRpdiBjbGFzcz1cImJvcmRlclwiPlxyXG4gIDwhLS0gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnMyAtLT5cclxuICA8VGFnczJUaXRsZSBvbjptZXNzYWdlIHtuc30vPlxyXG4gIHsjZWFjaCBpdGVtbGlzdChpdGVtcykgYXMgaXRlbX1cclxuICAgIDxkaXYgY2xhc3M9XCJ0MiB7cShucyl9XCI+XHJcbiAgICB7I2lmIGlzR3JvdXAoaXRlbSl9XHJcbiAgICAgIDxkZXRhaWxzPlxyXG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzPVwic3BhY2UxIHtyb3V0ZXRhZygkdGFncywgaXRlbSl9XCI+XHJcbiAgICAgICAgICA8bGFiZWw+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgICAgICBkYXRhLWl0ZW09e2l0ZW19XHJcbiAgICAgICAgICAgIG9uOmNsaWNrPXtjbGlja2VkfSBcclxuICAgICAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtc1tpdGVtXS5zdGF0ZX0vPiA8IS0tIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzIgLS0+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaXRtIHtpdGVtLm1hdGNoKCc6JykgPyAnYmlnJyA6ICcnfVwiPntzaG93KGl0ZW0pfTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJsaW5rLXRhZ3NcIj57bGlua1RhZ3MoaXRlbSl9PC9zcGFuPlxyXG4gICAgICAgICAgPC9sYWJlbD4gXHJcbiAgICAgICAgPC9zdW1tYXJ5PlxyXG4gICAgICAgIHsjZWFjaCB1cmxsaXN0KCR0YWdzLCBpdGVtKSBhcyBwYXRofVxyXG4gICAgICAgICAgPGRpdiBjbGFzcz1cInNwYWNleCB7c3BhY2V4KCR0YWdzLCBpdGVtLCBwYXRoKX1cIj57cGF0aH08L2Rpdj5cclxuICAgICAgICB7L2VhY2h9XHJcbiAgICAgIDwvZGV0YWlscz5cclxuICAgIHs6ZWxzZX1cclxuICAgICAgPGRpdiBjbGFzcz1cInNwYWNlMSB7cm91dGV0YWcoJHRhZ3MsIGl0ZW0pfVwiPlxyXG4gICAgICAgIDxsYWJlbD5cclxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgICAgZGF0YS1pdGVtPXtpdGVtfVxyXG4gICAgICAgICAgb246Y2xpY2s9e2NsaWNrZWR9IFxyXG4gICAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtc1tpdGVtXS5zdGF0ZX0vPiA8IS0tIC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzIgLS0+XHJcbiAgICAgICAgICA8c3BhbiBjbGFzcz1cIml0bSB7aXRlbS5tYXRjaCgnOicpID8gJ2JpZycgOiAnJ31cIj57c2hvdyhpdGVtKX08L3NwYW4+XHJcbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImxpbmstdGFnc1wiPntsaW5rVGFncyhpdGVtKX08L3NwYW4+XHJcbiAgICAgICAgPC9sYWJlbD5cclxuICAgICAgPC9kaXY+XHJcbiAgICB7L2lmfVxyXG4gICAgPC9kaXY+XHJcbiAgey9lYWNofVxyXG48L2Rpdj5cclxuey9pZn1cclxuXHJcbjxzdHlsZT5cclxuLm5zIHtcclxuICBtYXJnaW4tbGVmdDogLTNweDtcclxuICBmb250LXNpemU6IDE1cHg7XHJcbn1cclxuLmJvcmRlciB7XHJcbiAgYm9yZGVyOiAxcHggZ3JleSBzb2xpZDtcclxufVxyXG5zdW1tYXJ5IGxhYmVsIHtcclxuICBtYXJnaW4tbGVmdDogMTFweDtcclxuICBtYXJnaW4tdG9wOiAtMTVweDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xyXG59XHJcbnN1bW1hcnkgbGFiZWwgaW5wdXQge1xyXG4gIHZlcnRpY2FsLWFsaWduOiAtMC42cHg7XHJcbn1cclxuc3VtbWFyeS5zcGFjZTEge1xyXG4gIHBhZGRpbmctbGVmdDogNXB4O1xyXG59XHJcbnN1bW1hcnkuc3BhY2UxIC5saW5rLXRhZ3Mge1xyXG4gIC8qIHZlcnRpY2FsLWFsaWduOiAyNSU7ICovXHJcbiAgLyogZm9udC1zdHlsZTogaXRhbGljOyAqL1xyXG4gIG1hcmdpbi1sZWZ0OiAtNnB4O1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxuICBmb250LWZhbWlseTogcm9ib3RvO1xyXG4gIGNvbG9yOiBkYXJrbWFnZW50YTtcclxufVxyXG4uZ3JleSAubGluay10YWdzIHtcclxuICBjb2xvcjogZ3JheTtcclxuICBmb250LXdlaWdodDogMTAwO1xyXG59XHJcbi5zcGFjZTEge1xyXG4gIGNvbG9yOiBncmV5O1xyXG4gIHBhZGRpbmctbGVmdDogMTZweDtcclxufVxyXG4uc3BhY2UxIHNwYW4ge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICB2ZXJ0aWNhbC1hbGlnbjogMnB4O1xyXG59XHJcbi5zcGFjZTEgLml0bSB7XHJcbiAgbWFyZ2luLWxlZnQ6IC0ycHg7XHJcbiAgZm9udC1mYW1pbHk6IHNlcmlmO1xyXG59XHJcbi5zcGFjZXgge1xyXG4gIHBhZGRpbmctbGVmdDogMzBweDtcclxuICBjb2xvcjogI2VjZDdkNztcclxuICBmb250LXNpemU6IDEycHg7XHJcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcclxufVxyXG4uc3BhY2UxLnJ0YWcuZ3JleSB7XHJcbiAgY29sb3I6ICNkMThhOGE7XHJcbn1cclxuLnNwYWNleC5zbGMge1xyXG4gIGNvbG9yOiBibHVldmlvbGV0O1xyXG59XHJcbi5zcGFjZXguZ3JleSB7XHJcbiAgY29sb3I6ICNlY2Q3ZDc7XHJcbn1cclxuLnJ0YWcge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICBjb2xvcjogY2FkZXRibHVlO1xyXG4gIGJhY2tncm91bmQtY29sb3I6IGJlaWdlO1xyXG59XHJcbi5ydGFnLnVybCB7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogaW5oZXJpdDtcclxufVxyXG4ucnRhZy5zbGMge1xyXG4gIGNvbG9yOiByZWQ7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxufVxyXG4ucnRhZy5zbGMudXJsIHtcclxuICBjb2xvcjogI2MzNmUwMTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbi5zdGFnLnNsYyB7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBjb2xzO1xyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgVGFnczIxIGZyb20gJy4vVGFnczJfMS5zdmVsdGUnO1xyXG5pbXBvcnQgeyBzdGF0ZXMgfSBmcm9tICcuLi9idXR0b24vc3RhdGVzLmpzJztcclxuXHJcbmZ1bmN0aW9uIG5zcGFjZShucykge1xyXG4gIGNvbnN0IHtfc3VibnN9ID0gd2luZG93Lm1pdG0ucm91dGVzW25zXS5fY2hpbGRuc1xyXG4gIHJldHVybiBfc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPHRkIHN0eWxlPVwid2lkdGg6eyRzdGF0ZXMuY2hldnJvbj09PSdbPDxdJyA/IDQ1IDogMzV9JTsge2NvbHM+MCA/ICcnIDogJ2Rpc3BsYXk6bm9uZTsnfVwiPlxyXG57I2VhY2ggT2JqZWN0LmtleXMoJHRhZ3MuX190YWcyKSBhcyBuc31cclxuICB7I2lmIHdpbmRvdy5taXRtLmZuLm9uZVNpdGUoJHRhZ3MsIG5zKX1cclxuICAgIDwhLS0gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnMyAtLT5cclxuICAgIDxUYWdzMjEgb246bWVzc2FnZSBpdGVtcz17JHRhZ3MuX190YWcyW25zcGFjZShucyldfSBucz17bnNwYWNlKG5zKX0vPlxyXG4gIHsvaWZ9XHJcbnsvZWFjaH1cclxuPC90ZD5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbXM7XHJcbmV4cG9ydCBsZXQgaXRlbTtcclxuZXhwb3J0IGxldCBwYXRoO1xyXG5leHBvcnQgbGV0IG5zO1xyXG5cclxuZnVuY3Rpb24gY2xpY2tlZChlKSB7XHJcbiAgY29uc3Qge19fdGFnM30gPSAkdGFncztcclxuICBjb25zdCBfaXRlbSA9IF9fdGFnM1tuc11bcGF0aF1baXRlbV1cclxuXHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qge2l0ZW06IGl9ID0gZS50YXJnZXQuZGF0YXNldDtcclxuICAgIGNvbnN0IFtncm91cDEsIGlkMV0gPSBpLnNwbGl0KCd1cmw6JykucG9wKCkuc3BsaXQoJ34nKTtcclxuXHJcbiAgICBmb3IgKGxldCBpdG0gaW4gX2l0ZW0udGFncykgeyAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgICAgIGNvbnN0IFtncm91cDIsIGlkMl0gPSBpdG0uc3BsaXQoJ3VybDonKS5wb3AoKS5zcGxpdCgnficpO1xyXG4gICAgICBpZiAoZ3JvdXAxPT09Z3JvdXAyICYmIGl0ZW0hPT1pdG0pIHtcclxuICAgICAgICBpZiAoaWQyPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBfaXRlbS50YWdzW2l0bV0gPSBfaXRlbS50YWdzW2ldXHJcbiAgICAgICAgfSBlbHNlIGlmIChpZDEhPT11bmRlZmluZWQgJiYgaWQxIT09aWQyKSB7XHJcbiAgICAgICAgICBfaXRlbS50YWdzW2l0bV0gPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRhZ3Muc2V0KHtcclxuICAgICAgLi4uJHRhZ3MsXHJcbiAgICAgIF9fdGFnMyxcclxuICAgIH0pXHJcbiAgfSwgNTApO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3V0ZXRhZyh0YWdzLCBpdGVtKSB7XHJcbiAgY29uc3QgeyByY2xhc3MgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGxldCBrbGFzID0gaXRlbXNbaXRlbV0gPyAncnRhZyBzbGMnIDogJ3J0YWcnO1xyXG4gIGlmIChpdGVtLmluZGV4T2YoJ3VybDonKT4tMSkge1xyXG4gICAga2xhcyArPSAnIHVybCdcclxuICB9IGVsc2UgaWYgKGl0ZW0uaW5kZXhPZignOicpPi0xKSB7XHJcbiAgICBrbGFzICs9IHRhZ3MuX190YWcyW25zXVtpdGVtXSA/ICcgc2xjJyA6ICcnXHJcbiAgICBrbGFzICs9ICcgcjInXHJcbiAgfVxyXG4gIHJldHVybiBgJHtrbGFzfSBfJHtpdGVtLnNwbGl0KCc6JykucG9wKCkucmVwbGFjZShyY2xhc3MsICctJyl9YFxyXG59XHJcblxyXG5mdW5jdGlvbiB0aXRsZShpdGVtKSB7XHJcbiAgY29uc3QgW2tleSwgdGFnXSA9IGl0ZW0uc3BsaXQoJzonKVxyXG4gIHJldHVybiB0YWcgPyBgJHt0YWd9eyR7a2V5fX1gIDoga2V5XHJcbn1cclxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcclxuICBjb25zdCB7dW5pcSwgc29ydFRhZ30gPSB3aW5kb3cubWl0bS5mbjtcclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhpdGVtcy50YWdzKSAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgaWYgKHRhZ3MuX190YWcyW25zXVtpdGVtXSE9PXVuZGVmaW5lZCkge1xyXG4gICAgYXJyLnB1c2goaXRlbSlcclxuICB9XHJcbiAgcmV0dXJuIGFyci5maWx0ZXIodW5pcSkuc29ydChzb3J0VGFnKVxyXG59XHJcbmZ1bmN0aW9uIGNoZWNrKGl0ZW0pIHtcclxuICByZXR1cm4gaXRlbS5pbmRleE9mKCd1cmw6Jyk9PT0tMSAmJiBpdGVtLmluZGV4T2YoJzonKT4tMVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNlYWNoIHhpdGVtcygkdGFncykgYXMgaXRlbX1cclxuICA8ZGl2IGNsYXNzPVwic3BhY2UzIHtyb3V0ZXRhZygkdGFncywgaXRlbSl9XCI+XHJcbiAgICB7I2lmIGNoZWNrKGl0ZW0pIH1cclxuICAgICAgPGxhYmVsPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgIGRhdGEtaXRlbT17aXRlbX1cclxuICAgICAgICBjaGVja2VkPXskdGFncy5fX3RhZzJbbnNdW2l0ZW1dfSBkaXNhYmxlZC8+XHJcbiAgICAgICAgPHNwYW4+e3RpdGxlKGl0ZW0pfTwvc3Bhbj5cclxuICAgICAgPC9sYWJlbD5cclxuICAgIHs6ZWxzZX1cclxuICAgICAgPGxhYmVsPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgIGRhdGEtaXRlbT17aXRlbX1cclxuICAgICAgICBvbjpjbGljaz17Y2xpY2tlZH0gXHJcbiAgICAgICAgYmluZDpjaGVja2VkPXtpdGVtcy50YWdzW2l0ZW1dfS8+XHJcbiAgICAgICAgPHNwYW4+e3RpdGxlKGl0ZW0pfTwvc3Bhbj4gICAgICBcclxuICAgICAgPC9sYWJlbD5cclxuICAgIHsvaWZ9XHJcbiAgPC9kaXY+XHJcbnsvZWFjaH1cclxuXHJcbjxzdHlsZT5cclxuLnNwYWNlMyB7XHJcbiAgcGFkZGluZy1sZWZ0OiAyOHB4O1xyXG59XHJcbi5zcGFjZTMgc3BhbiB7XHJcbiAgdmVydGljYWwtYWxpZ246IDE1JTtcclxufVxyXG4ucnRhZyB7XHJcbiAgZm9udC1zaXplOiAxM3B4O1xyXG4gIGNvbG9yOiBjYWRldGJsdWU7XHJcbn1cclxuLnJ0YWcuc2xjIHtcclxuICBjb2xvcjogIzVkYWM3NTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG59XHJcbi5ydGFnLnNsYy51cmwge1xyXG4gIGNvbG9yOiAjYzM2ZTAxO1xyXG59XHJcbi5ydGFnLnNsYy5yMiB7XHJcbiAgY29sb3I6ICNmZjE2MTZcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5pbXBvcnQgVGFnczMzIGZyb20gJy4vVGFnczNfMy5zdmVsdGUnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtcztcclxuZXhwb3J0IGxldCBwYXRoO1xyXG5leHBvcnQgbGV0IG5zO1xyXG5cclxuZnVuY3Rpb24gdGl0bGUoaXRlbSkge1xyXG4gIHJldHVybiBgJHtpdGVtLnNwbGl0KCc6JylbMF19OmA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFjdGl2ZShpdGVtKSB7XHJcbiAgbGV0IGVuYWJsZWQgPSAkdGFncy5fX3RhZzJbbnNdW2l0ZW1dPT09ZmFsc2UgPyBmYWxzZSA6IHRydWVcclxuICBmb3IgKGNvbnN0IGlkIGluIGl0ZW1zW2l0ZW1dKSB7XHJcbiAgICBpZiAoaXRlbXNbaXRlbV1baWRdPT09ZmFsc2UpIHtcclxuICAgICAgZW5hYmxlZCA9IGZhbHNlXHJcbiAgICAgIGJyZWFrXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBlbmFibGVkID8gJ2F0YWcgc2xjJyA6ICdhdGFnJztcclxufVxyXG5cclxuZnVuY3Rpb24geGl0ZW1zKHRhZ3MpIHtcclxuICBjb25zdCB7X190YWczfSA9IHRhZ3M7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gX190YWczW25zXTtcclxuICBjb25zdCB0eXBzID0gbmFtZXNwYWNlW3BhdGhdO1xyXG4gIGxldCBhcnIgPSBPYmplY3Qua2V5cyh0eXBzKTtcclxuICByZXR1cm4gYXJyO1xyXG59XHJcbmZ1bmN0aW9uIHh0YWdzKHRhZ3MsIGl0ZW0pIHtcclxuICBjb25zdCBhcnIgPSBPYmplY3Qua2V5cyhpdGVtc1tpdGVtXS50YWdzKSAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgY29uc3QgbWFwID0gYXJyLm1hcCh4ID0+IHguc3BsaXQoJzonKS5wb3AoKSlcclxuICByZXR1cm4gbWFwLnNvcnQoKS5qb2luKCcgJylcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbnsjZWFjaCB4aXRlbXMoJHRhZ3MpIGFzIGl0ZW19XHJcbiAgPGRldGFpbHM+XHJcbiAgICA8c3VtbWFyeSBjbGFzcz1cInNwYWNlMiB7YWN0aXZlKGl0ZW0pfVwiPlxyXG4gICAgICB7dGl0bGUoaXRlbSl9XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwicHJvcFwiPntpdGVtc1tpdGVtXS5ub3RlfHwnJ308L3NwYW4+XHJcbiAgICAgIDxzcGFuIGNsYXNzPVwidGFnc1wiPntgPCR7eHRhZ3MoJHRhZ3MsIGl0ZW0pfT5gfTwvc3Bhbj5cclxuICAgIDwvc3VtbWFyeT5cclxuICAgIDxUYWdzMzMgaXRlbXM9e2l0ZW1zW2l0ZW1dfSB7aXRlbX0ge3BhdGh9IHtuc30vPlxyXG4gIDwvZGV0YWlscz5cclxuey9lYWNofVxyXG5cclxuPHN0eWxlPlxyXG5kZXRhaWxzIHN1bW1hcnkgLnByb3AsXHJcbmRldGFpbHNbb3Blbl0gc3VtbWFyeSAudGFncyB7XHJcbiAgZGlzcGxheTogbm9uZTtcclxufVxyXG5kZXRhaWxzIHN1bW1hcnkgLnRhZ3MsXHJcbmRldGFpbHNbb3Blbl0gc3VtbWFyeSAucHJvcCB7XHJcbiAgZm9udC1mYW1pbHk6IFJvYm90bztcclxuICBmb250LXNpemU6IDExcHg7XHJcbiAgZGlzcGxheTogaW5saW5lO1xyXG59XHJcbmRldGFpbHMgc3VtbWFyeSAudGFncyB7XHJcbiAgbWFyZ2luLWxlZnQ6IC01cHg7XHJcbiAgY29sb3I6IGdyZWVuO1xyXG59XHJcbmRldGFpbHMgc3VtbWFyeSAucHJvcCB7XHJcbiAgY29sb3I6ICNjNTk0OTRcclxufVxyXG5zdW1tYXJ5LnNwYWNlMSxcclxuc3VtbWFyeS5zcGFjZTIge1xyXG4gIG1hcmdpbi1ib3R0b206IDJweDtcclxufVxyXG4uc3BhY2UyIHtcclxuICBwYWRkaW5nLWxlZnQ6IDEycHg7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBjb2xvcjogZ3JlZW47XHJcbn1cclxuLmF0YWcge1xyXG4gIGNvbG9yOiAjZGFjNWM1XHJcbn1cclxuLmF0YWcuc2xjIHtcclxuICBjb2xvcjogcmVkO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogYmVpZ2U7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IFRhZ3MzMiBmcm9tICcuL1RhZ3MzXzIuc3ZlbHRlJztcclxuaW1wb3J0IEV4cGFuZCBmcm9tICcuLi9idXR0b24vRXhwYW5kLnN2ZWx0ZSc7XHJcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi9idXR0b24vQ29sbGFwc2Uuc3ZlbHRlJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbXM7XHJcbmV4cG9ydCBsZXQgbnM7XHJcblxyXG5sZXQgbmFtZXNwYWNlO1xyXG5cclxuZnVuY3Rpb24gcShrZXkpIHtcclxuICByZXR1cm4ga2V5LnJlcGxhY2UoL1tALl0vZywgJy0nKVxyXG59XHJcbmZ1bmN0aW9uIGJ0bkV4cGFuZChlKSB7XHJcbiAgY29uc3Qgbm9kZSA9IGUudGFyZ2V0LnBhcmVudEVsZW1lbnRcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGNvbnN0IGV4cCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdvcGVuJylcclxuICAgIGlmIChleHAhPT1udWxsKSB7XHJcbiAgICAgIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgIyR7bm9kZS5pZH0gZGV0YWlsc2ApXHJcbiAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiBub2RlLnNldEF0dHJpYnV0ZSgnb3BlbicsICcnKSlcclxuICAgIH1cclxuICB9LCAwKVxyXG59XHJcbmZ1bmN0aW9uIHhpdGVtcyh0YWdzKSB7XHJcbiAgY29uc3Qge19fdGFnM30gPSB0YWdzO1xyXG4gIG5hbWVzcGFjZSA9IF9fdGFnM1tuc107XHJcbiAgY29uc3QgYXJyID0gT2JqZWN0LmtleXMobmFtZXNwYWNlKS5zb3J0KCk7XHJcbiAgcmV0dXJuIGFycjtcclxufVxyXG5mdW5jdGlvbiB4dGFncyhwYXRoKSB7XHJcbiAgY29uc3QgeyByY2xhc3MgfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGxldCBzZWNzID0gbmFtZXNwYWNlW3BhdGhdO1xyXG4gIGxldCBhcnIgPSBPYmplY3Qua2V5cyhzZWNzKS5maWx0ZXIoeD0+eFswXSE9PSc6Jyk7XHJcbiAgbGV0IHRhZzEgPSB7fVxyXG4gIGNvbnN0IGtsYXNzID0gYXJyLm1hcCh4PT4ge1xyXG4gICAgY29uc3QgYXJyID0gT2JqZWN0LmtleXMoc2Vjc1t4XSk7XHJcbiAgICBpZiAoc2Vjc1t4XS50YWdzKSB7XHJcbiAgICAgIHRhZzEgPSB7Li4udGFnMSwgLi4uc2Vjc1t4XS50YWdzfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyci5tYXAoeD0+eC5cclxuICAgICAgICBzcGxpdCgnOicpLlxyXG4gICAgICAgIHBvcCgpLlxyXG4gICAgICAgIHJlcGxhY2UocmNsYXNzLCAnLScpXHJcbiAgICApLmpvaW4oJyBfJylcclxuICB9KVxyXG4gIHRhZzEgPSBPYmplY3Qua2V5cyh0YWcxKVxyXG4gIHRhZzEgPSB0YWcxLmxlbmd0aCA/IGBfJHt0YWcxLmpvaW4oJyBfJykucmVwbGFjZSgvdXJsOi9nLCAnJykucmVwbGFjZShyY2xhc3MsICctJyl9YCA6ICcnXHJcbiAgcmV0dXJuIGAke3RhZzF9IF8ke2tsYXNzLmpvaW4oJyBfJyl9YDtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJib3JkZXJcIj5cclxuICA8ZGl2IGNsYXNzPVwic3BhY2UwXCI+XHJcbiAgICA8IS0tIGZlYXQ6IGF1dG8gY29sbGFwc2VkIGJldHdlZW4gdGFnMiAmIHRhZzMgLS0+XHJcbiAgICA8Q29sbGFwc2Ugb246bWVzc2FnZSBuYW1lPVwic3RhdGUzXCIgcT1cIntgLnQzLiR7cShucyl9YH1cIj48L0NvbGxhcHNlPlxyXG4gICAgPEV4cGFuZCBvbjptZXNzYWdlIG5hbWU9XCJzdGF0ZTNcIiBxPVwie2AudDMuJHtxKG5zKX1gfVwiPjwvRXhwYW5kPlxyXG4gICAgPHNwYW4gY2xhc3M9XCJuc1wiPlxyXG4gICAgICB7I2lmIG5zLm1hdGNoKCdfZ2xvYmFsXycpfVxyXG4gICAgICAgIFs8c3Bhbj57JyAqICd9PC9zcGFuPl1cclxuICAgICAgezplbHNlfVxyXG4gICAgICAgIHtucy5zcGxpdCgnQCcpLnBvcCgpfVxyXG4gICAgICB7L2lmfVxyXG4gICAgPC9zcGFuPlxyXG4gIDwvZGl2PlxyXG4gIDxkaXYgY2xhc3M9XCJ0MyB7cShucyl9XCI+XHJcbiAgICB7I2VhY2ggeGl0ZW1zKCR0YWdzKSBhcyBwYXRoLCBpfVxyXG4gICAgPGRldGFpbHMgaWQ9XCJwYXRoe2l9XCI+XHJcbiAgICAgIDxzdW1tYXJ5IG9uOmNsaWNrPVwie2J0bkV4cGFuZH1cIiBjbGFzcz1cInNwYWNlMSB7eHRhZ3MocGF0aCl9XCI+e3BhdGh9PC9zdW1tYXJ5PlxyXG4gICAgICA8VGFnczMyIGl0ZW1zPXtpdGVtc1twYXRoXX0ge3BhdGh9IHtuc30vPlxyXG4gICAgPC9kZXRhaWxzPlxyXG4gIHsvZWFjaH1cclxuXHJcbiAgPC9kaXY+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYm9yZGVyIHtcclxuICBib3JkZXI6IDFweCBzb2xpZDtcclxufVxyXG4uc3BhY2UwIHtcclxuICBsaW5lLWhlaWdodDogMS41O1xyXG4gIGZvbnQtc2l6ZTogMTRweDtcclxuICBmb250LWZhbWlseTogc2VyaWY7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxuICBiYWNrZ3JvdW5kOiBsaWdodGdyZXk7XHJcbiAgY29sb3I6IGRhcmtibHVlO1xyXG59XHJcbi5zcGFjZTEge1xyXG4gIGZvbnQtc2l6ZTogMTNweDtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGNvbG9yOiBibHVldmlvbGV0O1xyXG4gIHBhZGRpbmctbGVmdDogM3B4O1xyXG59XHJcbnNwYW4ubnMgc3BhbiB7XHJcbiAgdmVydGljYWwtYWxpZ246IC01cHg7XHJcbiAgbGluZS1oZWlnaHQ6IDAuODtcclxuICBmb250LXNpemU6IDE4cHg7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBjb2xzO1xyXG5leHBvcnQgbGV0IF9yZXNpemU7XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBUYWdzMzEgZnJvbSAnLi9UYWdzM18xLnN2ZWx0ZSc7XHJcblxyXG5mdW5jdGlvbiBpc3RhZyh0YWdzLCBucykge1xyXG4gIGNvbnN0IHtfX3RhZzIsIGZpbHRlclVybH0gPSB0YWdzO1xyXG4gIGNvbnN0IHt0b1JlZ2V4LCBvbmVTaXRlfSA9IHdpbmRvdy5taXRtLmZuO1xyXG4gIGNvbnN0IGFyciA9ICBvbmVTaXRlKHRhZ3MsIG5zKSA/IE9iamVjdC5rZXlzKF9fdGFnMltuc10pIDogW107XHJcbiAgbGV0IG9rID0gYXJyLmZpbHRlcih4PT4geC5tYXRjaCgndXJsOicpIHx8ICF4Lm1hdGNoKCc6JykpLmxlbmd0aDtcclxuICBpZiAobnMubWF0Y2goJ0AnKSkge1xyXG4gICAgb2sgPSBmYWxzZVxyXG4gIH0gZWxzZSAgaWYgKGZpbHRlclVybCkge1xyXG4gICAgY29uc3Qgcmd4ID0gdG9SZWdleChucy5yZXBsYWNlKC9+LywnW14uXSonKSk7XHJcbiAgICBvayA9IG9rICYmIG1pdG0uYnJvd3Nlci5hY3RpdmVVcmwubWF0Y2gocmd4KSB8fCBvbmVTaXRlKHRhZ3MsIG5zKTsgLy9ucz09PSdfZ2xvYmFsXyc7XHJcbiAgfVxyXG4gIHJldHVybiBvaztcclxufVxyXG5mdW5jdGlvbiBuc3BhY2UobnMpIHtcclxuICBjb25zdCB7X3N1Ym5zfSA9IHdpbmRvdy5taXRtLnJvdXRlc1tuc10uX2NoaWxkbnNcclxuICByZXR1cm4gX3N1Ym5zIHx8IG5zIC8vIGZlYXQ6IGNoZyB0byBjaGlsZCBuYW1lc3BhY2VcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjx0ZCBzdHlsZT1cIndpZHRoOntfcmVzaXplPT09J1s8PF0nID8gMzUgOiA0NX0lOyB7Y29scz09PTMgPyAnJyA6ICdkaXNwbGF5Om5vbmU7J31cIj5cclxueyNlYWNoIE9iamVjdC5rZXlzKCR0YWdzLl9fdGFnMykgYXMgbnN9XHJcbiAgeyNpZiBpc3RhZygkdGFncywgbnMpfVxyXG4gICAgPCEtLSBmZWF0OiBhdXRvIGNvbGxhcHNlZCBiZXR3ZWVuIHRhZzIgJiB0YWczIC0tPlxyXG4gICAgPFRhZ3MzMSBvbjptZXNzYWdlIGl0ZW1zPXskdGFncy5fX3RhZzNbbnNwYWNlKG5zKV19IG5zPXtuc3BhY2UobnMpfS8+XHJcbiAgey9pZn1cclxuey9lYWNofVxyXG48L3RkPlxyXG4iLCI8c2NyaXB0PlxyXG5leHBvcnQgbGV0IGJ0biA9IHt9XHJcbmV4cG9ydCBsZXQgX2lkID0gJydcclxuXHJcbmZ1bmN0aW9uIGhpZGVCdG4oYikgeyBcclxuICBsZXQgYXJyID0gT2JqZWN0LmtleXMoYikuZmlsdGVyKHggPT4gIWJbeF0pXHJcbiAgY29uc3QgaGlkZSA9IGFyci5tYXAoeCA9PiB7XHJcbiAgICBpZiAoeC5zbGljZSgwLDEpPT09J18nIHx8IHg9PT0nZGV2Jykge1xyXG4gICAgICByZXR1cm4gYC4ke19pZH0+bGk+LiR7eH1gXHJcbiAgICB9IGVsc2UgaWYgKHg9PT0nZGVmJykge1xyXG4gICAgICByZXR1cm4gYC4ke19pZH0+bGk+Ll9ub3RhZ2BcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBgLiR7X2lkfSBsaS4ke3h9IGRpdmBcclxuICAgIH1cclxuICB9KVxyXG4gIGNvbnN0IHMxID0gYCR7aGlkZS5qb2luKCcsJyl9IHtkaXNwbGF5OiBub25lO31gXHJcbiAgY29uc3QgYjIgPSBiLmRlZiA/IGAuJHtfaWR9PmxpPi5fbm90YWcge2Rpc3BsYXk6IGJsb2NrICFpbXBvcnRhbnQ7fWAgOiAnJ1xyXG4gIGNvbnN0IGNvbnRlbnQgPSAgYDxzdHlsZT4ke3MxfVxcbiR7YjJ9PHN0eWxlPmBcclxuICByZXR1cm4gY29udGVudFxyXG59XHJcbi8vIHRvIGJlIHJlcmVuZGVyZWQgZnVuYyBuZWVkIHRvIGJlIHBhc3MgaW5cclxuPC9zY3JpcHQ+XHJcblxyXG48c3Bhbj57QGh0bWwgaGlkZUJ0bihidG4pfTwvc3Bhbj5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IFVybFN0eWxlIGZyb20gJy4vVXJsLXN0eWxlLnN2ZWx0ZSc7XHJcblxyXG5leHBvcnQgbGV0IGl0ZW1zID0ge31cclxuZXhwb3J0IGxldCBidG4gPSB7fVxyXG5leHBvcnQgbGV0IF9pZCA9ICcnXHJcblxyXG5sZXQgYWxsID0gdHJ1ZVxyXG5sZXQgYXJyID0gW11cclxuXHJcbmZ1bmN0aW9uIGFsbGNoZWNrKCkge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgZm9yIChjb25zdCBpZCBpbiBidG4pIHtcclxuICAgICAgYnRuW2lkXSA9IGFsbFxyXG4gICAgfVxyXG4gIH0sIDEpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGl0ZW1BcnJheShpKSB7XHJcbiAgYXJyID0gT2JqZWN0LmtleXMoaSlcclxuICByZXR1cm4gJydcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbntpdGVtQXJyYXkoaXRlbXMpfVxyXG48ZGl2IGNsYXNzPVwiYnRuLWNvbnRhaW5lclwiPlxyXG4gIHsjaWYgYXJyLmxlbmd0aD4xfVxyXG4gICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxyXG4gICAgICA8aW5wdXRcclxuICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgb246Y2xpY2s9XCJ7YWxsY2hlY2t9XCJcclxuICAgICAgYmluZDpjaGVja2VkPXthbGx9Lz5cclxuICAgICAgYWxsXHJcbiAgICA8L2xhYmVsPlxyXG4gIHsvaWZ9XHJcbiAgeyNlYWNoIGFyciBhcyBpdGVtfVxyXG4gICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tlclwiPlxyXG4gICAgICA8aW5wdXRcclxuICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgYmluZDpjaGVja2VkPXtidG5baXRlbV19Lz5cclxuICAgICAge2l0ZW19XHJcbiAgICA8L2xhYmVsPlxyXG4gIHsvZWFjaH1cclxuPC9kaXY+XHJcbjxVcmxTdHlsZSB7X2lkfSB7YnRufS8+XHJcblxyXG48c3R5bGU+XHJcbi5idG4tY29udGFpbmVyIHtcclxuICBkaXNwbGF5OiBpbmxpbmU7XHJcbiAgZm9udC1zaXplOiAxMXB4O1xyXG59XHJcbjwvc3R5bGU+IiwiPHNjcmlwdD5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5cclxuY29uc3QgbGlzdCA9IChpdG0sIGdhcD0nICcpID0+IGl0bSA/IGl0bS5qb2luKGdhcCkgOiAnJ1xyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ1cmwge2l0ZW0udGFncyAmJiBpdGVtLnRhZ3Muam9pbignICcpfVwiPlxyXG4gICoge2l0ZW0udXJsfVxyXG4gIDxzcGFuIGNsYXNzPVwic2VjcyB7bGlzdChpdGVtLnNlY3MpfVwiPntgeyR7bGlzdChpdGVtLnNlY3MpfX1gfTwvc3Bhbj5cclxuICA8c3BhbiBjbGFzcz1cImN0eXAge2xpc3QoaXRlbS5jdHlwKX1cIj57IGl0ZW0uY3R5cCA/IGBbJHtsaXN0KGl0ZW0uc2VjcywnLCcpfV1gIDogJyd9PC9zcGFuPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuICAudXJsIHtcclxuICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbiAgICBtYXJnaW4tbGVmdDogN3B4O1xyXG4gICAgY29sb3I6IGNob2NvbGF0ZTtcclxuICAgIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XHJcbiAgfVxyXG4gIC51cmwuX25vdGFnIHtcclxuICAgIGNvbG9yOiBjb3JuZmxvd2VyYmx1ZTtcclxuICB9XHJcbiAgLnVybCBzcGFuIHtcclxuICAgIG1hcmdpbi1sZWZ0OiAtNXB4O1xyXG4gICAgZm9udC1mYW1pbHk6IHN5c3RlbS11aTtcclxuICAgIGZvbnQtc2l6ZTogc21hbGxlcjtcclxuICAgIGZvbnQtd2VpZ2h0OiAzMDA7XHJcbiAgfVxyXG4gIC51cmwgc3Bhbi5pbWFnZSB7XHJcbiAgICBkaXNwbGF5OiBpbmxpbmU7XHJcbiAgfVxyXG4gIDwvc3R5bGU+IiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgcmVyZW5kZXIgfSBmcm9tICcuL3JlcmVuZGVyLmpzJztcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmltcG9ydCBUaXRsZTEgZnJvbSAnLi9UaXRsZS0xLnN2ZWx0ZSc7XHJcbmltcG9ydCBUaXRsZTIgZnJvbSAnLi9UaXRsZS0yLnN2ZWx0ZSc7XHJcbmltcG9ydCBUaXRsZUJ0biBmcm9tICcuL1RpdGxlLWJ0bi5zdmVsdGUnO1xyXG5pbXBvcnQgVGl0bGVVcmwgZnJvbSAnLi9UaXRsZS11cmwuc3ZlbHRlJztcclxuXHJcblxyXG5jb25zdCByZXBsYWNlID0gKHMscDEscDIscDMpID0+IHAzO1xyXG5sZXQgYnRuMSA9IHtcclxuICByZXNwb25zZTogdHJ1ZSxcclxuICByZXF1ZXN0OiB0cnVlLFxyXG4gIGNhY2hlOiB0cnVlLFxyXG4gIG1vY2s6IHRydWUsXHJcbiAgaHRtbDogdHJ1ZSxcclxuICBqc29uOiB0cnVlLFxyXG4gIGNzczogdHJ1ZSxcclxuICBqczogdHJ1ZSxcclxuICBsb2c6IHRydWUsXHJcbiAgZGVmOiB0cnVlLFxyXG59XHJcbmxldCBidG4yID0ge1xyXG4gIGZsYWc6IHRydWUsXHJcbiAgYXJnczogdHJ1ZSxcclxuICBkZWY6IHRydWVcclxufVxyXG5sZXQgX3VybHMsIF9jZmdzLCB0aXRsZTEsIHRpdGxlMlxyXG5mdW5jdGlvbiBpdGVtbGlzdCh0YWdzU3RvcmUsIHJlcmVuZGVyKSB7XHJcbiAgY29uc29sZS5sb2coJ3JlcmVuZGVyLi4uJyk7XHJcbiAgY29uc3QgeyBfX3RhZzEsIF9fdGFnMiwgX190YWczLCBfX3VybHMsIHJvdXRlcywgZm4gfSA9IHdpbmRvdy5taXRtO1xyXG4gIGNvbnN0IHsgcm1ldGhvZCwgbm9UYWdJblJ1bGUsIGlzUnVsZU9mZiwgb25lU2l0ZSB9ID0gZm47XHJcbiAgbGV0IHVybHMgPSB7fVxyXG4gIGxldCB1cmwyID0ge31cclxuICBsZXQgdXJsMyA9IHt9XHJcblxyXG4gIGZ1bmN0aW9uIGFkZFVybDIoc2VjLCBwYXRoLCB0YWdzKSB7XHJcbiAgICBjb25zdCB7IHJjbGFzcyB9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKHJtZXRob2QsIHJlcGxhY2UpXHJcbiAgICBzZWMgPSBzZWMuc3BsaXQoJzonKVswXVxyXG4gICAgaWYgKHVybDJbcGF0aF09PT11bmRlZmluZWQpIHtcclxuICAgICAgdXJsMltwYXRoXSA9IHt9XHJcbiAgICB9XHJcbiAgICBpZiAodXJsMltwYXRoXVtzZWNdPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgIHVybDJbcGF0aF1bc2VjXSA9IHt9XHJcbiAgICB9XHJcbiAgICB1cmwyW3BhdGhdW3NlY10gPSB0cnVlXHJcbiAgICBpZiAodGFncyAmJiBBcnJheS5pc0FycmF5KHRhZ3MpKSB7XHJcbiAgICAgIGZvciAobGV0IHRhZyBvZiB0YWdzKSB7XHJcbiAgICAgICAgdGFnID0gJ18nK3RhZy5zcGxpdCgnOicpLnBvcCgpLnJlcGxhY2UocmNsYXNzLCAnLScpIC8vIGZlYXQ6IHRhZ3MgaW4gdXJsXHJcbiAgICAgICAgaWYgKHVybDNbcGF0aF09PT11bmRlZmluZWQpIHtcclxuICAgICAgICAgIHVybDNbcGF0aF0gPSB7fVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodXJsM1twYXRoXVt0YWddPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICB1cmwzW3BhdGhdW3RhZ10gPSB7fVxyXG4gICAgICAgIH1cclxuICAgICAgICB1cmwzW3BhdGhdW3RhZ10gPSB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZnVuY3Rpb24gYWRkVXJscyhwYXRoKSB7XHJcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKHJtZXRob2QsIHJlcGxhY2UpXHJcbiAgICB1cmxzW3BhdGhdID0gdHJ1ZVxyXG4gICAgcmV0dXJuIHBhdGhcclxuICB9XHJcblxyXG4gIGZvciAobGV0IG5zIGluIF9fdGFnMikge1xyXG4gICAgaWYgKG9uZVNpdGUodGFnc1N0b3JlLCBucykpIHtcclxuICAgICAgbnMgPSByb3V0ZXNbbnNdLl9jaGlsZG5zLl9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbiAgICAgIGNvbnN0IHNlY3MgPSAgX190YWcyW25zXVxyXG4gICAgICBmb3IgKGxldCBzZWMgaW4gc2Vjcykge1xyXG4gICAgICAgIGNvbnN0IHRhZzIgPSBzZWNzW3NlY11cclxuICAgICAgICBpZiAodGFnMi5zdGF0ZSAmJiAhc2VjLm1hdGNoKC8oZmxhZ3xhcmdzKTovKSkge1xyXG4gICAgICAgICAgaWYgKHNlYy5tYXRjaCgndXJsOicpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gIF9fdGFnM1tuc11cclxuICAgICAgICAgICAgZm9yIChjb25zdCBwYXRoIGluIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCFpc1J1bGVPZmYod2luZG93Lm1pdG0sIG5zLCBwYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgX3BhdGggPSBhZGRVcmxzKHBhdGgpXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNlYyBpbiBwYXRoc1twYXRoXSkge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCB0YWdzID0gcGF0aHNbcGF0aF1bc2VjXS50YWdzIC8vIHRhZ3MzXHJcbiAgICAgICAgICAgICAgICAgIGlmIChzZWMuc2xpY2UoMCwgMSkhPT0nOicpIHtcclxuICAgICAgICAgICAgICAgICAgICBhZGRVcmwyKHNlYywgX3BhdGgsIE9iamVjdC5rZXlzKHRhZ3MpKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAoc2VjLm1hdGNoKCc6JykpIHtcclxuICAgICAgICAgICAgbGV0IHNraXAgPSBmYWxzZVxyXG4gICAgICAgICAgICBjb25zdCB0YWdzID0gdGFnMi50YWdzIHx8IFtdXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpIHtcclxuICAgICAgICAgICAgICBpZiAoX190YWcxW25zXVt0YWddPT09ZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHNraXAgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2tpcCkge1xyXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0YWdzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgIHNlYyA9IGAke3NlY30gJHt0YWdzLmpvaW4oJyAnKX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgdGFnID0gc2VjLnNwbGl0KCc6JylbMV07XHJcbiAgICAgICAgICAgIGxldCBhcnIgPSByb3V0ZXNbbnNdW3NlY11cclxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycikpIHtcclxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHVybCBpbiBhcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBub1RhZ0luUnVsZSh1cmwpXHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzUnVsZU9mZih3aW5kb3cubWl0bSwgbnMsIHBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IF9wYXRoID0gYWRkVXJscyh1cmwpXHJcbiAgICAgICAgICAgICAgICAgIGFkZFVybDIoc2VjLCBfcGF0aCwgW3RhZ10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdXJsIG9mIGFycikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IG5vVGFnSW5SdWxlKHVybClcclxuICAgICAgICAgICAgICAgIGlmICghaXNSdWxlT2ZmKHdpbmRvdy5taXRtLCBucywgcGF0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgX3BhdGggPSBhZGRVcmxzKHVybClcclxuICAgICAgICAgICAgICAgICAgYWRkVXJsMihzZWMsIF9wYXRoLCBbdGFnXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZm9yIChsZXQgbnMgaW4gX190YWczKSB7XHJcbiAgICBpZiAob25lU2l0ZSh0YWdzU3RvcmUsIG5zKSkge1xyXG4gICAgICBucyA9IHJvdXRlc1tuc10uX2NoaWxkbnMuX3N1Ym5zIHx8IG5zIC8vIGZlYXQ6IGNoZyB0byBjaGlsZCBuYW1lc3BhY2VcclxuICAgICAgY29uc3QgcGF0aHMgPSBfX3RhZzNbbnNdXHJcbiAgICAgIGZvciAoY29uc3QgcGF0aCBpbiBwYXRocykge1xyXG4gICAgICAgIGlmICghaXNSdWxlT2ZmKHdpbmRvdy5taXRtLCBucywgcGF0aCkpIHtcclxuICAgICAgICAgIGNvbnN0IF9wYXRoID0gYWRkVXJscyhwYXRoKVxyXG4gICAgICAgICAgY29uc3Qgc2VjcyA9IHBhdGhzW3BhdGhdXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IHNlYyBpbiBzZWNzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBzZWNzW3NlY10udGFncyAvLyB0YWdzM1xyXG4gICAgICAgICAgICBpZiAoc2VjLnNsaWNlKDAsIDEpIT09JzonKSB7XHJcbiAgICAgICAgICAgICAgYWRkVXJsMihzZWMsIF9wYXRoLCBPYmplY3Qua2V5cyh0YWdzKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBmb3IgKGxldCBucyBpbiBfX3VybHMpIHtcclxuICAgIGlmIChvbmVTaXRlKHRhZ3NTdG9yZSwgbnMpKSB7XHJcbiAgICAgIG5zID0gcm91dGVzW25zXS5fY2hpbGRucy5fc3VibnMgfHwgbnMgLy8gZmVhdDogY2hnIHRvIGNoaWxkIG5hbWVzcGFjZVxyXG4gICAgICBjb25zdCBfdXJscyA9IF9fdXJsc1tuc10gfHwgW11cclxuICAgICAgZm9yIChjb25zdCB1cmwgaW4gX3VybHMpIHtcclxuICAgICAgICBjb25zdCB7cHVyZSwgc2VjcywgdGFnc30gPSBfdXJsc1t1cmxdXHJcbiAgICAgICAgaWYgKHB1cmUpIHtcclxuICAgICAgICAgIGZvciAoY29uc3Qgc2VjIGluIHNlY3MpIHtcclxuICAgICAgICAgICAgY29uc3QgX3BhdGggPSBhZGRVcmxzKHVybClcclxuICAgICAgICAgICAgYWRkVXJsMihzZWMsIF9wYXRoLCB0YWdzKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBsZXQgYXJyID0gT2JqZWN0LmtleXModXJscykuc29ydCgpXHJcbiAgY29uc3QgdXJsczIgPSBbXVxyXG4gIGNvbnN0IHVybHMzID0gW11cclxuICBmb3IgKGNvbnN0IHVybCBvZiBhcnIpIHtcclxuICAgIGNvbnN0IHNlY3MgPSBPYmplY3Qua2V5cyh1cmwyW3VybF0pXHJcbiAgICBjb25zdCB0YWdzID0gT2JqZWN0LmtleXModXJsM1t1cmxdKVxyXG4gICAgbGV0IGN0eXAgPSBbXVxyXG4gICAgZm9yIChsZXQgbnMgaW4gX191cmxzKSB7XHJcbiAgICAgIGlmIChvbmVTaXRlKHRhZ3NTdG9yZSwgbnMpKSB7XHJcbiAgICAgICAgbnMgPSByb3V0ZXNbbnNdLl9jaGlsZG5zLl9zdWJucyB8fCBucyAvLyBmZWF0OiBjaGcgdG8gY2hpbGQgbmFtZXNwYWNlXHJcbiAgICAgICAgY29uc3QgX3VybHMgPSBfX3VybHNbbnNdIHx8IFtdXHJcbiAgICAgICAgZm9yIChjb25zdCBfdXJsIGluIF91cmxzKSB7XHJcbiAgICAgICAgICBpZiAodXJsPT09X3VybCkge1xyXG4gICAgICAgICAgICBjdHlwID0gX3VybHNbX3VybF0uY3R5cFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgIWN0eXAubGVuZ3RoICYmIChjdHlwID0gZmFsc2UpXHJcbiAgICBpZiAoc2Vjcy5maW5kKHggPT4gL14oYXJnc3xmbGFnKS8udGVzdCh4KSkpIHtcclxuICAgICAgdXJsczMucHVzaCh7dXJsLCBzZWNzLCBjdHlwLCB0YWdzfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHVybHMyLnB1c2goe3VybCwgc2VjcywgY3R5cCwgdGFnc30pXHJcbiAgICB9XHJcbiAgfVxyXG4gIHRpdGxlMSA9IHt9XHJcbiAgdGl0bGUyID0ge31cclxuICBfdXJscyA9IHVybHMyXHJcbiAgX2NmZ3MgPSB1cmxzM1xyXG4gIGZvciAoY29uc3QgaXRlbSBvZiBfdXJscykge1xyXG4gICAgaWYgKGl0ZW0udGFncy5pbmRleE9mKCdfbm90YWcnKSkge1xyXG4gICAgICB0aXRsZTEuZGVmID0gdHJ1ZVxyXG4gICAgfVxyXG4gICAgZm9yIChjb25zdCBzZWMgb2YgaXRlbS5zZWNzKSB7XHJcbiAgICAgIHRpdGxlMVtzZWNdID0gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgX2NmZ3MpIHtcclxuICAgIGlmIChpdGVtLnRhZ3MuaW5kZXhPZignX25vdGFnJykpIHtcclxuICAgICAgdGl0bGUyLmRlZiA9IHRydWVcclxuICAgIH1cclxuICAgIGZvciAoY29uc3Qgc2VjIG9mIGl0ZW0uc2Vjcykge1xyXG4gICAgICB0aXRsZTJbc2VjXSA9IHRydWVcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuICcnXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG57aXRlbWxpc3QoJHRhZ3MsICRyZXJlbmRlcil9XHJcbjx0YWJsZT5cclxuICA8dHI+XHJcbiAgICA8dGg+PFRpdGxlMT48VGl0bGVCdG4gX2lkPVwidXJsc1wiIGl0ZW1zPXt0aXRsZTF9IGJ0bj17YnRuMX0vPjwvVGl0bGUxPjwvdGg+XHJcbiAgICA8dGg+PFRpdGxlMj48VGl0bGVCdG4gX2lkPVwiZmFyZ1wiIGl0ZW1zPXt0aXRsZTJ9IGJ0bj17YnRuMn0vPjwvVGl0bGUyPjwvdGg+XHJcbiAgPC90cj5cclxuICA8dHI+XHJcbiAgICA8dGQ+XHJcbiAgICAgIDxzdHlsZSBpZD1cInVybHNcIj48L3N0eWxlPlxyXG4gICAgICA8dWwgY2xhc3M9XCJ1cmxzXCI+XHJcbiAgICAgICAgeyNlYWNoIF91cmxzIGFzIGl0ZW19XHJcbiAgICAgICAgPGxpIGNsYXNzPVwie2l0ZW0uc2Vjcy5qb2luKCcgJyl9XCI+PFRpdGxlVXJsIHtpdGVtfS8+PC9saT5cclxuICAgICAgICB7L2VhY2h9XHJcbiAgICAgIDwvdWw+ICAgICAgXHJcbiAgICA8L3RkPlxyXG4gICAgPHRkPlxyXG4gICAgICA8c3R5bGUgaWQ9XCJmYXJnXCI+PC9zdHlsZT5cclxuICAgICAgPHVsIGNsYXNzPVwiZmFyZ1wiPlxyXG4gICAgICAgIHsjZWFjaCBfY2ZncyBhcyBpdGVtfVxyXG4gICAgICAgIDxsaSBjbGFzcz1cIntpdGVtLnNlY3Muam9pbignICcpfVwiPjxUaXRsZVVybCB7aXRlbX0vPjwvbGk+XHJcbiAgICAgICAgey9lYWNofVxyXG4gICAgICA8L3VsPiAgICAgIFxyXG4gICAgPC90ZD5cclxuICA8L3RyPlxyXG48L3RhYmxlPlxyXG5cclxuPHN0eWxlPlxyXG50YWJsZSB7XHJcbiAgd2lkdGg6IGNhbGMoMTAwJSAtIDEycHgpO1xyXG4gIG1hcmdpbjogNXB4O1xyXG59XHJcbnRoLCB0ZCB7XHJcbiAgd2lkdGg6IDUwJTtcclxufVxyXG50aCB7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbn1cclxudGQge1xyXG4gIHBhZGRpbmc6IDVweCAwO1xyXG4gIGJvcmRlcjogdGhpbiBzb2xpZDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgVXJscyBmcm9tICcuL1VybHMuc3ZlbHRlJztcclxuaW1wb3J0IHsgZXVybHMgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5mdW5jdGlvbiBjbGlja2VkKGUpIHtcclxuICBjb25zdCBleHBhbmRlZCA9ICEkZXVybHMuZXhwYW5kZWRcclxuICBldXJscy5zZXQoe1xyXG4gICAgZXhwYW5kZWRcclxuICB9KVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxueyNpZiAkZXVybHMuZXhwYW5kZWR9XHJcbjxkZXRhaWxzIGNsYXNzPVwidXJsc1wiIG9wZW49XCJ0cnVlXCI+XHJcbiAge0BodG1sICc8c3R5bGUgaWQ9XCJ1cmxzXCI+PC9zdHlsZT4nfVxyXG4gIDxzdW1tYXJ5IG9uOmNsaWNrPXtjbGlja2VkfT5FZmZlY3RlZCBVcmwocyk8L3N1bW1hcnk+XHJcbiAgPFVybHMvPlxyXG48L2RldGFpbHM+XHJcbns6ZWxzZX1cclxuPGRldGFpbHMgY2xhc3M9XCJ1cmxzXCI+XHJcbiAge0BodG1sICc8c3R5bGUgaWQ9XCJ1cmxzXCI+PC9zdHlsZT4nfVxyXG4gIDxzdW1tYXJ5IG9uOmNsaWNrPXtjbGlja2VkfT5FZmZlY3RlZCBVcmwocyk8L3N1bW1hcnk+XHJcbiAgPFVybHMvPlxyXG48L2RldGFpbHM+XHJcbnsvaWZ9XHJcblxyXG48c3R5bGU+XHJcbmRldGFpbHMsIHN1bW1hcnkge1xyXG4gIG91dGxpbmU6IG5vbmU7XHJcbn1cclxuc3VtbWFyeSB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBmb250LXNpemU6IDEzcHg7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbiAgYmFja2dyb3VuZDogI2ZkYWFhYTtcclxufVxyXG4udXJscyBzdW1tYXJ5OmhvdmVyIHtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjFmNmZiYmQ7XHJcbn1cclxuLnVybHMge1xyXG4gIGhlaWdodDogMTAwJTtcclxuICBkaXNwbGF5OiBmbGV4O1xyXG4gIG92ZXJmbG93OiBhdXRvO1xyXG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbn1cclxuLnVybHMgc3VtbWFyeSB7XHJcbiAgcG9zaXRpb246IHN0aWNreTtcclxuICBiYWNrZ3JvdW5kOiB3aGl0ZTtcclxuICB0b3A6IDBweDtcclxufVxyXG48L3N0eWxlPlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuaW1wb3J0IHsgc3RhdGVzIH0gZnJvbSAnLi4vYnV0dG9uL3N0YXRlcy5qcyc7XHJcbmltcG9ydCAgQ2hldnJvbiBmcm9tICcuLi9idXR0b24vQ2hldnJvbi5zdmVsdGUnO1xyXG5pbXBvcnQgQlN0YXRpYyBmcm9tICcuLi9ib3gvQlN0YXRpYy5zdmVsdGUnO1xyXG5pbXBvcnQgQkhlYWRlciBmcm9tICcuLi9ib3gvQkhlYWRlci5zdmVsdGUnO1xyXG5pbXBvcnQgQlRhYmxlIGZyb20gJy4uL2JveC9CVGFibGUuc3ZlbHRlJztcclxuaW1wb3J0IFByZXNldCBmcm9tICcuL1ByZXNldC5zdmVsdGUnO1xyXG5pbXBvcnQgVGFnczEgZnJvbSAnLi9UYWdzMV8uc3ZlbHRlJzsgXHJcbmltcG9ydCBUYWdzMiBmcm9tICcuL1RhZ3MyXy5zdmVsdGUnOyBcclxuaW1wb3J0IFRhZ3MzIGZyb20gJy4vVGFnczNfLnN2ZWx0ZSc7IFxyXG5pbXBvcnQgRWZmZWN0ZWQgZnJvbSAnLi9FZmZlY3RlZC5zdmVsdGUnO1xyXG5cclxuZXhwb3J0IGxldCB0b3AgPSBcIjIzXCI7XHJcbmV4cG9ydCBsZXQgbGVmdDtcclxuXHJcbmxldCBibG9jayA9IHRydWU7XHJcbmxldCBjb2xzID0gMztcclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnNvbGUud2Fybignb25Nb3VudCB0YWdzL2luZGV4Jyk7XHJcbn0pO1xyXG5cclxud2luZG93Lm1pdG0uZmlsZXMuZ2V0Um91dGVfZXZlbnRzLnRhZ3NUYWJsZSA9ICgpID0+IHtcclxuICAvLyB3aW5kb3cud3NfX3NlbmQoJ2dldFJvdXRlJywgJycsIHJvdXRlSGFuZGxlcik7XHJcbiAgY29uc3Qge19fdGFnMSwgX190YWcyLCBfX3RhZzN9ID0gd2luZG93Lm1pdG07XHJcbiAgY29uc29sZS5sb2coJ2V2ZW50cy50YWdzVGFibGUuLi4nKTtcclxuICBjb25zdCB0Z3JvdXAgPSB7fTtcclxuICBmb3IgKGxldCBucyBpbiBfX3RhZzIpIHtcclxuICAgIGNvbnN0IHRza3MgPSBfX3RhZzJbbnNdXHJcbiAgICBmb3IgKGxldCB0YXNrIGluIHRza3MpIHtcclxuICAgICAgY29uc3QgW2ssdl0gPSB0YXNrLnNwbGl0KCc6Jyk7XHJcbiAgICAgIGlmICh2ICYmIGshPT0ndXJsJykge1xyXG4gICAgICAgIHRncm91cFt2XSA9IHRydWVcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gXHJcbiAgdGFncy5zZXQoe1xyXG4gICAgLi4uJHRhZ3MsXHJcbiAgICBfX3RhZzEsXHJcbiAgICBfX3RhZzIsXHJcbiAgICBfX3RhZzMsXHJcbiAgICB0Z3JvdXAsXHJcbiAgfSlcclxufVxyXG5mdW5jdGlvbiBvbmVDbGljayhlKSB7XHJcbiAgY29uc3Qge19jb2xzfSA9IGUudGFyZ2V0LmRhdGFzZXQ7XHJcbiAgY29scyA9ICtfY29scztcclxufVxyXG5mdW5jdGlvbiBoYW5kbGVNZXNzYWdlKGV2ZW50KSB7XHJcbiAgY29uc3Qge2FsbCwgbmFtZX0gPSBldmVudC5kZXRhaWxcclxuICBsZXQgcVxyXG4gIGlmIChuYW1lPT09J3N0YXRlMicpIHtcclxuICAgIGFsbC5jaGV2cm9uID0gYWxsLnN0YXRlMiA/ICdbPDxdJyA6ICdbPDxdJ1xyXG4gICAgYWxsLnN0YXRlMyA9IHt9IC8vIGZlYXQ6IGF1dG8gY29sbGFwc2VkIGJldHdlZW4gdGFnMiAmIHRhZzNcclxuICAgIHEgPSAnLnQzJ1xyXG4gIH0gZWxzZSBpZiAobmFtZT09PSdzdGF0ZTMnKSB7XHJcbiAgICBhbGwuY2hldnJvbiA9ICFhbGwuc3RhdGUzID8gJ1s+Pl0nIDogJ1s+Pl0nXHJcbiAgICBhbGwuc3RhdGUyID0ge30gLy8gZmVhdDogYXV0byBjb2xsYXBzZWQgYmV0d2VlbiB0YWcyICYgdGFnM1xyXG4gICAgcSA9ICcudDInXHJcbiAgfVxyXG4gIGNvbnN0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgJHtxfSBkZXRhaWxzW29wZW5dYClcclxuICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4gbm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKSkgIFxyXG4gIHN0YXRlcy5zZXQoYWxsKVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInZib3hcIj5cclxuICA8ZGV0YWlscyBvcGVuPVwidHJ1ZVwiPlxyXG4gICAgPHN1bW1hcnk+RW5hYmxlIC8gRGlzYWJsZSBUYWdzIDxQcmVzZXQgLz48L3N1bW1hcnk+XHJcbiAgICA8ZGl2IGNsYXNzPVwidmJveC0xXCI+XHJcbiAgICAgIDxCU3RhdGljIHt0b3B9IHtibG9ja30+XHJcbiAgICAgICAgPEJIZWFkZXIge2xlZnR9PlxyXG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLV9jb2xzPTMgb246Y2xpY2s9XCJ7b25lQ2xpY2t9XCI+W2Z1bGxdPC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uIGRhdGEtX2NvbHM9MiBvbjpjbGljaz1cIntvbmVDbGlja31cIj5bdHdvXTwvYnV0dG9uPlxyXG4gICAgICAgICAgPGJ1dHRvbiBkYXRhLV9jb2xzPTEgb246Y2xpY2s9XCJ7b25lQ2xpY2t9XCI+W29uZV08L2J1dHRvbj5cclxuICAgICAgICAgIDxDaGV2cm9uLz5cclxuICAgICAgICA8L0JIZWFkZXI+XHJcbiAgICAgICAgPEJUYWJsZT5cclxuICAgICAgICAgIDx0ciBjbGFzcz1cInNldC10YWdzXCI+XHJcbiAgICAgICAgICAgIDxUYWdzMSB7Y29sc30vPlxyXG4gICAgICAgICAgICA8VGFnczIge2NvbHN9IG9uOm1lc3NhZ2U9e2hhbmRsZU1lc3NhZ2V9Lz5cclxuICAgICAgICAgICAgPFRhZ3MzIHtjb2xzfSBvbjptZXNzYWdlPXtoYW5kbGVNZXNzYWdlfS8+XHJcbiAgICAgICAgICA8L3RyPlxyXG4gICAgICAgIDwvQlRhYmxlPlxyXG4gICAgICA8L0JTdGF0aWM+ICBcclxuICAgIDwvZGl2PlxyXG4gIDwvZGV0YWlscz5cclxuICA8RWZmZWN0ZWQvPlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnZib3gge1xyXG4gIGZsZXg6IGF1dG87XHJcbiAgZGlzcGxheTogZmxleDtcclxuICBwb3NpdGlvbjogcmVsYXRpdmU7XHJcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAyM3B4KTtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcclxufVxyXG4udmJveC0xIHtcclxuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xyXG59XHJcbmRldGFpbHMsIHN1bW1hcnkge1xyXG4gIG91dGxpbmU6IG5vbmU7XHJcbn1cclxuc3VtbWFyeSB7XHJcbiAgYm9yZGVyOiBub25lO1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBmb250LXNpemU6IDEzcHg7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbiAgYmFja2dyb3VuZDogI2ZkYWFhYTtcclxufVxyXG5idXR0b24ge1xyXG4gIGJvcmRlcjogMDtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgY29sb3I6ICMwMDJhZmY7XHJcbiAgbWFyZ2luLXRvcDogLTVweDtcclxuICBtYXJnaW4tcmlnaHQ6IC01cHg7XHJcbiAgdmVydGljYWwtYWxpZ246IDAuNnB4O1xyXG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xyXG4gIHBhZGRpbmc6IDJweCAxcHggMXB4IDFweDtcclxuICBmb250LWZhbWlseTogQ29uc29sYXMsIEx1Y2lkYSBDb25zb2xlLCBDb3VyaWVyIE5ldywgbW9ub3NwYWNlO1xyXG4gIGZvbnQtd2VpZ2h0OiA3MDA7XHJcbiAgZm9udC1zaXplOiAxMHB4O1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+IC8vIGZlYXQ6IHByb2ZpbGVcclxuaW1wb3J0IHsgdGFncyB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbmV4cG9ydCBsZXQgaXRlbTtcclxuXHJcbmZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XHJcbiAgbGV0IHtyb3V0ZX0gPSBlLnRhcmdldC5kYXRhc2V0O1xyXG4gIGlmIChyb3V0ZT09PSR0YWdzLnJvdXRlKSB7XHJcbiAgICByb3V0ZSA9ICcnXHJcbiAgfVxyXG4gIHRhZ3Muc2V0KHtcclxuICAgIC4uLiR0YWdzLFxyXG4gICAgcm91dGVcclxuICB9KVxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cInRkLWl0ZW0ge2l0ZW0ucm91dGU9PT0kdGFncy5yb3V0ZX1cIlxyXG4gIGRhdGEtcm91dGU9e2l0ZW0ucm91dGV9XHJcbiAgb246Y2xpY2s9XCJ7Y2xpY2tIYW5kbGVyfVwiXHJcbj57aXRlbS5yb3V0ZX08L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuLnRkLWl0ZW0ge1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBwYWRkaW5nOiAwLjFyZW07XHJcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XHJcbiAgcGFkZGluZy1sZWZ0OiA1cHg7XHJcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNjMGQ4Y2NhMTtcclxufVxyXG4udGQtaXRlbS50cnVlIHtcclxuICBjb2xvcjogYmx1ZTtcclxuICBmb250LXdlaWdodDogYm9sZGVyO1xyXG4gIGJhY2tncm91bmQ6IGdyZWVueWVsbG93O1xyXG59XHJcbjwvc3R5bGU+XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IGxpc3QgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xyXG48L3NjcmlwdD5cclxuXHJcbnsjZWFjaCAkbGlzdC5yb3V0ZXogYXMgcm91dGV9XHJcbiAgPEl0ZW0gaXRlbT17e3JvdXRlfX0vPlxyXG57L2VhY2h9XHJcbiIsIjxzY3JpcHQ+XHJcbmltcG9ydCB7IHRhZ3MgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcbmltcG9ydCBCdXR0b24gZnJvbSAnLi9CdXR0b24uc3ZlbHRlJztcclxuXHJcbmltcG9ydCBWQm94MiBmcm9tICcuLi9ib3gvVkJveDIuc3ZlbHRlJztcclxuaW1wb3J0IENvbnRlbnQgZnJvbSAnLi9Db250ZW50LnN2ZWx0ZSc7XHJcbmltcG9ydCBMaXN0IGZyb20gJy4vTGlzdC5zdmVsdGUnO1xyXG5cclxubGV0IGxlZnQgPSAxNjU7XHJcbmNvbnN0IHRvcCA9ICcwJztcclxuY29uc3QgdGl0bGUgPSAnLVJvdXRlKHMpLScgXHJcbmNvbnN0IGlkID0gJ3JvdXRlTGVmdCc7XHJcblxyXG5mdW5jdGlvbiBkcmFnZW5kKHtkZXRhaWx9KSB7XHJcbiAgbGVmdCA9IGRldGFpbC5sZWZ0XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48QnV0dG9uLz5cclxueyNpZiAkdGFncy5saXN0fVxyXG4gIDxWQm94MiB7dGl0bGV9IHt0b3B9IHtsZWZ0fSB7ZHJhZ2VuZH0ge0xpc3R9PlxyXG4gICAgPENvbnRlbnQge2xlZnR9Lz5cclxuICA8L1ZCb3gyPlxyXG57OmVsc2V9ICBcclxuICA8Q29udGVudC8+XHJcbnsvaWZ9XHJcbiIsIjxzY3JpcHQ+XHJcbmZ1bmN0aW9uIGJ0bk9wZW4oKSB7XHJcbiAgd3NfX3NlbmQoJ29wZW5Ib21lJywgJycsIGRhdGEgPT4ge1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgb3BlbiBob21lIGZvbGRlciEnKTtcclxuICB9KTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxidXR0b24gb246Y2xpY2s9e2J0bk9wZW59Pk9wZW4gSG9tZTwvYnV0dG9uPlxyXG4iLCI8c2NyaXB0PlxyXG5mdW5jdGlvbiBidG5Db2RlKCkge1xyXG4gIHdzX19zZW5kKCdjb2RlSG9tZScsICcnLCBkYXRhID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdEb25lIGNvZGUgaG9tZSBmb2xkZXIhJyk7XHJcbiAgfSk7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48YnV0dG9uIG9uOmNsaWNrPXtidG5Db2RlfT5Db2RlIEhvbWU8L2J1dHRvbj5cclxuIiwiPHNjcmlwdD5cclxuZnVuY3Rpb24gYnRuUG9zdG1lc3NhZ2UoZSkge1xyXG4gIGNvbnN0IHBvc3RtZXNzYWdlID0gZS50YXJnZXQuY2hlY2tlZDtcclxuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywge3Bvc3RtZXNzYWdlfSwgZGF0YSA9PiB7XHJcbiAgICB3aW5kb3cubWl0bS5jbGllbnQucG9zdG1lc3NhZ2UgPSBkYXRhLnBvc3RtZXNzYWdlO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgY2hhbmdlIHN0YXRlIHBvc3RtZXNzYWdlJywgZGF0YSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZsYWcoKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLmNsaWVudC5wb3N0bWVzc2FnZTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCI+XHJcbiAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG9uOmNsaWNrPXtidG5Qb3N0bWVzc2FnZX0gY2hlY2tlZD17ZmxhZygpfT5cclxuICBQb3N0IE1lc3NhZ2VzXHJcbjwvbGFiZWw+XHJcbiIsIjxzY3JpcHQ+XHJcbmZ1bmN0aW9uIGJ0bkNzcChlKSB7XHJcbiAgY29uc3QgY3NwID0gZS50YXJnZXQuY2hlY2tlZDtcclxuICB3c19fc2VuZCgnc2V0Q2xpZW50Jywge2NzcH0sIGRhdGEgPT4ge1xyXG4gICAgd2luZG93Lm1pdG0uY2xpZW50LmNzcCA9IGRhdGEuY3NwO1xyXG4gICAgY29uc29sZS5sb2coJ0RvbmUgY2hhbmdlIHN0YXRlIGNzcCcsIGRhdGEpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmbGFnKCkge1xyXG4gIHJldHVybiB3aW5kb3cubWl0bS5jbGllbnQuY3NwO1xyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIj5cclxuICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgb246Y2xpY2s9e2J0bkNzcH0gY2hlY2tlZD17ZmxhZygpfT5cclxuICBDb250ZW50IFNlYy4gUG9saWN5XHJcbjwvbGFiZWw+XHJcbiIsIi8vIGZlYXQ6IG1hcmtkb3duXHJcbmltcG9ydCB7IHdyaXRhYmxlIH0gZnJvbSAnc3ZlbHRlL3N0b3JlJ1xyXG5cclxuZXhwb3J0IGNvbnN0IHNvdXJjZSA9IHdyaXRhYmxlKHtcclxuICBvcGVuRGlzYWJsZWQ6IGZhbHNlLFxyXG4gIHNhdmVEaXNhYmxlZDogdHJ1ZSxcclxuICBnb0Rpc2FibGVkOiB0cnVlLFxyXG4gIGNvbnRlbnQ6ICdIaSEnLFxyXG4gIGZwYXRoOiAnJyxcclxuICBwYXRoOiAnJ1xyXG59KVxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBzb3VyY2UgfSBmcm9tICcuL3N0b3Jlcy5qcyc7XHJcblxyXG5sZXQgdmFsdWUgPSA2MTtcclxuZnVuY3Rpb24gcGxvdFZhbHVlKGUpIHtcclxuICB2YWx1ZSA9ICtlLnRhcmdldC52YWx1ZVxyXG4gIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2NhbGUtbWVybWFpZCcpXHJcbiAgbm9kZS5pbm5lckhUTUwgPSBgLm1lcm1haWQge2hlaWdodDogJHt2YWx1ZX12aDt9YFxyXG59XHJcbjwvc2NyaXB0PlxyXG5cclxuPGRpdiBjbGFzcz1cImJ0bi1jb250YWluZXJcIj5cclxuICA8c3Bhbj57cGFyc2VJbnQodmFsdWUpfTwvc3Bhbj5cclxuICA8aW5wdXQgbmFtZT1cIndlaWdodFwiIHR5cGU9XCJyYW5nZVwiIG1pbj1cIjEwXCIgbWF4PVwiMTAwXCIgc3RlcD1cIjFcIiB7dmFsdWV9IG9uOmlucHV0PXtwbG90VmFsdWV9IC8+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4uYnRuLWNvbnRhaW5lciB7XHJcbiAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gIG1hcmdpbi10b3A6IDVweDtcclxuICBwYWRkaW5nLXJpZ2h0OiA0cHg7XHJcbiAgcGFkZGluZy1ib3R0b206IDNweDtcclxuICByaWdodDogMDtcclxuICB6LWluZGV4OiA1O1xyXG4gIHRvcDogLTJweDtcclxufVxyXG5zcGFuIHtcclxuICBmb250LXNpemU6IDAuOGVtO1xyXG4gIHZlcnRpY2FsLWFsaWduOiB0b3A7XHJcbn1cclxuPC9zdHlsZT4iLCI8c2NyaXB0PlxyXG5mdW5jdGlvbiBidG5DbG9zZSgpIHtcclxuICBjb25zdCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsaXN0LWhlbHAgZGV0YWlsc1tvcGVuXScpXHJcbiAgbm9kZXMuZm9yRWFjaChub2RlID0+IG5vZGUucmVtb3ZlQXR0cmlidXRlKCdvcGVuJykpXHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG4tSGVscC1cclxuPGJ1dHRvbiBjbGFzcz1cImNsb2xsYXBzZVwiIG9uOmNsaWNrPVwie2J0bkNsb3NlfVwiPlstLV08L2J1dHRvbj5cclxuXHJcbjxzdHlsZT5cclxuYnV0dG9uIHtcclxuICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgY29sb3I6ICMwMDJhZmY7XHJcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XHJcbiAgZm9udC1mYW1pbHk6IENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgQ291cmllciBOZXcsIG1vbm9zcGFjZTtcclxuICBmb250LXdlaWdodDogNzAwO1xyXG4gIGZvbnQtc2l6ZTogMTBweDtcclxuICBwYWRkaW5nOiAwO1xyXG4gIGJvcmRlcjogMDtcclxuICBtYXJnaW46IDA7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCB7IHNvdXJjZSB9IGZyb20gJy4vc3RvcmVzLmpzJztcclxuXHJcbm9uTW91bnQoKCkgPT4ge1xyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXJrZG93bicpLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBjb25zdCB7IGhhc2ggfSA9IGUudGFyZ2V0O1xyXG4gICAgY29uc29sZS5sb2coJ2NsaWNrZWQnLCBoYXNoKTtcclxuICAgIGlmIChoYXNoKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgLy8gbG9jYXRpb24uaGFzaCA9IGhhc2g7XHJcbiAgICAgIGNvbnN0IGJlaGF2aW9yID0gJ2F1dG8nO1xyXG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihoYXNoKTtcclxuICAgICAgY29uc3QgdG9wID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSA0MDtcclxuICAgICAgY29uc3QgX3dpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaG93LWNvbnRhaW5lcicpO1xyXG4gICAgICBfd2luZG93LnNjcm9sbCh7dG9wLCBiZWhhdmlvcn0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGV0IG5vZGUgPSBlLnRhcmdldFxyXG4gICAgICB3aGlsZSAobm9kZS5pZCE9PSdtYXJrZG93bicpIHtcclxuICAgICAgICBpZiAobm9kZS5ub2RlTmFtZT09PSdBJykge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ2FuY2hvcicpO1xyXG4gICAgICAgICAgaWYgKG5vZGUuaHJlZi5tYXRjaCgvaHR0cHM/OlxcLy8pKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsOiBub2RlLmhyZWYgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pO1xyXG5cclxubGV0IG1lcm1haWQ7XHJcbmNvbnN0IHIgPSAvKCUuezJ9fFt+Ll0pL2c7XHJcbmZ1bmN0aW9uIGNvbnRlbnQoc3JjKSB7XHJcbiAgIW1lcm1haWQgJiYgKG1lcm1haWQgPSB3aW5kb3cubWVybWFpZCk7XHJcbiAgLy8gY29uc29sZS5sb2coJ3Bsb3QgdGhlIGNvbnRlbnQuLi4nKTtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFya2Rvd24gLm1lcm1haWQnKSkge1xyXG4gICAgICBtZXJtYWlkLmluaXQoKTtcclxuICAgICAgY29uc3QgYXJyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnZGl2LmRldGFpbHMnKVxyXG4gICAgICBmb3IgKGxldCBub2RlIG9mIGFycikge1xyXG4gICAgICAgIGNvbnN0IHRpdGxlID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ3RpdGxlJylcclxuICAgICAgICBjb25zdCBkZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpXHJcbiAgICAgICAgZGV0YWlscy5pbm5lckhUTUwgPSBgPHN1bW1hcnk+JHt0aXRsZX08L3N1bW1hcnk+YFxyXG4gICAgICAgIGNvbnN0IGNoaWxkcyA9IFtdXHJcbiAgICAgICAgZm9yIChsZXQgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgY2hpbGRzLnB1c2goY2hpbGQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGNoaWxkIG9mIGNoaWxkcykge1xyXG4gICAgICAgICAgZGV0YWlscy5hcHBlbmRDaGlsZChjaGlsZClcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChkZXRhaWxzKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXJrZG93biBhLnVwJykpIHtcclxuICAgICAgbGV0IF90b3A7XHJcbiAgICAgIGNvbnN0IGgxID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDEnKTtcclxuICAgICAgY29uc3QgYXJyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaDEsaDIsaDMsaDQsaDUnKTtcclxuICAgICAgaDEgJiYgKF90b3AgPSBgIDxhIGNsYXNzPVwidXBcIiBocmVmPVwiIyR7aDEuaWR9XCI+e3VwfTwvYT5gKTsgXHJcbiAgICAgIGZvciAobGV0IFtpLCBub2RlXSBvZiBhcnIuZW50cmllcygpKSB7XHJcbiAgICAgICAgaWYgKF90b3AgJiYgaSA+IDApIHtcclxuICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gYCR7bm9kZS5pbm5lckhUTUx9JHtfdG9wfWBcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZS5pZCA9IG5vZGUuaWQucmVwbGFjZShyLCAnJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2cobm9kZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LCAxKTtcclxuICByZXR1cm4gc3JjLmNvbnRlbnQ7XHJcbn1cclxuPC9zY3JpcHQ+XHJcblxyXG48ZGl2IGNsYXNzPVwic2hvdy1jb250YWluZXJcIj5cclxuICA8ZGl2IGlkPVwibWFya2Rvd25cIj5cclxuICAgIHtAaHRtbCBjb250ZW50KCRzb3VyY2UpfVxyXG4gIDwvZGl2PlxyXG48L2Rpdj5cclxuXHJcbjxzdHlsZT5cclxuICAuc2hvdy1jb250YWluZXIge1xyXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gICAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjVweCk7ICBcclxuICAgIG92ZXJmbG93OiBhdXRvO1xyXG4gIH1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD4gLy8gZmVhdDogbWFya2Rvd25cclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5cclxuZXhwb3J0IGxldCBpdGVtO1xyXG5cclxuZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGUpIHtcclxuICBjb25zb2xlLmxvZyhpdGVtKTtcclxuICBjb25zdCB7ZnBhdGh9ID0gaXRlbTtcclxuICB3c19fc2VuZCgnZ2V0TUNvbnRlbnQnLCB7ZnBhdGh9LCAoe2NvbnRlbnR9KSA9PiB7XHJcbiAgICBzb3VyY2UudXBkYXRlKG4gPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLm4sXHJcbiAgICAgICAgY29udGVudCxcclxuICAgICAgICBmcGF0aDogaXRlbS5mcGF0aFxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0aXRsZSh0KSB7XHJcbiAgLy8gY29uc29sZS5sb2codC50aXRsZSlcclxuICBjb25zdCBzdHJpbmcgPSB0LnRpdGxlLnJlcGxhY2UoL1xcLm1kJC8sJycpXHJcbiAgY29uc3QgcHJlID0gc3RyaW5nLm1hdGNoKC9eKFteYS16QS1aXSsufC4pLylbMF1cclxuICBjb25zdCBwb3N0ID0gc3RyaW5nLnJlcGxhY2UocHJlLCcnKS50b0xvd2VyQ2FzZSgpXHJcbiAgcmV0dXJuIHByZS50b1VwcGVyQ2FzZSgpICsgcG9zdDtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ0ZC1pdGVtIHskc291cmNlLmZwYXRoPT09aXRlbS5mcGF0aH1cIlxyXG4gIGRhdGEtaXRlbT17aXRlbS5lbGVtZW50fVxyXG4gIG9uOmNsaWNrPVwie2NsaWNrSGFuZGxlcn1cIlxyXG4+e3RpdGxlKGl0ZW0pfTwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4udGQtaXRlbTpob3ZlciB7XHJcbiAgY29sb3I6IGJsdWU7XHJcbiAgZm9udC13ZWlnaHQ6IGJvbGRlcjtcclxufVxyXG4udGQtaXRlbSxcclxuLnRkLXNob3cge1xyXG4gIGN1cnNvcjogcG9pbnRlcjtcclxuICBwYWRkaW5nOiAwLjFyZW07XHJcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XHJcbiAgcGFkZGluZy1sZWZ0OiAxMnB4O1xyXG59XHJcbi50ZC1pdGVtLnRydWUge1xyXG4gIGNvbG9yOiBibHVlO1xyXG4gIGZvbnQtd2VpZ2h0OiBib2xkZXI7XHJcbiAgYmFja2dyb3VuZDogZ3JlZW55ZWxsb3c7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgc291cmNlIH0gZnJvbSAnLi9zdG9yZXMuanMnO1xyXG5leHBvcnQgbGV0IGl0ZW07IFxyXG5leHBvcnQgbGV0IGtleTtcclxuXHJcbmZ1bmN0aW9uIGtsYXNzKHN0b3JlKSB7XHJcbiAgZm9yIChjb25zdCBpdG0gaW4gaXRlbSkge1xyXG4gICAgaWYgKGl0bT09PXN0b3JlLmZwYXRoKSB7XHJcbiAgICAgIHJldHVybiAnY2hrJ1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gJydcclxufVxyXG48L3NjcmlwdD4gICAgXHJcblxyXG48c3VtbWFyeSBjbGFzcz1cIntrbGFzcygkc291cmNlKX1cIj5cclxuICB7QGh0bWwga2V5fVxyXG48L3N1bW1hcnk+XHJcblxyXG48c3R5bGU+XHJcbnN1bW1hcnkge1xyXG4gIHBhZGRpbmctbGVmdDogMnB4O1xyXG59XHJcbnN1bW1hcnkuY2hrIHtcclxuICBmb250LXdlaWdodDogNzAwO1xyXG4gIGJhY2tncm91bmQ6ICNlNmY3ZDk7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwiPHNjcmlwdD5cclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcbmltcG9ydCBJdGVtIGZyb20gJy4vSXRlbS5zdmVsdGUnO1xyXG5pbXBvcnQgU3VtbWFyeSBmcm9tICcuL1N1bW1hcnkuc3ZlbHRlJztcclxuXHJcbmxldCByZXJlbmRlciA9IDA7XHJcbmxldCBkYXRhID0gW107XHJcblxyXG4kOiBfZGF0YSA9IGRhdGE7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLndhcm4oJ29uTW91bnQgaGVscC9saXN0Jyk7XHJcbiAgX3dzX2Nvbm5lY3QubWFya2Rvd25Pbk1vdW50ID0gKCkgPT4gd3NfX3NlbmQoJ2dldE1hcmtkb3duJywgJycsIG1hcmtkb3duSGFuZGxlcik7XHJcbn0pO1xyXG5cclxuY29uc3QgbWFya2Rvd25IYW5kbGVyID0gb2JqID0+IHtcclxuICBjb25zb2xlLndhcm4oJ3dzX19zZW5kKGdldE1hcmtkb3duKScsIG9iaik7XHJcbiAgaWYgKHdpbmRvdy5taXRtLmZpbGVzLm1hcmtkb3duPT09dW5kZWZpbmVkKSB7XHJcbiAgICB3aW5kb3cubWl0bS5maWxlcy5tYXJrZG93biA9IG9iajtcclxuICAgIGRhdGEgPSBvYmo7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IHttYXJrZG93bn0gPSB3aW5kb3cubWl0bS5maWxlcztcclxuICAgIGNvbnN0IG5ld21hcmtkb3duID0ge307XHJcbiAgICBmb3IgKGxldCBrIGluIG9iaikge1xyXG4gICAgICBuZXdtYXJrZG93bltrXSA9IG9ialtrXTtcclxuICAgIH1cclxuICAgIGRhdGEgPSBuZXdtYXJrZG93bjtcclxuICAgIHdpbmRvdy5taXRtLmZpbGVzLm1hcmtkb3duID0gbmV3bWFya2Rvd25cclxuICB9XHJcbiAgLyoqXHJcbiAgICogZXZlbnQgaGFuZGxlciBhZnRlciByZWNlaXZpbmcgd3MgcGFja2V0XHJcbiAgICogaWU6IHdpbmRvdy5taXRtLmZpbGVzLmdldFByb2ZpbGVfZXZlbnRzID0ge2V2ZW50T2JqZWN0Li4ufVxyXG4gICAqL1xyXG4gIGNvbnN0IHtnZXRQcm9maWxlX2V2ZW50c30gPSB3aW5kb3cubWl0bS5maWxlcztcclxuICBmb3IgKGxldCBrZXkgaW4gZ2V0UHJvZmlsZV9ldmVudHMpIHtcclxuICAgIGdldFByb2ZpbGVfZXZlbnRzW2tleV0oZGF0YSk7XHJcbiAgfVxyXG4gIHJlcmVuZGVyID0gcmVyZW5kZXIgKyAxO1xyXG59XHJcblxyXG53aW5kb3cubWl0bS5maWxlcy5tYXJrZG93bl9ldmVudHMubWFya2Rvd25UYWJsZSA9ICgpID0+IHtcclxuICBjb25zb2xlLmxvZygnbWFya2Rvd25UYWJsZSBnZXR0aW5nIGNhbGxlZCEhIScpO1xyXG4gIHdpbmRvdy53c19fc2VuZCgnZ2V0TWFya2Rvd24nLCAnJywgbWFya2Rvd25IYW5kbGVyKTtcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxkaXYgaWQ9XCJsaXN0LWhlbHBcIj5cclxuICB7I2VhY2ggT2JqZWN0LmtleXMoX2RhdGEpIGFzIGtleSwgaX1cclxuICAgIHsjaWYga2V5PT09J19yZWFkbWVfJ31cclxuICAgICAgPGRpdiBjbGFzcz1cInJlYWRtZVwiPlxyXG4gICAgICAgIHsjZWFjaCBPYmplY3Qua2V5cyhfZGF0YVtrZXldKSBhcyBpdGVtfVxyXG4gICAgICAgICAgPEl0ZW0gaXRlbT17e2VsZW1lbnQ6IGl0ZW0sIC4uLl9kYXRhW2tleV1baXRlbV19fS8+XHJcbiAgICAgICAgey9lYWNofSAgICBcclxuICAgICAgPC9kaXY+XHJcbiAgICB7OmVsc2V9XHJcbiAgICAgIDxkZXRhaWxzPlxyXG4gICAgICAgIDxTdW1tYXJ5IGl0ZW09e19kYXRhW2tleV19IHtrZXl9IC8+XHJcbiAgICAgICAgeyNlYWNoIE9iamVjdC5rZXlzKF9kYXRhW2tleV0pIGFzIGl0ZW19XHJcbiAgICAgICAgICA8SXRlbSBpdGVtPXt7ZWxlbWVudDogaXRlbSwgLi4uX2RhdGFba2V5XVtpdGVtXX19Lz5cclxuICAgICAgICB7L2VhY2h9XHJcbiAgICAgIDwvZGV0YWlscz4gIFxyXG4gICAgey9pZn1cclxuICB7L2VhY2h9XHJcbjwvZGl2PlxyXG4iLCI8c2NyaXB0PlxyXG5pbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJztcclxuXHJcbmltcG9ydCBCdXR0b24gZnJvbSAnLi9CdXR0b24uc3ZlbHRlJztcclxuaW1wb3J0IFZCb3gyIGZyb20gJy4uL2JveC9WQm94Mi5zdmVsdGUnO1xyXG5pbXBvcnQgdGl0bGUgZnJvbSAnLi9UaXRsZS5zdmVsdGUnO1xyXG5pbXBvcnQgVmlldyBmcm9tICcuL1ZpZXcuc3ZlbHRlJztcclxuaW1wb3J0IExpc3QgZnJvbSAnLi9MaXN0LnN2ZWx0ZSc7XHJcblxyXG5sZXQgbGVmdCA9IDE1MDtcclxuY29uc3QgaWQgID0gJ2hlbHBMZWZ0JztcclxuXHJcbm9uTW91bnQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnNvbGUud2Fybignb25Nb3VudCBoZWxwL2luZGV4Jyk7XHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KGlkLCBmdW5jdGlvbihvcHQpIHtcclxuICAgIG9wdFtpZF0gJiYgKGxlZnQgPSBvcHRbaWRdKVxyXG4gIH0pO1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGRyYWdlbmQoe2RldGFpbH0pIHtcclxuICBsZWZ0ID0gZGV0YWlsLmxlZnRcclxuICBjb25zdCBkYXRhID0ge31cclxuICBkYXRhW2lkXSA9IGxlZnRcclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoZGF0YSlcclxufVxyXG48L3NjcmlwdD5cclxuXHJcbjxCdXR0b24vPlxyXG48VkJveDIge3RpdGxlfSB7bGVmdH0ge2RyYWdlbmR9IHtMaXN0fT5cclxuICA8Vmlldy8+XHJcbjwvVkJveDI+XHJcbiIsIjxzY3JpcHQ+XHJcbi8vaHR0cHM6Ly9jMGJyYS5naXRodWIuaW8vc3ZlbG1hL2luc3RhbGxcclxuaW1wb3J0IHsgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XHJcblxyXG5pbXBvcnQgeyBUYWJzLCBUYWIgfSBmcm9tICdzdmVsbWEnO1xyXG5pbXBvcnQgUm91dGUgZnJvbSAnLi9jb21wb25lbnRzL3JvdXRlL0luZGV4LnN2ZWx0ZSc7XHJcbmltcG9ydCBQcm9maWxlIGZyb20gJy4vY29tcG9uZW50cy9wcm9maWxlL0luZGV4LnN2ZWx0ZSc7IC8vIGZlYXQ6IHByb2ZpbGVcclxuaW1wb3J0IExvZ3NUYWIgZnJvbSAnLi9jb21wb25lbnRzL2xvZ3MvSW5kZXguc3ZlbHRlJztcclxuaW1wb3J0IFRhZ3NUYWIgZnJvbSAnLi9jb21wb25lbnRzL3RhZ3MvSW5kZXguc3ZlbHRlJztcclxuaW1wb3J0IE90aGVyIGZyb20gJy4vY29tcG9uZW50cy9vdGhlci9JbmRleC5zdmVsdGUnO1xyXG5pbXBvcnQgSGVscCBmcm9tICcuL2NvbXBvbmVudHMvaGVscC9JbmRleC5zdmVsdGUnO1xyXG5cclxub25Nb3VudChhc3luYyAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ25hdi50YWJzPnVsJyk7XHJcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0xJJyk7XHJcbiAgICBsaS5pbm5lckhUTUwgPSAndicrd2luZG93Lm1pdG0udmVyc2lvbjtcclxuICAgIGxpLmNsYXNzTGlzdC5hZGQoJ3ZlcnNpb24nKTtcclxuICAgIG5vZGUuYXBwZW5kQ2hpbGQobGkpO1xyXG4gIH0sIDEwKTtcclxufSlcclxuPC9zY3JpcHQ+XHJcblxyXG48bWFpbiBjbGFzcz1cIm1haW5cIj5cclxuPFRhYnMgc3R5bGU9XCJpcy1ib3hlZFwiIHNpemU9XCJpcy1zbWFsbFwiPlxyXG4gIDxUYWIgbGFiZWw9XCJSb3V0ZVwiPjxSb3V0ZS8+PC9UYWI+XHJcbiAgPFRhYiBsYWJlbD1cIlByb2ZpbGVcIj48UHJvZmlsZS8+PC9UYWI+XHJcbiAgPFRhYiBsYWJlbD1cIkxvZ3NcIj48TG9nc1RhYi8+PC9UYWI+XHJcbiAgPFRhYiBsYWJlbD1cIlRhZ3NcIj48VGFnc1RhYi8+PC9UYWI+XHJcbiAgPCEtLSA8VGFiIGxhYmVsPVwiT3RoZXJcIj48T3RoZXIvPjwvVGFiPiAtLT5cclxuICA8VGFiIGxhYmVsPVwiSGVscFwiPjxIZWxwLz48L1RhYj5cclxuPC9UYWJzPlxyXG48L21haW4+XHJcbiIsIi8qIGdsb2JhbCBjaHJvbWUgKi9cclxuaW1wb3J0IEFwcCBmcm9tICcuL0FwcC5zdmVsdGUnXHJcbmNvbnN0IHJtZXRob2QgPSAvXihHRVR8UFVUfFBPU1R8REVMRVRFfCkjP1xcZCohPzooW1xcdy4jfi1dKzp8KSguKykvIC8vIGZlYXQ6IHRhZ3MgaW4gdXJsXHJcbmNvbnN0IHJjbGFzcyA9IC9bLiN+L10rL2dcclxuXHJcbmNvbnNvbGUubG9nKCdMb2FkIE1JVE0gcGx1Z2luJylcclxuXHJcbmZ1bmN0aW9uIHRvUmVnZXggKHN0ciwgZmxhZ3MgPSAnJykge1xyXG4gIHJldHVybiBuZXcgUmVnRXhwKHN0clxyXG4gICAgLnJlcGxhY2UoL1xcLy9nLCAnXFxcXC8nKVxyXG4gICAgLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKVxyXG4gICAgLnJlcGxhY2UoL1xcPy9nLCAnXFxcXD8nKSwgZmxhZ3MpXHJcbn1cclxuXHJcbmNvbnN0IHNvcnRUYWcgPSAoYSxiKSA9PiB7XHJcbiAgY29uc3QgW2sxLHYxXSA9IGEuc3BsaXQoJzonKTtcclxuICBjb25zdCBbazIsdjJdID0gYi5zcGxpdCgnOicpO1xyXG4gIGEgPSB2MSB8fCBrMTtcclxuICBiID0gdjIgfHwgazI7XHJcbiAgaWYgKGE8YikgcmV0dXJuIC0xO1xyXG4gIGlmIChhPmIpIHJldHVybiAxO1xyXG4gIHJldHVybiAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBub1RhZ0luUnVsZShwYXRoKSB7XHJcbiAgY29uc3QgYXJyID0gcGF0aC5tYXRjaChybWV0aG9kKSAvLyBmZWF0OiB0YWdzIGluIHVybFxyXG4gIHJldHVybiBhcnIgPyAoYXJyWzFdID8gYCR7YXJyWzFdfToke2FyclszXX1gIDogYXJyWzNdKSA6IHBhdGhcclxufVxyXG5cclxuZnVuY3Rpb24gaXNSdWxlT2ZmKHRhZ3MsIG5zLCBwYXRoKSB7XHJcbiAgY29uc3Qgc2VjcyA9IHRhZ3MuX190YWczW25zXVtwYXRoXVxyXG4gIGNvbnN0IHRhZzIgPSB0YWdzLl9fdGFnMltuc11cclxuICBjb25zdCB0YWcxID0gdGFncy5fX3RhZzFcclxuICBpZiAoc2Vjcykge1xyXG4gICAgbGV0IGlkMSA9IFtdXHJcbiAgICBsZXQgaWQyID0gZmFsc2VcclxuICAgIGZvciAoY29uc3Qgc2VjIGluIHNlY3MpIHtcclxuICAgICAgY29uc3Qgbm9kZSA9IHNlY3Nbc2VjXVxyXG4gICAgICBpZiAobm9kZS50YWcyKSB7XHJcbiAgICAgICAgaWYgKHRhZzJbbm9kZS50YWcyXS5zdGF0ZT09PWZhbHNlKSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiBub2RlLnRhZzEpIHtcclxuICAgICAgICAgICAgaWYgKHRhZzFbbnNdW3RhZ109PT1mYWxzZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgdGFncyA9IG5vZGUudGFncyAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgICAgIGZvciAoY29uc3QgdGFnIGluIHRhZ3MpIHtcclxuICAgICAgICBpZiAodGFnc1t0YWddKSB7XHJcbiAgICAgICAgICBpZDEucHVzaChzZWMpXHJcbiAgICAgICAgfSBlbHNlIGlmICh0YWdzW3RhZ109PT1mYWxzZSkge1xyXG4gICAgICAgICAgaWQyID0gc2VjXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gZmVhdDogcnVsZSBvZmYgaWYgVVJMIGluIHRoZSBzYW1lIHNlY3Rpb25cclxuICAgIGlmICgoaWQxLmxlbmd0aD09PTAgJiYgaWQyKSB8fCBpZDEuaW5kZXhPZihpZDIpPi0xKSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZVxyXG59XHJcblxyXG5mdW5jdGlvbiB0YWdzSW5fX3RhZzModGFncywgbnMsIHBhdGgsIHNlYykge1xyXG4gIGNvbnN0IHNlY3MgPSB0YWdzLl9fdGFnM1tuc11bcGF0aF1cclxuICBsZXQgYXJyID0gW11cclxuICBpZiAoc2Vjcykge1xyXG4gICAgY29uc3QgX3NlYyA9IHNlYy5zcGxpdCgnOicpWzBdXHJcbiAgICBjb25zdCB0YWdzID0gc2Vjc1tfc2VjXVxyXG4gICAgaWYgKHRhZ3MpIHtcclxuICAgICAgYXJyID0gT2JqZWN0LmtleXModGFncykubWFwKHg9Pnguc3BsaXQoJzonKS5wb3AoKSlcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGFyclxyXG59XHJcblxyXG5mdW5jdGlvbiByZXNldFJ1bGUyKHRhZ3MsIGl0ZW0sIG5zLCB0YWd4KSB7XHJcbiAgY29uc3QgdHlwMSA9IGl0ZW0uc3BsaXQoJzonKVsxXSB8fCBpdGVtO1xyXG4gIGNvbnN0IFsgZ3JvdXAxLCBpZDEgXSA9IHR5cDEuc3BsaXQoJ34nKTtcclxuICBjb25zdCBuYW1lc3BhY2UyID0gdGFncy5fX3RhZzJbbnNdO1xyXG4gIGNvbnN0IHsgc3RhdGUgfSA9IG5hbWVzcGFjZTJbaXRlbV07IC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICBpZiAoaWQxKSB7XHJcbiAgICBmb3IgKGxldCBpdG0gaW4gbmFtZXNwYWNlMikge1xyXG4gICAgICBjb25zdCB0eXAyID0gaXRtLnNwbGl0KCc6JylbMV0gfHwgaXRtO1xyXG4gICAgICBjb25zdCBbZ3JvdXAyLCBpZDJdID0gdHlwMi5zcGxpdCgnficpO1xyXG4gICAgICBpZiAoZ3JvdXAxPT09Z3JvdXAyKSB7XHJcbiAgICAgICAgaWYgKGlkMj09PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgbmFtZXNwYWNlMltpdG1dLnN0YXRlID0gc3RhdGU7IC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICAgICAgICB9IGVsc2UgaWYgKGlkMSE9PWlkMikge1xyXG4gICAgICAgICAgbmFtZXNwYWNlMltpdG1dLnN0YXRlID0gZmFsc2U7IC8vIGZlYXQ6IHVwZGF0ZSBfX3RhZzJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc2V0UnVsZTModGFncywgaXRlbSwgX25zKSB7XHJcbiAgY29uc3QgeyByb3V0ZXMgfSA9IHdpbmRvdy5taXRtO1xyXG4gIGNvbnN0IHtfX3RhZzEsX190YWcyLF9fdGFnM30gPSB0YWdzO1xyXG4gIGNvbnN0IHQxID0gaXRlbS5zcGxpdCgndXJsOicpLnBvcCgpO1xyXG4gIGNvbnN0IHR5cDEgPSBpdGVtLnNwbGl0KCc6JylbMV0gfHwgaXRlbTtcclxuICBjb25zdCBbZ3JvdXAxLCBpZDFdID0gdHlwMS5zcGxpdCgnficpO1xyXG5cclxuICBsZXQgdGFnMSA9ICFfbnNcclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlKG5zKSB7XHJcbiAgICBjb25zdCBuYW1lc3BhY2UyID0gX190YWcyW25zXTtcclxuICAgIGNvbnN0IHVybHMgPSBfX3RhZzNbbnNdO1xyXG5cclxuICAgIGxldCBmbGFnXHJcbiAgICBpZiAodGFnMSkge1xyXG4gICAgICBmbGFnID0gX190YWcxW25zXVxyXG4gICAgICBpZiAoZmxhZz09PXVuZGVmaW5lZCkge1xyXG4gICAgICAgIGZsYWcgPSBmYWxzZVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZsYWcgPSBmbGFnW3QxXVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmbGFnID0gbmFtZXNwYWNlMltpdGVtXS5zdGF0ZVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAobGV0IHVybCBpbiB1cmxzKSB7XHJcbiAgICAgIGNvbnN0IHR5cHMgPSB1cmxzW3VybF07XHJcbiAgICAgIGZvciAobGV0IHR5cCBpbiB0eXBzKSB7XHJcbiAgICAgICAgY29uc3QgdGFncyA9IHR5cHNbdHlwXS50YWdzOyAvLyBmZWF0OiB1cGRhdGUgX190YWczXHJcbiAgICAgICAgZm9yIChsZXQgdGFnIGluIHRhZ3MpIHtcclxuICAgICAgICAgIGlmIChpdGVtPT09dGFnKSB7XHJcbiAgICAgICAgICAgIHRhZ3NbdGFnXSA9IGZsYWc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBpZCA9IHRhZy5zcGxpdCgndXJsOicpLnBvcCgpXHJcbiAgICAgICAgICBjb25zdCBbZ3JvdXAyLCBpZDJdID0gaWQuc3BsaXQoJ34nKVxyXG5cclxuICAgICAgICAgIGlmIChncm91cDE9PT1ncm91cDIpIHtcclxuICAgICAgICAgICAgaWYgKHRhZzEpIHtcclxuICAgICAgICAgICAgICB0YWdzW3RhZ10gPSAgX190YWcxW25zXVtpZF0gfHwgZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaWYgKGlkMj09PXVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGFnc1t0YWddID0gbmFtZXNwYWNlMltpdGVtXS5zdGF0ZVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoaWQxIT09aWQyKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdzW3RhZ10gPSBmYWxzZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gIFxyXG4gIH1cclxuICBpZiAoX25zKSB7XHJcbiAgICB1cGRhdGUoX25zKVxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBuc3MgPSAgdGFncy5fX3RhZzJcclxuICAgIGZvciAobGV0IG5zIGluIG5zcykge1xyXG4gICAgICBpZiAob25lU2l0ZSh0YWdzLCBucykpIHtcclxuICAgICAgICBucyA9IHJvdXRlc1tuc10uX2NoaWxkbnMuX3N1Ym5zIHx8IG5zIC8vIGZlYXQ6IGNoZyB0byBjaGlsZCBuYW1lc3BhY2VcclxuICAgICAgICB1cGRhdGUobnMpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVuaXEodmFsdWUsIGluZGV4LCBzZWxmKSB7XHJcbiAgcmV0dXJuIHNlbGYuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4O1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbmVTaXRlKHRhZ3MsIG5zKSB7XHJcbiAgY29uc3Qge3RvUmVnZXh9ID0gd2luZG93Lm1pdG0uZm47XHJcbiAgY29uc3Qge2xpc3QsIHJvdXRlLCBmaWx0ZXJVcmx9ID0gdGFnc1xyXG4gIGlmIChucy5tYXRjaCgnQCcpKSB7XHJcbiAgICByZXR1cm4gZmFsc2VcclxuICB9IGVsc2UgaWYgKGxpc3QgJiYgcm91dGUpIHtcclxuICAgIHJldHVybiByb3V0ZT09PW5zXHJcbiAgfSBlbHNlIGlmIChmaWx0ZXJVcmwpIHtcclxuICAgIGNvbnN0IHthY3RpdmVVcmx9ID0gbWl0bS5icm93c2VyXHJcbiAgICBjb25zdCByZ3ggPSB0b1JlZ2V4KG5zLnJlcGxhY2UoL34vLCdbXi5dKicpKVxyXG4gICAgY29uc3Qge29yaWdpbn0gPSBhY3RpdmVVcmwgPyBuZXcgVVJMKGFjdGl2ZVVybCkgOiB7b3JpZ2luOiAnJ31cclxuICAgIHJldHVybiBvcmlnaW4ubWF0Y2gocmd4KSB8fCBucz09PSdfZ2xvYmFsXydcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IHtmbn0gPSB3aW5kb3cubWl0bVxyXG5mbi5ybWV0aG9kID0gcm1ldGhvZDtcclxuZm4ucmNsYXNzID0gcmNsYXNzO1xyXG5mbi50YWdzSW5fX3RhZzMgPSB0YWdzSW5fX3RhZzNcclxuZm4ubm9UYWdJblJ1bGUgPSBub1RhZ0luUnVsZVxyXG5mbi5yZXNldFJ1bGUyID0gcmVzZXRSdWxlMlxyXG5mbi5yZXNldFJ1bGUzID0gcmVzZXRSdWxlM1xyXG5mbi5pc1J1bGVPZmYgPSBpc1J1bGVPZmZcclxuZm4uc29ydFRhZyA9IHNvcnRUYWdcclxuZm4ub25lU2l0ZSA9IG9uZVNpdGVcclxuZm4udG9SZWdleCA9IHRvUmVnZXhcclxuZm4udW5pcSA9IHVuaXFcclxud2luZG93Lm1pdG0uZWRpdG9yID0ge307XHJcbndpbmRvdy5taXRtLmJyb3dzZXIgPSB7XHJcbiAgY2hnVXJsX2V2ZW50czoge30sXHJcbiAgYWN0aXZlVXJsOiAnJyxcclxuICBwYWdlOiB7fVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGdVcmwgKHVybCkge1xyXG4gIGlmICghdXJsKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcbiAgY29uc29sZS5sb2coJ0NoZyB1cmw6JywgdXJsKVxyXG4gIGNvbnN0IHsgYnJvd3NlciB9ID0gd2luZG93Lm1pdG1cclxuICBicm93c2VyLmFjdGl2ZVVybCA9IHVybFxyXG4gIGZvciAoY29uc3QgZSBpbiBicm93c2VyLmNoZ1VybF9ldmVudHMpIHtcclxuICAgIGJyb3dzZXIuY2hnVXJsX2V2ZW50c1tlXSgpXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRVcmwgKCkge1xyXG4gIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCB3aW5kb3dJZDogY2hyb21lLndpbmRvd3MuV0lORE9XX0lEX0NVUlJFTlQgfSxcclxuICAgIGZ1bmN0aW9uICh0YWJzKSB7XHJcbiAgICAgIGNvbnN0IHVybCA9IHRhYnNbMF0udXJsXHJcbiAgICAgIGNoZ1VybCh1cmwpXHJcbiAgICB9XHJcbiAgKVxyXG59O1xyXG5cclxubGV0IGRlYm91bmNlXHJcbmxldCBmaXJzdFJ1blRhYnNPblVwZGF0ZWQgPSAxXHJcbmNocm9tZS50YWJzLm9uVXBkYXRlZC5hZGRMaXN0ZW5lcihmdW5jdGlvbiAodGFiSWQsIGNoYW5nZUluZm8sIHRhYikge1xyXG4gIGlmIChmaXJzdFJ1blRhYnNPblVwZGF0ZWQpIHtcclxuICAgIGNvbnNvbGUubG9nKCdmaXJzdCBydW4gY2hyb21lLnRhYnMub25VcGRhdGVkJylcclxuICAgIGZpcnN0UnVuVGFic09uVXBkYXRlZCA9IDBcclxuICB9XHJcbiAgaWYgKCF0YWIuYWN0aXZlKSB7XHJcbiAgICByZXR1cm5cclxuICB9XHJcblxyXG4gIGNvbnN0IHsgYnJvd3NlciB9ID0gd2luZG93Lm1pdG1cclxuICBicm93c2VyLnBhZ2UgPSB7XHJcbiAgICAuLi5icm93c2VyLnBhZ2UsXHJcbiAgICAuLi5jaGFuZ2VJbmZvLFxyXG4gICAgLi4udGFiXHJcbiAgfVxyXG5cclxuICBpZiAoY2hhbmdlSW5mby5zdGF0dXMgPT09ICdsb2FkaW5nJykge1xyXG4gICAgYnJvd3Nlci5wYWdlLnRpdGxlID0gJydcclxuICB9IGVsc2UgaWYgKGJyb3dzZXIucGFnZS5zdGF0dXMgPT09ICdjb21wbGV0ZScgJiYgYnJvd3Nlci5wYWdlLnRpdGxlKSB7XHJcbiAgICBpZiAoZGVib3VuY2UpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KGRlYm91bmNlKVxyXG4gICAgICBkZWJvdW5jZSA9IHVuZGVmaW5lZFxyXG4gICAgfVxyXG4gICAgZGVib3VuY2UgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgZGVib3VuY2UgPSB1bmRlZmluZWRcclxuICAgICAgY2hnVXJsKHRhYi51cmwpXHJcbiAgICB9LCAxMDAwKVxyXG4gIH1cclxufSlcclxuXHJcbmxldCBmaXJzdFJ1blRhYnNPbkFjdGl2YXRlZCA9IDFcclxuY2hyb21lLnRhYnMub25BY3RpdmF0ZWQuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKGFjdGl2ZUluZm8pIHtcclxuICBpZiAoZmlyc3RSdW5UYWJzT25BY3RpdmF0ZWQpIHtcclxuICAgIGNvbnNvbGUubG9nKCdmaXJzdCBydW4gY2hyb21lLnRhYnMub25BY3RpdmF0ZWQnKVxyXG4gICAgZmlyc3RSdW5UYWJzT25BY3RpdmF0ZWQgPSAwXHJcbiAgfVxyXG4gIGdldFVybCgpXHJcbn0pXHJcblxyXG5jb25zdCBhcHAgPSBuZXcgQXBwKHsgdGFyZ2V0OiBkb2N1bWVudC5ib2R5IH0pXHJcbmNvbnNvbGUubG9nKCdTdGFydCBwbHVnaW4nKVxyXG5nZXRVcmwoKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXBwXHJcbiJdLCJuYW1lcyI6WyJnZXQiLCJzb3VyY2UiLCJidG5zIiwiYnRuVGFnIiwidG9wIiwidGl0bGUiLCJpZCIsImlzR3JvdXAiLCJxIiwibnNwYWNlIiwiZmxhZyJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsU0FBUyxJQUFJLEdBQUcsR0FBRztJQUVuQixTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO0lBQzFCO0lBQ0EsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUc7SUFDdkIsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLElBQUksT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBSUQsU0FBUyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtJQUN6RCxJQUFJLE9BQU8sQ0FBQyxhQUFhLEdBQUc7SUFDNUIsUUFBUSxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7SUFDekMsS0FBSyxDQUFDO0lBQ04sQ0FBQztJQUNE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QU0sTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7SUFDNUMsTUFBTSxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUMsTUFBTSxJQUFJLE1BQU0sR0FBRyxNQUFNLEVBQUU7SUFDM0IsUUFBUSxJQUFJLEdBQUcsR0FBRyxTQUFTLEVBQUU7SUFDN0IsVUFBVSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN4QyxTQUFTLE1BQU0sSUFBSSxHQUFHLEdBQUcsR0FBRyxFQUFFO0lBQzlCLFVBQVUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDeEMsU0FBUztJQUNULE9BQU87SUFDUCxLQUFLO0lBQ0wsR0FBRztJQUNILENBQUM7QUFDRDtJQUNBLFNBQVMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQ3JDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDakMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDdEMsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3RDLEVBQUUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDMUMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEM7SUFDQSxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsSUFBRztBQUNq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
