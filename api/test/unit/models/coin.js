const { expect } = require('chai');
const { describe, it, before, beforeEach, afterEach } = require('mocha');

describe('coin model', () => {
  let user, wallets, db;
  let User, Wallet, Coin;
  before(async () => {
    db = require('../')();
    User = db.User;
    Wallet = db.Wallet;
    Coin = db.Coin;

    await User.sync({ force: true });
    await Wallet.sync({ force: true });
    await Coin.sync({ force: true });
  })

  beforeEach(async () => {
    user = await User.create({
      name: 'Test',
      password: 'Test'
    })

    wallets = await Wallet.bulkCreate([
      {
        name: 'local btc',
        address: 'abcdefg',
        local: true,
        userId: user.id
      },
      {
        name: 'remote btc',
        address: 'abcdefg',
        local: false,
        userId: user.id
      }
    ])
  })

  it('should be able to create a coin with defaults', async () => {
      const coin = await Coin.create({
        name: 'Bitcoin',
        code: 'BTC'
      })

      expect(coin.name).to.equal('Bitcoin');
      expect(coin.code).to.equal('BTC');
      expect(coin.feeTolerance).to.equal('0');
      expect(coin.active).to.equal(false);
      expect(coin.portfolioWeight).to.equal(0);
      expect(coin.localAmount).to.equal('0');
      expect(coin.exchangeAmount).to.equal('0');
      expect(coin.purchaseAmount).to.equal('0');
  });

  it('should be able to create a coin with non-defaults', async () => {
    const coin = await Coin.create({
      name: 'Bitcoin',
      code: 'BTC',
      feeTolerance: '0.0012',
      active: true,
      portfolioWeight: 50,
      localAmount: '500',
      exchangeAmount: '500',
      purchaseAmount: '0',
      localWalletId: wallets[0].id,
      exchangeWalletId: wallets[1].id,
      UserId: user.id
    })

    expect(coin.feeTolerance).to.equal('0.0012');
    expect(coin.active).to.be.true;
    expect(coin.portfolioWeight).to.equal(50);
    expect(coin.localAmount).to.equal('500');
    expect(coin.exchangeAmount).to.equal('500');
    expect(coin.purchaseAmount).to.equal('0');

    const [
      localWallet,
      exchangeWallet,
      coinUser
    ] = await Promise.all([
      coin.getLocalWallet(),
      coin.getExchangeWallet(),
      coin.getUser()
    ]);

    expect(localWallet.name).to.equal('local btc');
    expect(exchangeWallet.name).to.equal('remote btc');
    expect(coinUser.name).to.equal('Test');
  })

  afterEach(async () => {
    return await user.destroy();
  })
});