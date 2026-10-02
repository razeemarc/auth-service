import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "Email OTP authentication API. OTPs are single-use and expire after the configured lifetime.",
    },
    servers: [{ url: "http://localhost:4001", description: "Local development server" }],
    tags: [
      { name: "Health", description: "Service health" },
      { name: "Authentication", description: "Email one-time password authentication" },
    ],
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Check service health",
          operationId: "getHealth",
          responses: {
            "200": {
              description: "Service is healthy",
              content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
            },
          },
        },
      },
      "/auth/otp/request": {
        post: {
          tags: ["Authentication"],
          summary: "Request an email verification code",
          description: "Sends a six-digit code to the supplied email address. Responses do not disclose whether an account already exists.",
          operationId: "requestOtp",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OtpRequest" }, example: { email: "person@example.com" } } },
          },
          responses: {
            "202": {
              description: "Request accepted",
              content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" }, example: { message: "If the address can receive mail, a verification code has been sent" } } },
            },
            "400": { description: "Invalid email address", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "429": { description: "Resend cooldown has not elapsed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "500": { description: "Email delivery failed or service error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/otp/verify": {
        post: {
          tags: ["Authentication"],
          summary: "Verify an email code and sign in",
          operationId: "verifyOtp",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OtpVerifyRequest" }, example: { email: "person@example.com", code: "123456" } } },
          },
          responses: {
            "200": {
              description: "Code verified; access token and user returned",
              content: { "application/json": { schema: { $ref: "#/components/schemas/OtpVerifyResponse" } } },
            },
            "400": { description: "Email or code has an invalid format", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Code is invalid, expired, or already used", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "429": { description: "Maximum verification attempts exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "500": { description: "Service error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
    },
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          required: ["status"],
          properties: { status: { type: "string", example: "ok" } },
        },
        OtpRequest: {
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email", maxLength: 320, example: "person@example.com" } },
        },
        OtpVerifyRequest: {
          type: "object",
          required: ["email", "code"],
          properties: {
            email: { type: "string", format: "email", maxLength: 320, example: "person@example.com" },
            code: { type: "string", pattern: "^\\d{6}$", example: "123456", description: "Six-digit one-time code" },
          },
        },
        MessageResponse: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string", example: "If the address can receive mail, a verification code has been sent" } },
        },
        OtpVerifyResponse: {
          type: "object",
          required: ["accessToken", "tokenType", "expiresIn", "user"],
          properties: {
            accessToken: { type: "string", description: "JWT access token", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            tokenType: { type: "string", enum: ["Bearer"] },
            expiresIn: { type: "integer", description: "Token lifetime in seconds", example: 900 },
            user: {
              type: "object",
              required: ["id", "email"],
              properties: { id: { type: "string", format: "uuid" }, email: { type: "string", format: "email" } },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "string", example: "Invalid or expired verification code" } },
        },
      },
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
