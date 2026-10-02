import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description:
        "Authentication and authorization APIs for the application",
    },

    servers: [
      {
        url: "http://localhost:4001",
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "Authentication related APIs",
      },
    ],
  },

  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);