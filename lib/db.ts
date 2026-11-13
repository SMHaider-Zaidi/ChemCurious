import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// Load environment variables from .env.local before Sequelize initialization
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Sequelize connection using environment variables with connection pooling
const isSslEnabled = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
const sequelize = new Sequelize(
  process.env.DB_NAME || "chemistry_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    pool: {
      max: Number(process.env.DB_POOL_MAX ?? 10),
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      charset: "utf8mb4",
      ...(isSslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    },
  }
);

export type Role = "student" | "staff" | "admin";
export type AccountStatus = "active" | "suspended";
export type ContentStatus = "draft" | "published" | "archived";

// ==========================================
// 1. MOLECULE MODEL
// ==========================================
export interface MoleculeAttributes {
  id: number;
  molecule: string;
  formula: string;
  category: string;
  description?: string | null;
  cid?: number | null;
  iupacName?: string | null;
  molecularWeight?: string | null;
  sdf?: string | null;
  recordType?: string | null;
  atoms: object;
  bonds: object;
  status: ContentStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MoleculeCreationAttributes
  extends Optional<
    MoleculeAttributes,
    | "id"
    | "category"
    | "description"
    | "cid"
    | "iupacName"
    | "molecularWeight"
    | "sdf"
    | "recordType"
    | "status"
    | "createdBy"
    | "updatedBy"
  > {}

export class Molecule
  extends Model<MoleculeAttributes, MoleculeCreationAttributes>
  implements MoleculeAttributes
{
  declare public id: number;
  declare public molecule: string;
  declare public formula: string;
  declare public category: string;
  declare public description: string | null;
  declare public cid: number | null;
  declare public iupacName: string | null;
  declare public molecularWeight: string | null;
  declare public sdf: string | null;
  declare public recordType: string | null;
  declare public atoms: object;
  declare public bonds: object;
  declare public status: ContentStatus;
  declare public createdBy: number | null;
  declare public updatedBy: number | null;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.Molecule) {
  Molecule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      molecule: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: "idx_unique_molecule",
      },
      formula: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "basic",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cid: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      iupacName: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "iupac_name",
      },
      molecularWeight: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "molecular_weight",
      },
      sdf: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      recordType: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "record_type",
      },
      atoms: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      bonds: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "archived"),
        allowNull: false,
        defaultValue: "published",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "created_by",
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "updated_by",
      },
    },
    {
      sequelize,
      modelName: "Molecule",
      tableName: "molecules",
      timestamps: true,
    }
  );
}

// ==========================================
// 2. USER MODEL
// ==========================================
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  institution: string;
  role: Role;
  status: AccountStatus;
  lastLoginAt?: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "id" | "role" | "status" | "lastLoginAt" | "resetToken" | "resetTokenExpiry"
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare public id: number;
  declare public email: string;
  declare public passwordHash: string;
  declare public name: string;
  declare public institution: string;
  declare public role: Role;
  declare public status: AccountStatus;
  declare public lastLoginAt: Date | null;
  declare public resetToken: string | null;
  declare public resetTokenExpiry: Date | null;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.User) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: "idx_unique_user_email",
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      institution: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("student", "staff", "admin"),
        allowNull: false,
        defaultValue: "student",
      },
      status: {
        type: DataTypes.ENUM("active", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login_at",
      },
      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "reset_token",
      },
      resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "reset_token_expiry",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
      timestamps: true,
    }
  );
}

// ==========================================
// 3. REACTION MODEL
// ==========================================
export interface ReactionAttributes {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  reactants: object;
  products: object;
  conditions?: string | null;
  status: ContentStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReactionCreationAttributes
  extends Optional<
    ReactionAttributes,
    "id" | "description" | "category" | "conditions" | "status" | "createdBy" | "updatedBy"
  > {}

export class Reaction
  extends Model<ReactionAttributes, ReactionCreationAttributes>
  implements ReactionAttributes
{
  declare public id: number;
  declare public name: string;
  declare public description: string | null;
  declare public category: string | null;
  declare public reactants: object;
  declare public products: object;
  declare public conditions: string | null;
  declare public status: ContentStatus;
  declare public createdBy: number | null;
  declare public updatedBy: number | null;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.Reaction) {
  Reaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: "idx_unique_reaction_name",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      reactants: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      products: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      conditions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "archived"),
        allowNull: false,
        defaultValue: "published",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "created_by",
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "updated_by",
      },
    },
    {
      sequelize,
      modelName: "Reaction",
      tableName: "reactions",
      timestamps: true,
    }
  );
}

