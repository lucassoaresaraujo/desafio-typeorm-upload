import fs from 'fs';
import csv from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import TypeTransaction from '../models/TypeTransaction';
import Category from '../models/Category';

interface Request {
  filePath: string;
}

interface ImportedTransaction {
  title: string;
  type: TypeTransaction;
  value: number;
  category: string;
  category_id?: string;
}

class ImportTransactionsService {
  async execute({ filePath }: Request): Promise<Transaction[] | null> {
    const transactions: ImportedTransaction[] = [];
    const categories: string[] = [];

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const transactionReadStream = fs.createReadStream(filePath);
    const parserCSV = transactionReadStream.pipe(
      csv({
        columns: ['title', 'type', 'value', 'category'],
        from_line: 2,
        trim: true,
      }),
    );

    parserCSV.on(
      'data',
      ({ title, type, value, category }: ImportedTransaction) => {
        categories.push(category);

        if (!title || !type || !value) return;

        transactions.push({
          title,
          type,
          value: Number(value),
          category,
        });
      },
    );
    await new Promise(resolve => parserCSV.on('end', resolve));

    const savedCategories = await categoryRepository.find({
      where: { title: In(categories) },
      select: ['id', 'title'],
    });

    const savedCatoriesTitle = savedCategories.map(category => category.title);

    const categoriesToCreate = categories
      .filter(category => !savedCatoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    let newCategories = categoryRepository.create(
      categoriesToCreate.map(title => ({ title })),
    );

    newCategories = await categoryRepository.save(newCategories);

    savedCategories.push(...newCategories);

    const bulkTransactions = transactions.map(
      (transaction: ImportedTransaction) => {
        const category_id = savedCategories.find(
          category => category.title === transaction.category,
        )?.id;
        const savedTransaction = transactionsRepository.create({
          title: transaction.title,
          value: transaction.value,
          type: transaction.type,
          category_id,
        });

        return savedTransaction;
      },
    );

    await transactionsRepository.save(bulkTransactions);

    fs.unlinkSync(filePath);

    return bulkTransactions;
  }
}

export default ImportTransactionsService;
