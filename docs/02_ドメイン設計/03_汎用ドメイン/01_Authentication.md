---
title: Authentication ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 汎用ドメイン
  - Authentication
---

# Authentication ドメイン

## 概要

Authentication ドメインは、stats47 プロジェクトの汎用ドメインの一つで、ユーザー認証とセッション管理を担当します。ユーザー認証、セッション管理、権限制御、ロール管理など、認証・認可に関するすべての機能を提供します。

### ビジネス価値

- **セキュリティの確保**: 適切な認証・認可により、システムのセキュリティを保証
- **ユーザー体験の向上**: シームレスなログイン・ログアウト体験の提供
- **権限管理**: 細かい権限制御により、適切なアクセス制御を実現
- **コンプライアンス**: セキュリティ要件への準拠

## 責務

- ユーザー認証（ログイン・ログアウト）
- セッション管理
- 権限制御
- ロール管理
- パスワード管理
- 多要素認証（MFA）
- アカウント管理
- セキュリティ監査

## 主要エンティティ

### User（ユーザー）

ユーザーの基本情報を管理するエンティティ。

**属性:**
- `id`: ユーザー ID
- `email`: メールアドレス
- `username`: ユーザー名
- `passwordHash`: パスワードハッシュ
- `firstName`: 名
- `lastName`: 姓
- `isActive`: 有効フラグ
- `emailVerified`: メール認証済みフラグ
- `lastLoginAt`: 最終ログイン日時
- `createdAt`: 作成日時

### Session（セッション）

ユーザーセッションの情報を管理するエンティティ。

**属性:**
- `id`: セッション ID
- `userId`: ユーザー ID
- `token`: セッショントークン
- `expiresAt`: 有効期限
- `createdAt`: 作成日時
- `lastAccessedAt`: 最終アクセス日時
- `ipAddress`: IP アドレス
- `userAgent`: ユーザーエージェント
- `isActive`: 有効フラグ

### Role（ロール）

ユーザーのロールを管理するエンティティ。

**属性:**
- `id`: ロール ID
- `name`: ロール名
- `description`: 説明
- `permissions`: 権限リスト
- `isSystemRole`: システムロールフラグ
- `createdAt`: 作成日時

### Permission（権限）

システムの権限を管理するエンティティ。

**属性:**
- `id`: 権限 ID
- `name`: 権限名
- `resource`: リソース
- `action`: アクション
- `description`: 説明

### UserRole（ユーザーロール）

ユーザーとロールの関連を管理するエンティティ。

**属性:**
- `userId`: ユーザー ID
- `roleId`: ロール ID
- `assignedAt`: 割り当て日時
- `assignedBy`: 割り当て者
- `expiresAt`: 有効期限

### AuditLog（監査ログ）

認証関連の監査ログを管理するエンティティ。

**属性:**
- `id`: ログ ID
- `userId`: ユーザー ID
- `action`: アクション
- `resource`: リソース
- `timestamp`: タイムスタンプ
- `ipAddress`: IP アドレス
- `userAgent`: ユーザーエージェント
- `result`: 結果（成功/失敗）
- `details`: 詳細情報

## 値オブジェクト

### Email（メールアドレス）

