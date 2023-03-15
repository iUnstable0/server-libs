"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file is duplicated in:
const password_validator_1 = __importDefault(require("password-validator"));
const schema = new password_validator_1.default();
schema
    // Must be at least 8 characters long
    .is()
    .min(8)
    // Cannot be longer than 200 characters
    .is()
    .max(200)
    // Must have an uppercase character
    .has()
    .uppercase()
    // Must have a lowercase character
    .has()
    .lowercase()
    // Must have at least one digit
    .has()
    .digits(1)
    // Must not have spaces
    .has()
    .not()
    .spaces();
class lib_password {
    static validate(password) {
        const results = schema.validate(password, { list: true });
        // Return the result but with a replacement array
        // for ex if results are [ 'min', 'digits' ], it will return [ 'Must be at least 8 characters long',
        // 'Must have at least one digit' ]
        return {
            valid: results.length === 0,
            errors: results.map((result) => {
                switch (result) {
                    case "min":
                        return "Must be at least 8 characters long";
                    case "max":
                        return "Cannot be longer than 200 characters";
                    case "uppercase":
                        return "Must have an uppercase character";
                    case "lowercase":
                        return "Must have a lowercase character";
                    case "digits":
                        return "Must have at least one digit";
                    case "spaces":
                        return "Must not have spaces";
                    default:
                        return "Unknown error";
                }
            }),
        };
    }
}
exports.default = lib_password;
