import {
  AuthCredentials,
  IdentityAccount,
  IdentityProviderEnum,
} from "@orbital/identity-types";
import { CharacterModel } from "@orbital/typegoose";
import { modelOptions, prop, Ref } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: { collection: IdentityAccount.name, timestamps: true },
})
export class IdentityAccountModel {
  @prop({ auto: true })
  _id!: string;

  @prop({ ref: () => CharacterModel, required: true })
  characterId!: Ref<CharacterModel>;

  @prop({ enum: Object.values(IdentityProviderEnum), required: true })
  provider!: IdentityProviderEnum;

  @prop({ required: true })
  identifier!: string;

  @prop({ type: () => [Object], _id: false, default: [] })
  credentials!: AuthCredentials[];
}
