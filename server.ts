import express from "express";
import path from "path";
import fs from "fs";
import { execSync, exec } from "child_process";
import { createServer as createViteServer } from "vite";

// Automatically try to install python dependencies on startup
function ensurePythonDependencies() {
  const logFile = path.join(process.cwd(), "pip_install.log");
  fs.writeFileSync(logFile, "Starting Python dependency installation...\n", "utf8");

  try {
    console.log("Checking Python environment...");
    const pyVersion = execSync("python3 --version").toString().trim();
    fs.appendFileSync(logFile, `Python version: ${pyVersion}\n`, "utf8");
    
    try {
      execSync("python3 -c 'import docx, matplotlib'", { stdio: "ignore" });
      console.log("✅ python-docx and matplotlib are already installed.");
      fs.appendFileSync(logFile, "✅ python-docx and matplotlib are already installed.\n", "utf8");
      return;
    } catch (e) {
      fs.appendFileSync(logFile, "Dependencies missing, attempting installation...\n", "utf8");
    }

    // Attempt 1: python3 -m pip install with --break-system-packages
    try {
      console.log("Trying: python3 -m pip install --break-system-packages python-docx matplotlib");
      fs.appendFileSync(logFile, "Running: python3 -m pip install --break-system-packages python-docx matplotlib\n", "utf8");
      const out = execSync("python3 -m pip install --break-system-packages python-docx matplotlib 2>&1");
      fs.appendFileSync(logFile, out.toString() + "\n", "utf8");
      console.log("✅ Installed successfully via Attempt 1!");
      return;
    } catch (err1: any) {
      fs.appendFileSync(logFile, `Attempt 1 failed: ${err1.message}\n${err1.stdout || ""}\n${err1.stderr || ""}\n`, "utf8");
    }

    // Attempt 2: pip3 install with --break-system-packages
    try {
      console.log("Trying: pip3 install --break-system-packages python-docx matplotlib");
      fs.appendFileSync(logFile, "Running: pip3 install --break-system-packages python-docx matplotlib\n", "utf8");
      const out = execSync("pip3 install --break-system-packages python-docx matplotlib 2>&1");
      fs.appendFileSync(logFile, out.toString() + "\n", "utf8");
      console.log("✅ Installed successfully via Attempt 2!");
      return;
    } catch (err2: any) {
      fs.appendFileSync(logFile, `Attempt 2 failed: ${err2.message}\n${err2.stdout || ""}\n${err2.stderr || ""}\n`, "utf8");
    }

    // Attempt 3: python3 -m pip install
    try {
      console.log("Trying: python3 -m pip install python-docx matplotlib");
      fs.appendFileSync(logFile, "Running: python3 -m pip install python-docx matplotlib\n", "utf8");
      const out = execSync("python3 -m pip install python-docx matplotlib 2>&1");
      fs.appendFileSync(logFile, out.toString() + "\n", "utf8");
      console.log("✅ Installed successfully via Attempt 3!");
      return;
    } catch (err3: any) {
      fs.appendFileSync(logFile, `Attempt 3 failed: ${err3.message}\n${err3.stdout || ""}\n${err3.stderr || ""}\n`, "utf8");
    }

    // Attempt 4: pip3 install
    try {
      console.log("Trying: pip3 install python-docx matplotlib");
      fs.appendFileSync(logFile, "Running: pip3 install python-docx matplotlib\n", "utf8");
      const out = execSync("pip3 install python-docx matplotlib 2>&1");
      fs.appendFileSync(logFile, out.toString() + "\n", "utf8");
      console.log("✅ Installed successfully via Attempt 4!");
      return;
    } catch (err4: any) {
      fs.appendFileSync(logFile, `Attempt 4 failed: ${err4.message}\n${err4.stdout || ""}\n${err4.stderr || ""}\n`, "utf8");
    }

    console.error("❌ All Python dependency installation attempts failed! See pip_install.log for details.");
  } catch (err: any) {
    console.warn("⚠️ Warning checking Python:", err);
    fs.appendFileSync(logFile, `Fatal warning in python check: ${err.message}\n`, "utf8");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Route: Check Server Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Export to DOCX
  app.post("/api/export-docx", async (req, res) => {
    const { data, results } = req.body;
    if (!data || !results) {
      return res.status(400).json({ error: "Missing data or results in payload" });
    }

    const uniqueId = Date.now() + "_" + Math.floor(Math.random() * 1000);
    const tempInputPath = path.join(process.cwd(), `temp_input_${uniqueId}.json`);
    const tempOutputPath = path.join(process.cwd(), `output_${uniqueId}.docx`);

    try {
      // Write payload to temp file
      fs.writeFileSync(tempInputPath, JSON.stringify({ data, results }, null, 2), "utf8");

      // Execute Python generator
      console.log(`Running generate_docx.py with input: ${tempInputPath}`);
      try {
        execSync(`python3 generate_docx.py "${tempInputPath}" "${tempOutputPath}"`, { stdio: ["ignore", "pipe", "pipe"] });
      } catch (execErr: any) {
        const stdout = execErr.stdout ? execErr.stdout.toString() : "";
        const stderr = execErr.stderr ? execErr.stderr.toString() : "";
        console.error("Python script execution failed!");
        console.error("STDOUT:", stdout);
        console.error("STDERR:", stderr);
        throw new Error(`Python generation failed: ${stderr || execErr.message}`);
      }

      if (!fs.existsSync(tempOutputPath)) {
        throw new Error("Output DOCX file was not generated by Python script");
      }

      // Safe filename format
      const sanitizedName = (data.name || "startup_report")
        .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, "_")
        .substring(0, 50);

      // Send the file as download
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(sanitizedName)}_SSI_Report.docx`);
      
      const fileStream = fs.createReadStream(tempOutputPath);
      fileStream.pipe(res);

      // Clean up after stream finishes
      fileStream.on("end", () => {
        try {
          if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        } catch (cleanupErr) {
          console.error("Error cleaning up temp files:", cleanupErr);
        }
      });

    } catch (error: any) {
      console.error("DOCX export error:", error);
      
      // Clean up on failure
      try {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
      } catch (cleanupErr) {
        // ignore
      }

      res.status(500).json({ 
        error: "Failed to generate DOCX file", 
        details: error.message || error 
      });
    }
  });

  // Ensure python-docx is ready
  ensurePythonDependencies();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode (Vite Middleware)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode (Static files)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
