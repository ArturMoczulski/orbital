import { INestApplication } from "@nestjs/common";
import { MongooseModule, getConnectionToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Connection } from "mongoose";
import { User, UserSchema } from "../users/schemas/user.schema";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { AuthModule } from "./auth.module";
import { AuthService } from "./auth.service";
const request = require("supertest");

describe("Auth E2E", () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let usersService: UsersService;
  let authService: AuthService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        UsersModule,
        MongooseModule.forRoot(uri), // Connect to in-memory MongoDB
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // Register User schema
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mongoConnection = app.get<Connection>(getConnectionToken());
    usersService = moduleFixture.get<UsersService>(UsersService);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  beforeEach(async () => {
    // Clear the database and create a user before each test
    await mongoConnection.collection("users").deleteMany({});

    // Use authService.signup instead of usersService.create to ensure password is hashed
    const signupResult = await authService.signup("testuser", "testpassword");
    console.log("User signup result:", JSON.stringify(signupResult, null, 2));

    // Verify the user was created correctly
    const findResult = await usersService.findByUsername(["testuser"]);
    console.log("User find result:", JSON.stringify(findResult, null, 2));
  });

  it("/api/auth/signup (POST)", async () => {
    // Attempt to sign up a different user
    await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ username: "anotheruser", password: "anotherpassword" })
      .expect(201); // Assuming 201 Created for successful signup
  });

  it("/api/auth/login (POST)", async () => {
    // User is already created in beforeEach
    console.log("Attempting to login with testuser/testpassword");

    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpassword" })
      .expect(200); // Assuming 200 OK for successful login

    console.log("Login response:", response.body);
  });

  afterEach(async () => {
    // Clear the database after each test
    await mongoConnection.collection("users").deleteMany({});
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (mongoConnection) {
      await mongoConnection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
});
