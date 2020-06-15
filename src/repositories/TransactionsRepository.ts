import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
import TypeTransaction from '../models/TypeTransaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface SumRow {
  sum: string;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomePromise = this.createQueryBuilder('t')
      .select('sum(t.value)', 'sum')
      .where('t.type = :type', { type: TypeTransaction.income })
      .getRawOne<SumRow>();

    const outcomePromise = this.createQueryBuilder('t')
      .select('sum(t.value)', 'sum')
      .where('t.type = :type', { type: TypeTransaction.outcome })
      .getRawOne<SumRow>();

    const [income, outcome] = await Promise.all([
      incomePromise,
      outcomePromise,
    ]);

    const parsedIncome = Number(income.sum);
    const parsedOutcome = Number(outcome.sum);

    const balance: Balance = {
      income: parsedIncome,
      outcome: parsedOutcome,
      total: parsedIncome - parsedOutcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
