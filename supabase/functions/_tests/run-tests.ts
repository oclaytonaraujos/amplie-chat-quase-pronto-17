
#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { walk } from "https://deno.land/std@0.168.0/fs/mod.ts";

async function runTests() {
  console.log("🧪 Running Chatbot Backend Tests...\n");

  const testFiles: string[] = [];
  
  // Find all test files
  for await (const entry of walk("./", { 
    exts: [".test.ts"],
    includeDirs: false 
  })) {
    testFiles.push(entry.path);
  }

  if (testFiles.length === 0) {
    console.log("❌ No test files found!");
    return;
  }

  console.log(`Found ${testFiles.length} test files:\n`);
  testFiles.forEach(file => console.log(`  📄 ${file}`));
  console.log("");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const testFile of testFiles) {
    console.log(`\n🔍 Running tests in ${testFile}:`);
    
    try {
      const command = new Deno.Command("deno", {
        args: ["test", "--allow-net", "--allow-env", "--allow-read", testFile],
        stdout: "piped",
        stderr: "piped"
      });

      const { code, stdout, stderr } = await command.output();
      const output = new TextDecoder().decode(stdout);
      const errorOutput = new TextDecoder().decode(stderr);

      if (code === 0) {
        console.log("✅ All tests passed!");
        
        // Count tests from output
        const testMatches = output.match(/ok \d+ tests?/g);
        if (testMatches) {
          const testsInFile = parseInt(testMatches[0].match(/\d+/)?.[0] || "0");
          totalTests += testsInFile;
          passedTests += testsInFile;
        }
      } else {
        console.log("❌ Some tests failed!");
        console.log(output);
        console.log(errorOutput);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ Error running tests: ${error.message}`);
      failedTests++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total test files: ${testFiles.length}`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
  console.log("=".repeat(50));

  if (failedTests === 0) {
    console.log("\n🎉 All tests passed! Your chatbot backend is ready to go!");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await runTests();
}
