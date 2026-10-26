import dotenv from "dotenv";
import path from "path";
import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// Load environment variables from .env.local before Sequelize initialization
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Sequelize connection using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || "chemistry_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    logging: false,
  }
);

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
  createdAt?: Date;
  updatedAt?: Date;
}

interface MoleculeCreationAttributes
  extends Optional<
    MoleculeAttributes,
    "id" | "category" | "description" | "cid" | "iupacName" | "molecularWeight" | "sdf" | "recordType"
  > {}

export class Molecule extends Model<MoleculeAttributes, MoleculeCreationAttributes> implements MoleculeAttributes {
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
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "resetToken" | "resetTokenExpiry"> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: number;
  declare public email: string;
  declare public passwordHash: string;
  declare public name: string;
  declare public institution: string;
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
  reactants: object;
  products: object;
  createdAt?: Date;
  updatedAt?: Date;
  category?: string | null;
}

interface ReactionCreationAttributes extends Optional<ReactionAttributes, "id" | "description"> {}

export class Reaction extends Model<ReactionAttributes, ReactionCreationAttributes> implements ReactionAttributes {
  declare public id: number;
  declare public name: string;
  declare public description: string | null;
  declare public category: string | null;
  declare public reactants: object;
  declare public products: object;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

export interface QuizAttemptAttributes {
  id: number;
  userId: number;
  quizId: number;
  chapterName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuizAttemptCreationAttributes extends Optional<QuizAttemptAttributes, "id" | "percentage"> {}

export class QuizAttempt extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes> implements QuizAttemptAttributes {
  declare public id: number;
  declare public userId: number;
  declare public quizId: number;
  declare public chapterName: string;
  declare public score: number;
  declare public totalQuestions: number;
  declare public percentage: number;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

if (!sequelize.models.QuizAttempt) {
  QuizAttempt.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
      quizId: { type: DataTypes.INTEGER, allowNull: false, field: "quiz_id" },
      chapterName: { type: DataTypes.STRING(255), allowNull: false, field: "chapter_name" },
      score: { type: DataTypes.INTEGER, allowNull: false },
      totalQuestions: { type: DataTypes.INTEGER, allowNull: false, field: "total_questions" },
      percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    },
    { sequelize, modelName: "QuizAttempt", tableName: "quiz_attempts", underscored: true, timestamps: true }
  );
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
  createdAt?: Date;
}

interface ChapterCreationAttributes extends Optional<ChapterAttributes, "id"> {}

export class Chapter extends Model<ChapterAttributes, ChapterCreationAttributes> implements ChapterAttributes {
  declare public id: number;
  declare public class: number;
  declare public chapterNumber: number;
  declare public chapterTitle: string;
  declare public readonly createdAt: Date;
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
    },
    {
      sequelize,
      modelName: "Chapter",
      tableName: "chapters",
      underscored: true,
      updatedAt: false,
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
  createdAt?: Date;
}

interface QuestionCreationAttributes extends Optional<QuestionAttributes, "id" | "explanation" | "difficulty" | "topic"> {}

export class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
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
  declare public readonly createdAt: Date;
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
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "option_a",
      },
      optionB: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "option_b",
      },
      optionC: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "option_c",
      },
      optionD: {
        type: DataTypes.STRING(255),
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
    },
    {
      sequelize,
      modelName: "Question",
      tableName: "questions",
      underscored: true,
      updatedAt: false,
    }
  );
}

// Set up associations
Chapter.hasMany(Question, { foreignKey: "chapter_id", onDelete: "CASCADE" });
Question.belongsTo(Chapter, { foreignKey: "chapter_id" });

// ==========================================
// DATABASE ASSOCIATION & SYNC
// ==========================================
let syncPromise: Promise<void> | null = null;

export async function ensureDbSynced(): Promise<void> {
  if (!syncPromise) {
    syncPromise = sequelize
      .sync({ alter: true })
      .then(() => {
        console.log("MySQL Database synced successfully via Sequelize!");
      })
      .catch((err) => {
        syncPromise = null;
        console.error("Sequelize sync failed:", err);
        throw err;
      });
  }

  return syncPromise;
}

void ensureDbSynced();

export { sequelize };