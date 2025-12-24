import { SignatureGuard } from './signature.guard';

describe('SignatureGuard', () => {
  it('should be defined', () => {
    expect(new SignatureGuard()).toBeDefined();
  });
});
