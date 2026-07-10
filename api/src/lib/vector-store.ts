/**
 * Vector store: Pinecone when PINECONE_API_KEY + index set, else Postgres JSON vectors.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { cosineSimilarity, embedText } from "./embeddings.js";

export type VectorHit = {
  id: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function upsertVectorDoc(doc: {
  id?: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true; id: string; mode: "pinecone" | "postgres" } | { ok: false; error: string }> {
  const emb = await embedText(`${doc.title}\n${doc.content}`);
  if (!emb.ok) return { ok: false, error: emb.error };

  const meta = doc.metadata ?? {};
  const pinecone = await tryPineconeUpsert({
    id: doc.id ?? `${doc.sourceType}:${doc.sourceId}`,
    values: emb.vector,
    metadata: {
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      title: doc.title,
      content: doc.content.slice(0, 2000),
      ...Object.fromEntries(
        Object.entries(meta).filter(
          ([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
        ),
      ),
    },
  });
  if (pinecone.ok) {
    await prisma.vectorDocument.upsert({
      where: { sourceType_sourceId: { sourceType: doc.sourceType, sourceId: doc.sourceId } },
      create: {
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        title: doc.title,
        content: doc.content,
        embedding: asJson(emb.vector),
        dim: emb.dim,
        metadata: asJson(meta),
        backend: "pinecone",
      },
      update: {
        title: doc.title,
        content: doc.content,
        embedding: asJson(emb.vector),
        dim: emb.dim,
        metadata: asJson(meta),
        backend: "pinecone",
      },
    });
    return { ok: true, id: pinecone.id, mode: "pinecone" };
  }

  const row = await prisma.vectorDocument.upsert({
    where: { sourceType_sourceId: { sourceType: doc.sourceType, sourceId: doc.sourceId } },
    create: {
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      title: doc.title,
      content: doc.content,
      embedding: asJson(emb.vector),
      dim: emb.dim,
      metadata: asJson(meta),
      backend: "postgres",
    },
    update: {
      title: doc.title,
      content: doc.content,
      embedding: asJson(emb.vector),
      dim: emb.dim,
      metadata: asJson(meta),
      backend: "postgres",
    },
  });
  return { ok: true, id: row.id, mode: "postgres" };
}

export async function queryVectors(query: string, topK = 5): Promise<VectorHit[]> {
  const emb = await embedText(query);
  if (!emb.ok) return [];

  const pine = await tryPineconeQuery(emb.vector, topK);
  if (pine.length) return pine;

  const rows = await prisma.vectorDocument.findMany({ take: 200 });
  const scored = rows
    .map((r) => {
      const vec = Array.isArray(r.embedding) ? (r.embedding as number[]) : [];
      return {
        id: r.id,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        title: r.title,
        content: r.content,
        score: cosineSimilarity(emb.vector, vec),
        metadata: (r.metadata as Record<string, unknown>) ?? undefined,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}

async function tryPineconeUpsert(args: {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  const key = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX?.trim();
  if (!key || !indexName) return { ok: false };
  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pc = new Pinecone({ apiKey: key });
    const index = pc.index({ name: indexName });
    await index.upsert({
      records: [
        {
          id: args.id,
          values: args.values,
          metadata: args.metadata,
        },
      ],
    });
    return { ok: true, id: args.id };
  } catch {
    return { ok: false };
  }
}

async function tryPineconeQuery(values: number[], topK: number): Promise<VectorHit[]> {
  const key = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX?.trim();
  if (!key || !indexName) return [];
  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pc = new Pinecone({ apiKey: key });
    const index = pc.index({ name: indexName });
    const res = await index.query({ vector: values, topK, includeMetadata: true });
    return (res.matches ?? []).map((m) => {
      const md = (m.metadata ?? {}) as Record<string, string>;
      return {
        id: m.id,
        sourceType: md.sourceType ?? "unknown",
        sourceId: md.sourceId ?? m.id,
        title: md.title ?? m.id,
        content: md.content ?? "",
        score: m.score ?? 0,
        metadata: md,
      };
    });
  } catch {
    return [];
  }
}

export async function reindexCatalogVectors(): Promise<{ upserted: number; errors: number }> {
  let upserted = 0;
  let errors = 0;
  const hotels = await prisma.hotel.findMany({ take: 500 });
  for (const h of hotels) {
    const r = await upsertVectorDoc({
      sourceType: "hotel",
      sourceId: h.id,
      title: h.name,
      content: `${h.name}. ${h.descriptionEn}. ${h.descriptionVi}. amenities: ${h.amenities.join(", ")}`,
      metadata: { slug: h.slug, priceFromVnd: h.priceFromVnd },
    });
    if (r.ok) upserted++;
    else errors++;
  }
  const tours = await prisma.tour.findMany({ take: 500 });
  for (const t of tours) {
    const r = await upsertVectorDoc({
      sourceType: "tour",
      sourceId: t.id,
      title: t.titleEn,
      content: `${t.titleEn} ${t.titleVi}. ${t.descriptionEn}. ${t.descriptionVi}`,
      metadata: { slug: t.slug, priceFromVnd: t.priceFromVnd },
    });
    if (r.ok) upserted++;
    else errors++;
  }
  return { upserted, errors };
}

export function formatVectorHitsAsContext(hits: VectorHit[]): string {
  if (!hits.length) return "";
  const lines = hits.map(
    (h) => `- [${h.sourceType}] ${h.title} (score=${h.score.toFixed(3)}): ${h.content.slice(0, 200)}`,
  );
  return `VECTOR_CONTEXT (semantic retrieval):\n${lines.join("\n")}`;
}
