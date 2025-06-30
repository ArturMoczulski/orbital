import { Controller, UseFilters } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import {
  MicroserviceController,
  PassThroughRpcExceptionFilter,
} from "@orbital/microservices";
import { CrudController } from "@orbital/nest";
import { AreaModel as Area } from "@orbital/typegoose";

@MicroserviceController(OrbitalMicroservices.World)
@Controller()
@UseFilters(new PassThroughRpcExceptionFilter(OrbitalMicroservices.World))
export class AreasMicroserviceController extends CrudController<
  Area,
  AreasService
> {
  constructor(areasService: AreasService) {
    super(areasService);
  }
}