メールアドレスを表現する値オブジェクト。

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<Email> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Result.fail("Invalid email format");
    }
    return Result.ok(new Email(value.toLowerCase()));
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split("@")[1];
  }

  getLocalPart(): string {
    return this.value.split("@")[0];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Password（パスワード）

パスワードを表現する値オブジェクト。

```typescript
export class Password {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<Password> {
    if (value.length < 8) {
      return Result.fail("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(value)) {
      return Result.fail("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(value)) {
      return Result.fail("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(value)) {
      return Result.fail("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return Result.fail("Password must contain at least one special character");
    }
    return Result.ok(new Password(value));
  }

  getValue(): string {
    return this.value;
  }

  getHash(): string {
    return bcrypt.hashSync(this.value, 10);
  }

  verify(hashedPassword: string): boolean {
    return bcrypt.compareSync(this.value, hashedPassword);
  }

  isStrong(): boolean {
    return this.value.length >= 12 && 
           /[A-Z]/.test(this.value) && 
           /[a-z]/.test(this.value) && 
           /[0-9]/.test(this.value) && 
           /[!@#$%^&*(),.?":{}|<>]/.test(this.value);
  }
}
```

### SessionToken（セッショントークン）

セッショントークンを表現する値オブジェクト。

```typescript
export class SessionToken {
  private constructor(private readonly value: string) {}

  static create(): SessionToken {
    const token = crypto.randomBytes(32).toString("hex");
    return new SessionToken(token);
  }

  static fromString(value: string): Result<SessionToken> {
    if (!value || value.length !== 64) {
      return Result.fail("Invalid session token format");
    }
    return Result.ok(new SessionToken(value));
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SessionToken): boolean {
    return this.value === other.value;
  }

  isValid(): boolean {
    return this.value.length === 64 && /^[a-f0-9]+$/.test(this.value);
  }
}
```

## ドメインサービス

### AuthenticationService

認証の基本操作を実装するドメインサービス。

```typescript
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService
  ) {}

  async login(
    email: Email,
    password: Password,
    ipAddress: string,
    userAgent: string
  ): Promise<Result<Session>> {
    try {
      // ユーザーを検索
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        await this.auditService.logFailedLogin(email.getValue(), ipAddress, userAgent, "User not found");
        return Result.fail("Invalid credentials");
      }

      // アカウント状態チェック
      if (!user.isActive()) {
        await this.auditService.logFailedLogin(email.getValue(), ipAddress, userAgent, "Account inactive");
        return Result.fail("Account is inactive");
      }

      // パスワード検証
      if (!password.verify(user.getPasswordHash())) {
        await this.auditService.logFailedLogin(email.getValue(), ipAddress, userAgent, "Invalid password");
        return Result.fail("Invalid credentials");
      }

      // セッション作成
      const session = await this.createSession(user, ipAddress, userAgent);
      
      // 最終ログイン日時更新
      user.updateLastLoginAt(new Date());
      await this.userRepository.save(user);

      // 監査ログ記録
      await this.auditService.logSuccessfulLogin(user.getId(), ipAddress, userAgent);

      return Result.ok(session);
    } catch (error) {
      return Result.fail(`Login failed: ${error.message}`);
    }
  }

  async logout(sessionToken: SessionToken): Promise<Result<void>> {
    try {
      const session = await this.sessionRepository.findByToken(sessionToken);
      if (!session) {
        return Result.fail("Session not found");
      }

      // セッション無効化
      session.deactivate();
      await this.sessionRepository.save(session);

      // 監査ログ記録
      await this.auditService.logLogout(session.getUserId());

      return Result.ok();
    } catch (error) {
      return Result.fail(`Logout failed: ${error.message}`);
    }
  }

  async refreshSession(sessionToken: SessionToken): Promise<Result<Session>> {
    try {
      const session = await this.sessionRepository.findByToken(sessionToken);
      if (!session || !session.isActive()) {
        return Result.fail("Invalid session");
      }

      if (session.isExpired()) {
        session.deactivate();
        await this.sessionRepository.save(session);
        return Result.fail("Session expired");
      }

      // セッション延長
      session.extend();
      await this.sessionRepository.save(session);

      return Result.ok(session);
    } catch (error) {
      return Result.fail(`Session refresh failed: ${error.message}`);
    }
  }

  private async createSession(
    user: User,
    ipAddress: string,
    userAgent: string
  ): Promise<Session> {
    const token = SessionToken.create();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

    const session = Session.create({
      userId: user.getId(),
      token,
      expiresAt,
      ipAddress,
      userAgent,
    }).getValue();

    await this.sessionRepository.save(session);
    return session;
  }
}
```

### AuthorizationService

認可のロジックを実装するドメインサービス。

```typescript
export class AuthorizationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository
  ) {}

  async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      const userRoles = await this.roleRepository.findByUserId(userId);
      const permissions = await this.permissionRepository.findByRoles(userRoles);

      return permissions.some(permission => 
        permission.getResource() === resource && 
        permission.getAction() === action
      );
    } catch (error) {
      return false;
    }
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const userRoles = await this.roleRepository.findByUserId(userId);
      return userRoles.some(role => role.getName() === roleName);
    } catch (error) {
      return false;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const userRoles = await this.roleRepository.findByUserId(userId);
      return await this.permissionRepository.findByRoles(userRoles);
    } catch (error) {
      return [];
    }
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail("User not found");
      }

      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        return Result.fail("Role not found");
      }

      const userRole = UserRole.create({
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
      }).getValue();

      await this.roleRepository.saveUserRole(userRole);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Role assignment failed: ${error.message}`);
    }
  }

  async revokeRole(userId: string, roleId: string): Promise<Result<void>> {
    try {
      await this.roleRepository.deleteUserRole(userId, roleId);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Role revocation failed: ${error.message}`);
    }
  }
}
```

### PasswordService

パスワード管理を実装するドメインサービス。

```typescript
export class PasswordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService
  ) {}

  async changePassword(
    userId: string,
    currentPassword: Password,
    newPassword: Password
  ): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail("User not found");
      }

      // 現在のパスワード検証
      if (!currentPassword.verify(user.getPasswordHash())) {
        await this.auditService.logPasswordChangeAttempt(userId, false, "Invalid current password");
        return Result.fail("Current password is incorrect");
      }

      // 新しいパスワードの設定
      const newPasswordHash = newPassword.getHash();
      user.updatePasswordHash(newPasswordHash);
      await this.userRepository.save(user);

      // 監査ログ記録
      await this.auditService.logPasswordChangeAttempt(userId, true, "Password changed successfully");

      return Result.ok();
    } catch (error) {
      return Result.fail(`Password change failed: ${error.message}`);
    }
  }

  async resetPassword(
    email: Email,
    resetToken: string,
    newPassword: Password
  ): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return Result.fail("User not found");
      }

      // リセットトークンの検証
      if (!this.isValidResetToken(user, resetToken)) {
        return Result.fail("Invalid or expired reset token");
      }

      // 新しいパスワードの設定
      const newPasswordHash = newPassword.getHash();
      user.updatePasswordHash(newPasswordHash);
      user.clearResetToken();
      await this.userRepository.save(user);

      // 監査ログ記録
      await this.auditService.logPasswordReset(user.getId(), true);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Password reset failed: ${error.message}`);
    }
  }

  async generateResetToken(email: Email): Promise<Result<string>> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return Result.fail("User not found");
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間

      user.setResetToken(resetToken, expiresAt);
      await this.userRepository.save(user);

      return Result.ok(resetToken);
    } catch (error) {
      return Result.fail(`Reset token generation failed: ${error.message}`);
    }
  }

  private isValidResetToken(user: User, token: string): boolean {
    const resetToken = user.getResetToken();
    const resetTokenExpiresAt = user.getResetTokenExpiresAt();

    if (!resetToken || !resetTokenExpiresAt) {
      return false;
    }

    if (resetToken !== token) {
      return false;
    }

    if (new Date() > resetTokenExpiresAt) {
      return false;
    }

    return true;
  }
}
```

## リポジトリ

### UserRepository

ユーザーデータの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findActive(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByEmail(email: Email): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}
```

