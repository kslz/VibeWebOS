import { describe, expect, it } from 'vitest';

import { redactFormValues } from './redactFormValues';

describe('redactFormValues', () => {
  it('redacts password, payment password, and verification code fields', () => {
    expect(
      redactFormValues({
        password: 'secret-123',
        paymentPassword: 'pay-secret',
        smsCode: '938271',
      }),
    ).toEqual({
      password: '用户输入了密码',
      paymentPassword: '用户输入了支付密码',
      smsCode: '用户输入了验证码',
    });
  });

  it('masks bank card, ID card, and phone values into summaries', () => {
    expect(
      redactFormValues({
        bankCard: '6222021234567890123',
        idCard: '11010519491231002X',
        phone: '13800138000',
      }),
    ).toEqual({
      bankCard: '银行卡号 6222***********0123',
      idCard: '身份证号 110105********002X',
      phone: '手机号 138****8000',
    });
  });

  it('preserves email, normal text, addresses, search terms, and payment amount', () => {
    expect(
      redactFormValues({
        email: 'user@example.com',
        query: '项目管理',
        note: '明天下午三点开会',
        address: '上海市浦东新区世纪大道 1 号',
        amount: '199.00',
      }),
    ).toEqual({
      email: 'user@example.com',
      query: '项目管理',
      note: '明天下午三点开会',
      address: '上海市浦东新区世纪大道 1 号',
      amount: '199.00',
    });
  });
});
