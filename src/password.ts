// This file is duplicated in:
import PasswordValidator from "password-validator";

const schema = new PasswordValidator();

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

export default class lib_password {
  public static validate(password: string) {
    const results: any = schema.validate(password, { list: true });

    // Return the result but with a replacement array
    // for ex if results are [ 'min', 'digits' ], it will return [ 'Must be at least 8 characters long',
    // 'Must have at least one digit' ]
    return {
      valid: results.length === 0,
      errors: results.map((result: string) => {
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
