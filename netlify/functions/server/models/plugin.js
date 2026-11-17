// Applied to every schema so the API's JSON shape matches what the frontend
// was built against with Prisma: every document (and every populated
// sub-document, since each carries its own model's toJSON options) comes
// back with a plain `id` string instead of Mongo's `_id`/`__v`, and
// `passwordHash` never leaks even if a query forgets to exclude it.
export function idTransformPlugin(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  });
  schema.set('toObject', { virtuals: true });
}
