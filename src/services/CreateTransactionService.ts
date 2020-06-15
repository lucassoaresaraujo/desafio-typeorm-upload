// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TypeTransaction from '../models/TypeTransaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

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
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();
    const transactionValueGreaterTotal = value > total;

    if (type === TypeTransaction.outcome && transactionValueGreaterTotal) {
      throw new AppError('Transaction amount greater than the total');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
    });

    let transactionCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(transactionCategory);
    }

    transaction.category_id = transactionCategory.id;

    return transactionsRepository.save(transaction);
  }
}

export default CreateTransactionService;
