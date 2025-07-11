import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateIdentityAccountDto,
  UpdateIdentityAccountDto,
} from "./dto/identity-account.dto";
import { IdentitiesService } from "./identities.service";

@ApiTags("identities")
@Controller("identities")
export class IdentitiesController {
  constructor(private readonly identitiesService: IdentitiesService) {}

  @Get()
  @ApiOperation({ summary: "Get all identity accounts" })
  @ApiResponse({ status: 200, description: "Returns all identity accounts" })
  @ApiQuery({
    name: "characterId",
    required: false,
    description: "Filter identity accounts by character ID",
  })
  find(@Query("characterId") characterId?: string) {
    if (characterId) {
      return this.identitiesService.findByCharacterId(characterId);
    } else {
      return this.identitiesService.find();
    }
  }

  @Get("/:_id")
  @ApiOperation({ summary: "Get identity account by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns the identity account with the specified ID",
  })
  @ApiResponse({ status: 404, description: "Identity account not found" })
  @ApiParam({
    name: "_id",
    description: "The ID of the identity account to retrieve",
  })
  async findById(@Param("_id") _id: string) {
    try {
      return await this.identitiesService.findById(_id);
    } catch (error) {
      throw new NotFoundException(`Identity account with id ${_id} not found`);
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a new identity account" })
  @ApiResponse({
    status: 201,
    description: "The identity account has been successfully created.",
  })
  create(@Body() createIdentityAccountDto: CreateIdentityAccountDto) {
    return this.identitiesService.create(createIdentityAccountDto);
  }

  @Put("/:_id")
  @ApiOperation({ summary: "Update an existing identity account" })
  @ApiResponse({
    status: 200,
    description: "The identity account has been successfully updated.",
  })
  @ApiParam({
    name: "_id",
    description: "The ID of the identity account to update",
  })
  update(
    @Param("_id") _id: string,
    @Body() updateIdentityAccountDto: UpdateIdentityAccountDto
  ) {
    return this.identitiesService.update(_id, updateIdentityAccountDto);
  }

  @Delete("/:_id")
  @ApiOperation({ summary: "Delete an identity account" })
  @ApiResponse({
    status: 200,
    description: "The identity account has been successfully deleted",
  })
  @ApiResponse({ status: 404, description: "Identity account not found" })
  @ApiParam({
    name: "_id",
    description: "The ID of the identity account to delete",
  })
  delete(@Param("_id") _id: string) {
    return this.identitiesService.delete(_id);
  }
}
