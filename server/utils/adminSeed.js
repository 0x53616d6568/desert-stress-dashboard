import { logger } from "./logger.js";

export function getAdminCredentials() {
  const isProd = process.env.NODE_ENV === "production";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (isProd) {
    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in production mode."
      );
    }
    if (password.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD must be at least 8 characters in production mode."
      );
    }
  }

  if (email && password) {
    return { email, password };
  }

  if (email || password) {
    throw new Error(
      "Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both empty to use generated development credentials."
    );
  }

  const generatedUser = Math.random().toString(36).slice(2, 8);
  const generatedEmail = `admin-${generatedUser}@example.com`;
  const generatedPassword = "dev" + Math.random().toString(36).slice(2, 10);
  return { email: generatedEmail, password: generatedPassword, generated: true };
}

export function logGeneratedCredentials(creds) {
  if (creds.generated) {
    logger.warn(
      `Development admin credentials generated: ${creds.email} / ${creds.password}`
    );
  }
}