// ==========================================
// 4. CHAPTER MODEL (Quizzes)
// ==========================================
export interface ChapterAttributes {
  id: number;
  class: number;
  chapterNumber: number;
  chapterTitle: string;
  status: ContentStatus;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChapterCreationAttributes
  extends Optional<ChapterAttributes, "id" | "status" | "publishedAt"> {}

export class Chapter
  extends Model<ChapterAttributes, ChapterCreationAttributes>
  implements ChapterAttributes
{
  declare public id: number;
  declare public class: number;
  declare public chapterNumber: number;
  declare public chapterTitle: string;
  declare public status: ContentStatus;
  declare public publishedAt: Date | null;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.Chapter) {
  Chapter.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      class: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { isIn: [[9, 10, 11, 12]] },
      },
      chapterNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "chapter_number",
      },
      chapterTitle: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "chapter_title",
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "archived"),
        allowNull: false,
        defaultValue: "published",
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "published_at",
      },
    },
    {
      sequelize,
      modelName: "Chapter",
      tableName: "chapters",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["class", "chapter_number"],
          name: "unique_class_chapter",
        },
      ],
    }
  );
}

// ==========================================
// 5. QUESTION MODEL (Quizzes)
// ==========================================
export interface QuestionAttributes {
  id: number;
  chapterId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string | null;
  status: ContentStatus;
  imageUrl?: string | null;
  marks: number;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuestionCreationAttributes
  extends Optional<
    QuestionAttributes,
    | "id"
    | "explanation"
    | "difficulty"
    | "topic"
    | "status"
    | "imageUrl"
    | "marks"
    | "createdBy"
    | "updatedBy"
  > {}

export class Question
  extends Model<QuestionAttributes, QuestionCreationAttributes>
  implements QuestionAttributes
{
  declare public id: number;
  declare public chapterId: number;
  declare public questionText: string;
  declare public optionA: string;
  declare public optionB: string;
  declare public optionC: string;
  declare public optionD: string;
  declare public correctOption: "A" | "B" | "C" | "D";
  declare public explanation: string | null;
  declare public difficulty: "easy" | "medium" | "hard";
  declare public topic: string | null;
  declare public status: ContentStatus;
  declare public imageUrl: string | null;
  declare public marks: number;
  declare public createdBy: number | null;
  declare public updatedBy: number | null;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.Question) {
  Question.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chapterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "chapter_id",
      },
      questionText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "question_text",
      },
      optionA: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "option_a",
      },
      optionB: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "option_b",
      },
      optionC: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "option_c",
      },
      optionD: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "option_d",
      },
      correctOption: {
        type: DataTypes.ENUM("A", "B", "C", "D"),
        allowNull: false,
        field: "correct_option",
      },
      explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "explanation",
      },
      difficulty: {
        type: DataTypes.ENUM("easy", "medium", "hard"),
        allowNull: true,
        defaultValue: "medium",
        field: "difficulty",
      },
      topic: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "topic",
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "archived"),
        allowNull: false,
        defaultValue: "published",
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "image_url",
      },
      marks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "created_by",
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "updated_by",
      },
    },
    {
      sequelize,
      modelName: "Question",
      tableName: "questions",
      underscored: true,
      timestamps: true,
    }
  );
}

// ==========================================
// 6. QUIZ ATTEMPT MODEL
// ==========================================
export interface QuizAttemptAttributes {
  id: number;
  userId: number;
  quizId: number;
  chapterId?: number | null;
  chapterName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds?: number | null;
  startedAt?: Date | null;
  marksEarned?: number | null;
  marksTotal?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuizAttemptCreationAttributes
  extends Optional<
    QuizAttemptAttributes,
    "id" | "chapterId" | "percentage" | "timeSpentSeconds" | "startedAt" | "marksEarned" | "marksTotal"
  > {}

export class QuizAttempt
  extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes>
  implements QuizAttemptAttributes
{
  declare public id: number;
  declare public userId: number;
  declare public quizId: number;
  declare public chapterId: number | null;
  declare public chapterName: string;
  declare public score: number;
  declare public totalQuestions: number;
  declare public percentage: number;
  declare public timeSpentSeconds: number | null;
  declare public startedAt: Date | null;
  declare public marksEarned: number | null;
  declare public marksTotal: number | null;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.QuizAttempt) {
  QuizAttempt.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      quizId: { type: DataTypes.INTEGER, allowNull: false, field: "quiz_id" },
      chapterId: { type: DataTypes.INTEGER, allowNull: true, field: "chapter_id" },
      chapterName: { type: DataTypes.STRING(255), allowNull: false, field: "chapter_name" },
      score: { type: DataTypes.INTEGER, allowNull: false },
      totalQuestions: { type: DataTypes.INTEGER, allowNull: false, field: "total_questions" },
      percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      timeSpentSeconds: { type: DataTypes.INTEGER, allowNull: true, field: "time_spent_seconds" },
      startedAt: { type: DataTypes.DATE, allowNull: true, field: "started_at" },
      marksEarned: { type: DataTypes.INTEGER, allowNull: true, field: "marks_earned" },
      marksTotal: { type: DataTypes.INTEGER, allowNull: true, field: "marks_total" },
    },
    {
      sequelize,
      modelName: "QuizAttempt",
      tableName: "quiz_attempts",
      underscored: true,
      timestamps: true,
    }
  );
}

