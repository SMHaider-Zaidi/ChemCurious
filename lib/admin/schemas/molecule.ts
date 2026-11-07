import { z } from 'zod';
import { contentStatusSchema } from './chapter';

export const ELEMENTS = [
  'H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca',
  'Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr',
  'Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd',
  'Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg',
  'Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm',
  'Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og',
];

export const isElement = (s: string) => ELEMENTS.includes(s.trim());

export const atomSchema = z.object({
  element: z.string().trim().refine(isElement, { message: 'Must be a valid periodic table element symbol' }),
  x: z.coerce.number({ invalid_type_error: 'X coordinate must be a number' }).refine(Number.isFinite, 'X must be finite'),
  y: z.coerce.number({ invalid_type_error: 'Y coordinate must be a number' }).refine(Number.isFinite, 'Y must be finite'),
  z: z.coerce.number({ invalid_type_error: 'Z coordinate must be a number' }).refine(Number.isFinite, 'Z must be finite'),
});

export const bondSchema = z.object({
  source: z.coerce.number().int().min(0, 'Source index must be >= 0'),
  target: z.coerce.number().int().min(0, 'Target index must be >= 0'),
  order: z.coerce.number().int().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])),
});

export const moleculeInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Molecule name is required').max(120, 'Name cannot exceed 120 characters'),
    formula: z
      .string()
      .trim()
      .min(1, 'Chemical formula is required')
      .regex(/^[A-Za-z0-9()[\]+\-·.]+$/, 'Use letters, numbers, and basic brackets/signs only'),
    category: z.string().trim().min(1, 'Category is required').max(60, 'Category cannot exceed 60 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').default(''),
    atoms: z.array(atomSchema).min(1, 'Add at least one atom to the molecule'),
    bonds: z.array(bondSchema).default([]),
    status: contentStatusSchema.default('draft'),
  })
  .superRefine((data, ctx) => {
    const numAtoms = data.atoms.length;
    data.bonds.forEach((bond, idx) => {
      if (bond.source >= numAtoms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bonds', idx, 'source'],
          message: `Source index ${bond.source} is out of range (total atoms: ${numAtoms})`,
        });
      }
      if (bond.target >= numAtoms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bonds', idx, 'target'],
          message: `Target index ${bond.target} is out of range (total atoms: ${numAtoms})`,
        });
      }
      if (bond.source === bond.target) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bonds', idx, 'target'],
          message: 'Bond source and target cannot be the same atom',
        });
      }
    });
  });

export type MoleculeFormValues = z.infer<typeof moleculeInputSchema>;
