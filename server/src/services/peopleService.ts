import { AppError } from '../lib/AppError';
import { buildMeta, type ListQuery } from '../lib/listQuery';
import { peopleRepository } from '../repositories/peopleRepository';
import type { CreatePersonInput, UpdatePersonInput } from '../validators/people.schema';

export async function list(query: ListQuery) {
  const { rows, total } = await peopleRepository.list(query);
  return { data: rows, meta: buildMeta(query.page, query.pageSize, total) };
}

export async function getById(id: string) {
  const person = await peopleRepository.findById(id);
  if (!person) throw AppError.notFound('Person', id);
  return person;
}

export async function create(input: CreatePersonInput) {
  return peopleRepository.create(input);
}

export async function update(id: string, input: UpdatePersonInput) {
  await getById(id);
  return peopleRepository.update(id, input);
}

export async function archive(id: string) {
  await getById(id);
  return peopleRepository.setArchived(id, true);
}

export async function restore(id: string) {
  await getById(id);
  return peopleRepository.setArchived(id, false);
}

export const peopleService = { list, getById, create, update, archive, restore };