// ==========================================
// 7. QUIZ ATTEMPT ANSWER MODEL
// ==========================================
export interface QuizAttemptAnswerAttributes {
  id: number;
  attemptId: number;
  questionId: number;
  selectedOption: "A" | "B" | "C" | "D" | null;
  isCorrect: boolean;
  createdAt?: Date;
}

interface QuizAttemptAnswerCreationAttributes
  extends Optional<QuizAttemptAnswerAttributes, "id" | "selectedOption"> {}

export class QuizAttemptAnswer
  extends Model<QuizAttemptAnswerAttributes, QuizAttemptAnswerCreationAttributes>
  implements QuizAttemptAnswerAttributes
{
  declare public id: number;
  declare public attemptId: number;
  declare public questionId: number;
  declare public selectedOption: "A" | "B" | "C" | "D" | null;
  declare public isCorrect: boolean;
  declare public readonly createdAt: Date;
}

if (!sequelize.models.QuizAttemptAnswer) {
  QuizAttemptAnswer.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      attemptId: { type: DataTypes.INTEGER, allowNull: false, field: "attempt_id" },
      questionId: { type: DataTypes.INTEGER, allowNull: false, field: "question_id" },
      selectedOption: {
        type: DataTypes.ENUM("A", "B", "C", "D"),
        allowNull: true,
        field: "selected_option",
      },
      isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, field: "is_correct" },
    },
    {
      sequelize,
      modelName: "QuizAttemptAnswer",
      tableName: "quiz_attempt_answers",
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );
}

// ==========================================
// 8. AUDIT LOG MODEL
// ==========================================
export interface AuditLogAttributes {
  id: number;
  userId?: number | null;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: object | null;
  afterState?: object | null;
  ipAddress?: string | null;
  createdAt?: Date;
}

interface AuditLogCreationAttributes
  extends Optional<AuditLogAttributes, "id" | "userId" | "beforeState" | "afterState" | "ipAddress"> {}

export class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare public id: number;
  declare public userId: number | null;
  declare public userEmail: string;
  declare public action: string;
  declare public entityType: string;
  declare public entityId: string;
  declare public beforeState: object | null;
  declare public afterState: object | null;
  declare public ipAddress: string | null;
  declare public readonly createdAt: Date;
}

if (!sequelize.models.AuditLog) {
  AuditLog.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: true, field: "user_id" },
      userEmail: { type: DataTypes.STRING(255), allowNull: false, field: "user_email" },
      action: { type: DataTypes.STRING(50), allowNull: false },
      entityType: { type: DataTypes.STRING(50), allowNull: false, field: "entity_type" },
      entityId: { type: DataTypes.STRING(50), allowNull: false, field: "entity_id" },
      beforeState: { type: DataTypes.JSON, allowNull: true, field: "before_state" },
      afterState: { type: DataTypes.JSON, allowNull: true, field: "after_state" },
      ipAddress: { type: DataTypes.STRING(64), allowNull: true, field: "ip_address" },
    },
    {
      sequelize,
      modelName: "AuditLog",
      tableName: "audit_logs",
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );
}


