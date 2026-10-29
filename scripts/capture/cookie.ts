import { encode } from "next-auth/jwt";
const [id, email, firstName, lastName, color] = process.argv.slice(2);
const token = await encode({
  secret: process.env.AUTH_SECRET!,
  salt: "authjs.session-token",
  token: { sub: id, id, email, name: `${firstName} ${lastName}`, firstName, lastName, color },
  maxAge: 60 * 60 * 24 * 7,
});
console.log(token);
