import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsArray,
} from "class-validator";
import { AreaMap, Position } from "@orbital/core";

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  @IsNotEmpty()
  position: Position;

  @IsObject()
  @IsOptional()
  areaMap?: AreaMap;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsString()
  @IsNotEmpty()
  worldId: string;

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