// ==========================================
// 9. SYSTEM SETTING MODEL
// ==========================================
export interface SystemSettingAttributes {
  key: string;
  value: string;
  updatedAt?: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'updatedAt'> {}

export class SystemSetting
  extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes
{
  declare public key: string;
  declare public value: string;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.SystemSetting) {
  SystemSetting.init(
    {
      key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SystemSetting',
      tableName: 'system_settings',
      timestamps: true,
      createdAt: false,
      updatedAt: true,
      underscored: true,
    }
  );
}

// ==========================================
// SYSTEM SETTING HELPERS
// ==========================================
export async function getSystemSetting(key: string, defaultValue = 'true'): Promise<string> {
  try {
    await ensureDbSynced();
    const row = await SystemSetting.findByPk(key);
    if (!row) return defaultValue;
    return row.value;
  } catch (err) {
    console.warn(`[getSystemSetting] Failed to fetch key '${key}', falling back to default '${defaultValue}':`, err);
    return defaultValue;
  }
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
  await ensureDbSynced();
  await SystemSetting.upsert({ key, value });
}

export async function isStudentRankVisible(): Promise<boolean> {
  const val = await getSystemSetting('show_student_rank', 'true');
  return val === 'true' || val === '1';
}

// ==========================================
// MODEL ASSOCIATIONS
// ==========================================
Chapter.hasMany(Question, { foreignKey: "chapter_id", as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Chapter, { foreignKey: "chapter_id", as: "chapter" });

Chapter.hasMany(QuizAttempt, { foreignKey: "chapter_id", as: "attempts", onDelete: "RESTRICT" });
QuizAttempt.belongsTo(Chapter, { foreignKey: "chapter_id", as: "chapter" });

User.hasMany(QuizAttempt, { foreignKey: "user_id", as: "quizAttempts", onDelete: "CASCADE" });
QuizAttempt.belongsTo(User, { foreignKey: "user_id", as: "user" });

QuizAttempt.hasMany(QuizAttemptAnswer, { foreignKey: "attempt_id", as: "answers", onDelete: "CASCADE" });
QuizAttemptAnswer.belongsTo(QuizAttempt, { foreignKey: "attempt_id", as: "attempt" });

Question.hasMany(QuizAttemptAnswer, { foreignKey: "question_id", as: "attemptAnswers", onDelete: "RESTRICT" });
QuizAttemptAnswer.belongsTo(Question, { foreignKey: "question_id", as: "question" });

User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs", onDelete: "SET NULL" });
AuditLog.belongsTo(User, { foreignKey: "user_id", as: "actor" });

// ==========================================
// SAFE DATABASE CONNECTION (NO RUNTIME SYNC)
// ==========================================
let authPromise: Promise<void> | null = null;

async function initDb(): Promise<void> {
  try {
    await sequelize.authenticate();
    try {
      await SystemSetting.sync();
    } catch (syncErr) {
      console.warn("Could not sync SystemSetting table:", syncErr);
    }
  } catch (err) {
    authPromise = null;
    console.error("Sequelize database authentication failed:", err);
    throw err;
  }
}

export async function ensureDbSynced(): Promise<void> {
  if (!authPromise) {
    authPromise = sequelize
      .authenticate()
      .then(async () => {
        // Authenticated successfully
        try {
          // 1. Ensure all core tables exist in the database
          await User.sync();
          await Molecule.sync();
          await Chapter.sync();
          await Question.sync();
          await Reaction.sync();
          await QuizAttempt.sync();
          await QuizAttemptAnswer.sync();
          await AuditLog.sync();
          await SystemSetting.sync();

          // Auto-migrate missing columns if database was restored from an older backup
          const [userCols]: any = await sequelize.query("SHOW COLUMNS FROM `users` LIKE 'role'");
          if (!userCols || userCols.length === 0) {
            console.log("Adding missing role/status columns to users table...");
            await sequelize.query(`
              ALTER TABLE \`users\`
                ADD COLUMN \`role\` ENUM('student','staff','admin') NOT NULL DEFAULT 'student' AFTER \`institution\`,
                ADD COLUMN \`status\` ENUM('active','suspended') NOT NULL DEFAULT 'active' AFTER \`role\`,
                ADD COLUMN \`last_login_at\` DATETIME NULL AFTER \`status\`;
            `);
            console.log("Users table updated with role & status successfully.");
          }

          // Ensure default admin users exist and are active
          try {
            const salt = crypto.randomBytes(16).toString("hex");
            const hash = crypto.pbkdf2Sync("haider123", salt, 10000, 64, "sha512").toString("hex");
            const haiderPasswordHash = `${salt}:${hash}`;

            const [haiderRows]: any = await sequelize.query(
              "SELECT id, role, status FROM `users` WHERE `email` = 'haider321@gmail.com'"
            );

            if (!haiderRows || haiderRows.length === 0) {
              await sequelize.query(
                "INSERT INTO `users` (`name`, `email`, `password_hash`, `institution`, `role`, `status`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
                {
                  replacements: ["Haider", "haider321@gmail.com", haiderPasswordHash, "ChemCurious", "admin", "active"]
                }
              );
              console.log("Seeded default admin user: haider321@gmail.com");
            } else {
              await sequelize.query(
                "UPDATE `users` SET `role` = 'admin', `status` = 'active', `password_hash` = ? WHERE `email` = 'haider321@gmail.com'",
                {
                  replacements: [haiderPasswordHash]
                }
              );
              console.log("Updated haider321@gmail.com to active admin with password");
            }

            // Also ensure Messum is active admin
            await sequelize.query(
              "UPDATE `users` SET `role` = 'admin', `status` = 'active' WHERE `email` = 'messum321@gmail.com'"
            );
          } catch (adminSeedErr) {
            console.warn("Notice: could not auto-seed admin accounts:", adminSeedErr);
          }

          const [chapCols]: any = await sequelize.query("SHOW COLUMNS FROM `chapters` LIKE 'status'");
          if (!chapCols || chapCols.length === 0) {
            await sequelize.query(`
              ALTER TABLE \`chapters\`
                ADD COLUMN \`status\` ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
                ADD COLUMN \`published_at\` DATETIME NULL,
                ADD COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
            `);
          }

          const [questCols]: any = await sequelize.query("SHOW COLUMNS FROM `questions` LIKE 'status'");
          if (!questCols || questCols.length === 0) {
            await sequelize.query(`
              ALTER TABLE \`questions\`
                ADD COLUMN \`status\` ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
                ADD COLUMN \`image_url\` VARCHAR(500) NULL,
                ADD COLUMN \`marks\` INT NOT NULL DEFAULT 1,
                ADD COLUMN \`created_by\` INT NULL,
                ADD COLUMN \`updated_by\` INT NULL,
                ADD COLUMN \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                MODIFY COLUMN \`option_a\` TEXT NOT NULL,
                MODIFY COLUMN \`option_b\` TEXT NOT NULL,
                MODIFY COLUMN \`option_c\` TEXT NOT NULL,
                MODIFY COLUMN \`option_d\` TEXT NOT NULL;
            `);
          }

          const [reactCols]: any = await sequelize.query("SHOW COLUMNS FROM `reactions` LIKE 'status'");
          if (!reactCols || reactCols.length === 0) {
            await sequelize.query(`
              ALTER TABLE \`reactions\`
                ADD COLUMN \`status\` ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
                ADD COLUMN \`conditions\` TEXT NULL,
                ADD COLUMN \`created_by\` INT NULL,
                ADD COLUMN \`updated_by\` INT NULL;
            `);
          }

          const [molCols]: any = await sequelize.query("SHOW COLUMNS FROM `molecules` LIKE 'status'");
          if (!molCols || molCols.length === 0) {
            await sequelize.query(`
              ALTER TABLE \`molecules\`
                ADD COLUMN \`status\` ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
                ADD COLUMN \`created_by\` INT NULL,
                ADD COLUMN \`updated_by\` INT NULL;
            `);
          }

          const [qaCols]: any = await sequelize.query("SHOW COLUMNS FROM `quiz_attempts` LIKE 'chapter_id'");
          if (!qaCols || qaCols.length === 0) {
            await sequelize.query(`
              ALTER TABLE \`quiz_attempts\`
                ADD COLUMN \`chapter_id\` INT(11) NULL AFTER \`quiz_id\`,
                ADD COLUMN \`time_spent_seconds\` INT(11) NULL AFTER \`percentage\`,
                ADD COLUMN \`started_at\` DATETIME NULL AFTER \`time_spent_seconds\`,
                ADD COLUMN \`marks_earned\` INT(11) NULL AFTER \`started_at\`,
                ADD COLUMN \`marks_total\` INT(11) NULL AFTER \`marks_earned\`;
            `);
            await sequelize.query(`
              UPDATE \`quiz_attempts\` qa
              INNER JOIN \`chapters\` c ON (qa.quiz_id = c.id OR qa.chapter_name = c.chapter_title)
              SET qa.chapter_id = c.id
              WHERE qa.chapter_id IS NULL;
            `);
          }

          await AuditLog.sync();
          await QuizAttemptAnswer.sync();
          await SystemSetting.sync();
        } catch (syncErr) {
          console.warn("Database auto-sync warning:", syncErr);
        }
      })
      .catch((err) => {
        authPromise = null;
        console.error("Sequelize database authentication failed:", err);
        throw err;
      });
  }

  return authPromise;
}

// Lazy DB connection: ensureDbSynced() is invoked by API routes upon actual incoming requests
export { sequelize };
