import VglAbstract from "./vgl-abstract.js";

import {Object3D, Vector3, Euler} from "./three.js";

function findParent(vm) {
    const parent = vm.$parent;
    if (parent) {
        if (parent.$options.isVgl && parent.inst && parent.inst.isObject3D) {
            return parent;
        }
        return findParent(parent);
    }
}

function position(pos) {
    if (!pos) {
        return new Vector3();
    }
    if (Array.isArray(pos)) {
        return new Vector3(...pos.map((item) => parseFloat(item)));
    }
    if (typeof pos === "object") {
        return new Vector3(parseFloat(pos.x), parseFloat(pos.y), parseFloat(pos.z));
    }
    return new Vector3(...pos.trim().split(/\s+/).map((item) => parseFloat(item)));
}

function rotation(rot) {
    if (!rot) {
        return new Euler();
    }
    if (Array.isArray(rot)) {
        const xyz = rot.slice(0, 3).map((item) => parseFloat(item));
        xyz.length = 3;
        const order = Euler.RotationOrders.indexOf((rot[3] + "").trim()) < 0 ? "XYZ": rot[3].trim();
        return new Euler(...xyz, order);
    }
    if (typeof rot === "object") {
        const order = Euler.RotationOrders.indexOf((rot.order + "").trim()) < 0 ? "XYZ": rot.order.trim();
        return new Euler(parseFloat(rot.x), parseFloat(rot.y), parseFloat(rot.z), order);
    }
    const xyzo = (rot + "").trim().split(/\s+/);
    const xyz = xyzo.slice(0, 3).map((item) => parseFloat(item));
    xyz.length = 3;
    const order = Euler.RotationOrders.indexOf(xyzo[3]) < 0 ? "XYZ": xyzo[3];
    return new Euler(...xyz, order);
}

function scale(s) {
    if (!s) {
        return new Vector3(1, 1, 1);
    }
    if (Array.isArray(s)) {
        if (!s.length) {
            return new Vector3(1, 1, 1);
        }
        if (s.length < 2) {
            const t = parseFloat(s[0]) || 1;
            return new Vector3(t, t, t);
        }
        const arr = s.length < 3 ? [...s, 1]: s;
        return new Vector3(...arr.map((item) => parseFloat(item) || 1));
    }
    if (typeof s === "object") {
        return new Vector3(parseFloat(s.x) || 1, parseFloat(s.y) || 1, parseFloat(s.z) || 1);
    }
    const arr = (s + "").trim().split(/\s+/);
    if (arr.length < 2) {
        const t = parseFloat(arr[0]) || 1;
        return new Vector3(t, t, t);
    }
    if (arr.length < 3) {
        arr.push(1);
    }
    return new Vector3(...arr.map((item) => parseFloat(item) || 1));
}

export default {
    mixins: [VglAbstract],
    props: [
        "name",
        "position",
        "rotation",
        "scale"
    ],
    computed: {
        inst: () => new Object3D()
    },
    created() {
        const inst = this.inst;
        inst.position.copy(position(this.position));
        inst.rotation.copy(rotation(this.rotation));
        inst.scale.copy(scale(this.scale));
        const parent = findParent(this);
        if (parent) {
            parent.inst.add(inst);
        }
    },
    beforeDestroy() {
        const inst = this.inst;
        if (inst.parent) {
            inst.parent.remove(inst);
        }
    },
    watch: {
        parsedPosition(pos) {
            this.inst.position.copy(position(pos));
        },
        parsedRotation(rot) {
            this.inst.rotation.copy(rotation(rot));
        },
        parsedScale(s) {
            this.inst.scale.copy(scale(s));
        },
        inst(instance, oldInstance) {
            instance.add(...oldInstance.children);
            instance.position.copy(position(this.position));
            instance.rotation.copy(rotation(this.rotation));
            instance.scale.copy(scale(this.scale));
            const parent = oldInstance.parent;
            if (parent) {
                parent.remove(oldInstance);
                parent.add(instance);
            }
        }
    }
};
