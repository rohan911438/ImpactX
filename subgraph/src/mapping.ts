import { ImpactVerified, ImpactAttested, PoolCreated } from "../generated/ImpactX/ImpactX";
import { Impact, Attestation, Pool } from "../generated/schema";

export function handleImpactVerified(event: ImpactVerified): void {
  const id = event.params.impactId;
  let entity = Impact.load(id);
  if (!entity) entity = new Impact(id);
  entity.wallet = event.params.wallet;
  entity.actionType = event.params.actionType;
  entity.aiScore = event.params.aiScore.toI32();
  entity.createdAt = event.params.timestamp;
  entity.save();
}

export function handleImpactAttested(event: ImpactAttested): void {
  const id = event.params.attestationId;
  const a = new Attestation(id);
  a.wallet = event.params.wallet;
  a.impactId = event.params.impactId;
  a.createdAt = event.block.timestamp;
  a.schema = "ImpactClaim@1";
  a.save();
}

export function handlePoolCreated(event: PoolCreated): void {
  const id = event.transaction.hash.toHex();
  const p = new Pool(id);
  p.name = event.params.name;
  p.startAt = event.params.startAt;
  p.endAt = event.params.endAt;
  p.budget = event.params.budget;
  p.save();
}
