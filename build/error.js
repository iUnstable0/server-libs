"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class lib_error {
    static generateReferenceCode() {
        // Return current unix timestamp in milliseconds
        return Date.now().toString();
        // return (
        // 	Math.random().toString(36).substring(2, 15) +
        // 	Math.random().toString(36).substring(2, 15)
        // );
    }
}
exports.default = lib_error;
