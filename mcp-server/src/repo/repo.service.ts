import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface McpConfig {
  rootDir: string;
  ignore?: string[];
  maxFileSizeKb: number;
}

@Injectable()
export class RepoService implements OnModuleInit {
  private readonly logger = new Logger(RepoService.name);
  private repoContext: string = '';
  private fileCache: Map<string, string> = new Map();
  private config: McpConfig | null = null;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async onModuleInit() {
    await this.reindex();
  }

  public getRepoContext(): string {
    return this.repoContext;
  }

  public getFile(relativePath: string): string {
    return this.fileCache.get(relativePath) || '';
  }

  public async reindex(): Promise<void> {
    this.logger.log('Starting repository indexing...');
    this.repoContext = '';
    this.fileCache.clear();

    const configPath = path.join(this.projectRoot, 'mcp.config.json');
    if (!fs.existsSync(configPath)) {
      this.logger.warn(`Config file not found at ${configPath}`);
      return;
    }

    try {
      const configRaw = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configRaw) as McpConfig;
    } catch (error) {
      this.logger.error('Failed to parse mcp.config.json', error);
      return;
    }

    if (!this.config || !this.config.rootDir) {
      this.logger.warn(`Invalid config: rootDir missing`);
      return;
    }

    const rootDir = path.resolve(this.projectRoot, this.config.rootDir);
    if (!fs.existsSync(rootDir)) {
      this.logger.warn(`Root dir not found: ${rootDir}`);
      return;
    }

    const defaultIgnore = ['node_modules', '.git', 'dist'];
    const customIgnore = this.config.ignore || [];
    const ignorePatterns = [...defaultIgnore, ...customIgnore];

    const contextLines: string[] = [];
    const maxFileSizeKb = this.config.maxFileSizeKb || 1024;

    this.walkDir(rootDir, rootDir, ignorePatterns, maxFileSizeKb, contextLines);

    this.repoContext = contextLines.join('\n');
    this.logger.log(`Repository indexing completed. Parsed ${this.fileCache.size} files.`);
  }

  private walkDir(
    currentDir: string,
    baseDir: string,
    ignorePatterns: string[],
    maxFileSizeKb: number,
    contextLines: string[]
  ) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(currentDir);
    } catch (err) {
      this.logger.warn(`Could not read directory ${currentDir}`);
      return;
    }

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const normalizedPath = fullPath.replace(/\\/g, '/');
      const isIgnored = ignorePatterns.some(pattern => {
         return file === pattern || normalizedPath.includes(`/${pattern}/`) || normalizedPath.endsWith(`/${pattern}`);
      });
      
      if (isIgnored) continue;

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          this.walkDir(fullPath, baseDir, ignorePatterns, maxFileSizeKb, contextLines);
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (['.ts', '.js', '.py', '.go'].includes(ext)) {
            const fileSizeKb = stat.size / 1024;
            if (fileSizeKb <= maxFileSizeKb) {
              this.processFile(fullPath, baseDir, contextLines);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Could not stat ${fullPath}`);
      }
    }
  }

  private processFile(fullPath: string, baseDir: string, contextLines: string[]) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      
      this.fileCache.set(relativePath, content);

      const exportsList = this.extractExports(content);
      const importsList = this.extractImports(content);

      const exportsStr = exportsList.length > 0 ? exportsList.join(',') : '';
      const importsStr = importsList.length > 0 ? importsList.join(',') : '';

      contextLines.push(`File ${relativePath}: exports ${exportsStr || 'none'} imports ${importsStr || 'none'}`);
    } catch (error) {
      this.logger.error(`Failed to process file ${fullPath}`, error);
    }
  }

  private extractExports(content: string): string[] {
    const exportsList: string[] = [];
    const exportRegex = /export\s+(class|function|const)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exportsList.push(match[2]);
    }
    return [...new Set(exportsList)];
  }

  private extractImports(content: string): string[] {
    const importsList: string[] = [];
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      importsList.push(match[1]);
    }
    return [...new Set(importsList)];
  }
}