### SessionRepository

セッションデータの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface SessionRepository {
  findByToken(token: SessionToken): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  findActive(): Promise<Session[]>;
  save(session: Session): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
  exists(token: SessionToken): Promise<boolean>;
}
```

## ディレクトリ構造

```
src/domain/auth/
├── entities/
│   ├── User.ts
│   ├── Session.ts
│   ├── Role.ts
│   ├── Permission.ts
│   ├── UserRole.ts
│   └── AuditLog.ts
├── value-objects/
│   ├── Email.ts
│   ├── Password.ts
│   ├── SessionToken.ts
│   ├── UserId.ts
│   └── ResetToken.ts
├── services/
│   ├── AuthenticationService.ts
│   ├── AuthorizationService.ts
│   ├── PasswordService.ts
│   ├── SessionService.ts
│   ├── RoleService.ts
│   └── AuditService.ts
├── repositories/
│   ├── UserRepository.ts
│   ├── SessionRepository.ts
│   ├── RoleRepository.ts
│   └── PermissionRepository.ts
├── strategies/
│   ├── PasswordStrategy.ts
│   └── SessionStrategy.ts
└── specifications/
    ├── UserSpecification.ts
    └── SessionSpecification.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/domain/auth/entities/User.ts
export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private username: string,
    private passwordHash: string,
    private firstName: string,
    private lastName: string,
    private isActive: boolean,
    private emailVerified: boolean,
    private lastLoginAt: Date | null,
    private readonly createdAt: Date,
    private resetToken: string | null,
    private resetTokenExpiresAt: Date | null
  ) {}

  static create(props: {
    id: UserId;
    email: Email;
    username: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Result<User> {
    if (!props.username || props.username.trim().length === 0) {
      return Result.fail("Username cannot be empty");
    }
    if (!props.firstName || props.firstName.trim().length === 0) {
      return Result.fail("First name cannot be empty");
    }
    if (!props.lastName || props.lastName.trim().length === 0) {
      return Result.fail("Last name cannot be empty");
    }

    return Result.ok(
      new User(
        props.id,
        props.email,
        props.username,
        props.passwordHash,
        props.firstName,
        props.lastName,
        true,
        false,
        null,
        new Date(),
        null,
        null
      )
    );
  }

  updateEmail(newEmail: Email): Result<void> {
    this.email = newEmail;
    this.emailVerified = false; // メール変更時は再認証が必要
    return Result.ok();
  }

  updatePasswordHash(newHash: string): void {
    this.passwordHash = newHash;
  }

  updateLastLoginAt(date: Date): void {
    this.lastLoginAt = date;
  }

  verifyEmail(): void {
    this.emailVerified = true;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  setResetToken(token: string, expiresAt: Date): void {
    this.resetToken = token;
    this.resetTokenExpiresAt = expiresAt;
  }

  clearResetToken(): void {
    this.resetToken = null;
    this.resetTokenExpiresAt = null;
  }

  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getUsername(): string {
    return this.username;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isActive(): boolean {
    return this.isActive;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  getLastLoginAt(): Date | null {
    return this.lastLoginAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
```

### 仕様実装例

```typescript
// src/domain/auth/specifications/UserSpecification.ts
export class UserSpecification {
  static isActive(user: User): boolean {
    return user.isActive();
  }

  static isEmailVerified(user: User): boolean {
    return user.isEmailVerified();
  }

  static hasRecentLogin(user: User, days: number = 30): boolean {
    const lastLogin = user.getLastLoginAt();
    if (!lastLogin) {
      return false;
    }
    
    const now = new Date();
    const diffDays = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  static isNewUser(user: User, days: number = 7): boolean {
    const createdAt = user.getCreatedAt();
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  static canLogin(user: User): boolean {
    return user.isActive() && user.isEmailVerified();
  }
}
```

## ベストプラクティス

### 1. セキュリティ

- パスワードの適切なハッシュ化
- セッション管理の強化
- 監査ログの記録

### 2. パフォーマンス

- セッションの効率的な管理
- 権限チェックの最適化
- キャッシュ戦略の活用

### 3. ユーザビリティ

- シームレスな認証体験
- 適切なエラーメッセージ
- セキュリティと使いやすさのバランス

### 4. コンプライアンス

- データ保護規制への準拠
- セキュリティ監査の実施
- プライバシー保護の実装

## 関連ドメイン

- **Content Management ドメイン**: ユーザー権限に基づくコンテンツ管理
- **Analytics ドメイン**: ユーザー行動の分析
- **Search ドメイン**: ユーザー固有の検索履歴管理

---

**更新履歴**:

- 2025-01-20: 初版作成
