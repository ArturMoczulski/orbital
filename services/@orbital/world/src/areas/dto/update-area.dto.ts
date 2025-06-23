import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsArray,
} from "class-validator";
import { AreaMap, Position } from "@orbital/core";

export class UpdateAreaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  position?: Position;

  @IsObject()
  @IsOptional()
  areaMap?: AreaMap;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsString()
  @IsOptional()
  worldId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  landmarks?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  connections?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
