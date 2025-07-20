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
import { CharactersService } from "./characters.service";
import { CreateCharacterDto, UpdateCharacterDto } from "./dto/character.dto";

@ApiTags("characters")
@Controller("characters")
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({ summary: "Get all characters" })
  @ApiResponse({ status: 200, description: "Returns all characters" })
  @ApiQuery({
    name: "locationId",
    required: false,
    description: "Filter characters by location ID",
  })
  @ApiQuery({
    name: "worldId",
    required: false,
    description: "Filter characters by world ID",
  })
  find(
    @Query("locationId") locationId?: string,
    @Query("worldId") worldId?: string
  ) {
    if (locationId) {
      return this.charactersService.findByLocationId(locationId);
    } else if (worldId) {
      return this.charactersService.findByWorldId(worldId);
    } else {
      return this.charactersService.find();
    }
  }

  @Get("/:_id")
  @ApiOperation({ summary: "Get character by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns the character with the specified ID",
  })
  @ApiResponse({ status: 404, description: "Character not found" })
  @ApiParam({
    name: "_id",
    description: "The ID of the character to retrieve",
  })
  async findById(@Param("_id") _id: string) {
    try {
      return await this.charactersService.findById(_id);
    } catch (error) {
      throw new NotFoundException(`Character with id ${_id} not found`);
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a new character" })
  @ApiResponse({
    status: 201,
    description: "The character has been successfully created.",
  })
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.charactersService.create(createCharacterDto);
  }

  @Put("/:_id")
  @ApiOperation({ summary: "Update an existing character" })
  @ApiResponse({
    status: 200,
    description: "The character has been successfully updated.",
  })
  @ApiParam({
    name: "_id",
    description: "The ID of the character to update",
  })
  update(
    @Param("_id") _id: string,
    @Body() updateCharacterDto: UpdateCharacterDto
  ) {
    return this.charactersService.update(_id, updateCharacterDto);
  }

  @Delete("/:_id")
  @ApiOperation({ summary: "Delete a character" })
  @ApiResponse({
    status: 200,
    description: "The character has been successfully deleted",
  })
  @ApiResponse({ status: 404, description: "Character not found" })
  @ApiParam({
    name: "_id",
    description: "The ID of the character to delete",
  })
  delete(@Param("_id") _id: string) {
    return this.charactersService.delete(_id);
  }
}
