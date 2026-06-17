import type { FormValues } from '@/types/llm';

const passwordPattern = /password|passwd|pwd|密码|口令/i;
const paymentPattern = /payment|pay|支付|付款/i;
const verificationCodePattern = /code|otp|verification|verify|captcha|验证码|校验码|短信/i;
const cardPattern = /bank.*card|card.*number|银行卡|卡号/i;
const idCardPattern = /id.*card|identity|身份证|证件/i;
const phonePattern = /phone|mobile|tel|手机号|手机|电话/i;

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function maskByVisibleEdges(value: string, start: number, end: number) {
  if (value.length <= start + end) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, start)}${'*'.repeat(value.length - start - end)}${value.slice(-end)}`;
}

function maskBankCard(value: string) {
  const digits = onlyDigits(value);

  if (digits.length < 12) {
    return '银行卡号已隐藏';
  }

  return `银行卡号 ${maskByVisibleEdges(digits, 4, 4)}`;
}

function maskIdCard(value: string) {
  const normalized = value.replace(/\s/g, '');

  if (normalized.length < 8) {
    return '身份证号已隐藏';
  }

  return `身份证号 ${maskByVisibleEdges(normalized, 6, 4)}`;
}

function maskPhone(value: string) {
  const digits = onlyDigits(value);

  if (digits.length < 7) {
    return '手机号已隐藏';
  }

  return `手机号 ${maskByVisibleEdges(digits, 3, 4)}`;
}

function redactValue(key: string, value: string) {
  const normalizedKey = key.toLowerCase();

  if (paymentPattern.test(normalizedKey) && passwordPattern.test(normalizedKey)) {
    return '用户输入了支付密码';
  }

  if (passwordPattern.test(normalizedKey)) {
    return '用户输入了密码';
  }

  if (verificationCodePattern.test(normalizedKey)) {
    return '用户输入了验证码';
  }

  if (cardPattern.test(normalizedKey)) {
    return maskBankCard(value);
  }

  if (idCardPattern.test(normalizedKey)) {
    return maskIdCard(value);
  }

  if (phonePattern.test(normalizedKey)) {
    return maskPhone(value);
  }

  return value;
}

export function redactFormValues(formValues: FormValues): FormValues {
  return Object.fromEntries(
    Object.entries(formValues).map(([key, value]) => [key, redactValue(key, value)]),
  );
}
