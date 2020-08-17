import { templateToCode } from "../compiler/compiler";
export default class ToyVue {
  constructor(options) {
    this._init(options);
  }
  _init(options) {
    this.$options = options;
    if (options.data) initData(this);
    // if (options.methods) initMethod(this);
    if (options.el) {
      this.$mount();
    }
  }
  $mount() {
    this.update();
  }
  update() {
    if (this.$options.template) {
      this.el = templateToCode(this.$options.template);
      console.log(this.el);
    }
  }
}
function initData(vm) {
  let data = vm.$options && vm.$options.data;
  vm._data = data;
  data = vm.data = typeof data === "function" ? data.call(vm, vm) : data || {};
  Object.keys(data).forEach((key) => {
    proxy(vm, "_data", key);
  });
}
function query(el) {
  if (typeof el === "string") {
    const selected = document.querySelector(el);
    if (!selected) {
      return document.createElement("div");
    }
    return selected;
  } else {
    return el;
  }
}
function proxy(vm, data, key) {
  Object.defineProperty(vm, data, {
    enumerable: true,
    configurable: true,
    get() {
      return vm[data][key];
    },
    set(val) {
      vm[data][key] = val;
    },
  });
}
