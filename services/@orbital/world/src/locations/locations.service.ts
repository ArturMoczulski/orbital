import { Injectable } from "@nestjs/common";
import { LocationsRepository } from "./locations.repository";
import { LocationModel } from "@orbital/typegoose";

@Injectable()
export class LocationsService {
  constructor(private readonly locationsRepository: LocationsRepository) {}

  async createLocation(dto: Partial<LocationModel>): Promise<LocationModel> {
    return this.locationsRepository.create(dto);
  }

  async getLocation(id: string): Promise<LocationModel | null> {
    return this.locationsRepository.findById(id);
  }
}
