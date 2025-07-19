import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ConversationsService } from "./conversations.service";
import {
  AddMessageDto,
  ConversationDto,
  CreateConversationDto,
  UpdateConversationDto,
} from "./dto/conversation.dto";

@ApiTags("conversations")
@Controller("conversations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: "Get all conversations" })
  @ApiResponse({
    status: 200,
    description: "Return all conversations",
    type: [ConversationDto],
  })
  async findAll() {
    return this.conversationsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a conversation by ID" })
  @ApiResponse({
    status: 200,
    description: "Return the conversation",
    type: ConversationDto,
  })
  async findById(@Param("id") id: string) {
    return this.conversationsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new conversation" })
  @ApiResponse({
    status: 201,
    description: "The conversation has been successfully created",
    type: ConversationDto,
  })
  async create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a conversation" })
  @ApiResponse({
    status: 200,
    description: "The conversation has been successfully updated",
    type: ConversationDto,
  })
  async update(
    @Param("id") id: string,
    @Body() updateConversationDto: UpdateConversationDto
  ) {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a conversation" })
  @ApiResponse({
    status: 200,
    description: "The conversation has been successfully deleted",
    type: ConversationDto,
  })
  async delete(@Param("id") id: string) {
    return this.conversationsService.delete(id);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Add a message to a conversation" })
  @ApiResponse({
    status: 200,
    description: "The message has been successfully added",
    type: ConversationDto,
  })
  async addMessage(
    @Param("id") id: string,
    @Body() addMessageDto: AddMessageDto
  ) {
    return this.conversationsService.addMessage(
      id,
      addMessageDto.text,
      addMessageDto.characterId
    );
  }
}
