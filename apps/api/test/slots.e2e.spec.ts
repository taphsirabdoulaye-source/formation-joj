import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { disciplineSchema, registrationSchema, slotSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

describe('/api/slots (e2e)', () => {
  let app: INestApplication;
  let disciplineId: string;
  const api = () => request(app.getHttpServer());

  const slotBody = (overrides: Record<string, unknown> = {}) => ({
    disciplineId,
    startsAt: '2026-11-01T09:00:00.000Z',
    endsAt: '2026-11-01T12:00:00.000Z',
    capacity: 2,
    ...overrides,
  });

  const openSlot = async (capacity = 2) => {
    const response = await api().post('/api/slots').send(slotBody({ capacity })).expect(201);
    return slotSchema.parse(response.body);
  };

  beforeAll(async () => {
    app = await createTestApp();
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Lutte', category: 'sports-de-combat' })
      .expect(201);
    disciplineId = disciplineSchema.parse(response.body).id;
  });

  afterAll(() => app?.close());

  it('001-AS1: opens a slot (201) with its discipline, times, capacity and no registration', async () => {
    const response = await api().post('/api/slots').send(slotBody()).expect(201);

    expect(slotSchema.parse(response.body)).toMatchObject({
      disciplineId,
      startsAt: '2026-11-01T09:00:00.000Z',
      endsAt: '2026-11-01T12:00:00.000Z',
      capacity: 2,
      registeredCount: 0,
    });
  });

  it.each([
    ['a capacity of 0', { capacity: 0 }, 'capacity'],
    ['an end equal to the start', { endsAt: '2026-11-01T09:00:00.000Z' }, 'endsAt'],
    ['an end before the start', { endsAt: '2026-11-01T08:00:00.000Z' }, 'endsAt'],
  ])('001-AS2: rejects %s (400, RFC 9457, names the field)', async (_label, overrides, field) => {
    const response = await api().post('/api/slots').send(slotBody(overrides)).expect(400);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: field })]);
  });

  it('001-AS2: rejects a capacity beyond the column range (400, names capacity)', async () => {
    const response = await api()
      .post('/api/slots')
      .send(slotBody({ capacity: 3_000_000_000 }))
      .expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'capacity' })]);
  });

  it('001-AS3: refuses a slot for an unknown discipline (404)', async () => {
    const response = await api()
      .post('/api/slots')
      .send(slotBody({ disciplineId: randomUUID() }))
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_DISCIPLINE_NOT_FOUND' });
  });

  it('001-AS4: registers a volunteer on a slot (201)', async () => {
    const slot = await openSlot();

    const response = await api()
      .post(`/api/slots/${slot.id}/registrations`)
      .send({ name: 'Awa Diop', email: 'awa.diop@example.com' })
      .expect(201);

    expect(registrationSchema.parse(response.body)).toMatchObject({
      slotId: slot.id,
      name: 'Awa Diop',
      email: 'awa.diop@example.com',
    });
  });

  it('001-AS5: accepts two volunteers and refuses the third (409 SLOT_FULL)', async () => {
    const slot = await openSlot(2);
    const register = (name: string) =>
      api()
        .post(`/api/slots/${slot.id}/registrations`)
        .send({ name, email: `${name.toLowerCase()}@example.com` });

    await register('Awa').expect(201);
    await register('Moussa').expect(201);
    const response = await register('Fatou').expect(409);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 409, code: 'SLOT_FULL' });
  });

  it.each([
    ['an empty name', { name: '  ', email: 'awa.diop@example.com' }, 'name'],
    ['a malformed email', { name: 'Awa Diop', email: 'awa.diop' }, 'email'],
  ])('001-AS6: rejects %s (400, names the field)', async (_label, body, field) => {
    const slot = await openSlot();

    const response = await api().post(`/api/slots/${slot.id}/registrations`).send(body).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: field })]);
  });

  it('001-AS6: refuses a registration on an unknown slot (404)', async () => {
    const response = await api()
      .post(`/api/slots/${randomUUID()}/registrations`)
      .send({ name: 'Awa Diop', email: 'awa.diop@example.com' })
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_NOT_FOUND' });
  });
});
