import {
  AuthCredentials,
  IdentityAccount,
  IdentityProviderEnum,
} from "@orbital/identity-types";
import { modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: { collection: IdentityAccount.name, timestamps: true },
})
export class IdentityAccountModel {
  @prop({ auto: true })
  _id!: string;

  @prop({ required: true })
  characterId!: string;

  @prop({ enum: Object.values(IdentityProviderEnum), required: true })
  provider!: IdentityProviderEnum;

  @prop({ required: true })
  identifier!: string;

  @prop({ type: () => [Object], _id: false, default: [] })
  credentials!: AuthCredentials[];
}
