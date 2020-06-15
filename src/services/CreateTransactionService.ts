// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TypeTransaction from '../models/TypeTransaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: TypeTransaction;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
    });

    let transactionCategory = await categoryRepository.findOne({
      where: { title },
    });

    if (!transactionCategory) {
      transactionCategory = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(transactionCategory);
    }

    transaction.category_id = transactionCategory.id;

    return transactionRepository.save(transaction);
  }
}

export default CreateTransactionService;
