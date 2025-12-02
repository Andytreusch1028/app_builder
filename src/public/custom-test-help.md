# 🧪 Custom File Operation Test - Help Guide

## What Is This?

The **Custom File Operation Test** lets you test the AI agent's ability to understand your instructions and perform file operations.

Think of it as a **practice area** where you can try different tasks and see how the agent responds.

---

## What Can The Agent Do?

The agent can perform these file operations:

✅ **Create files** - Make new text, JSON, TypeScript, or other files  
✅ **Read files** - Read content from existing files  
✅ **Modify files** - Change content in existing files  
✅ **List files** - Show files in a directory  

---

## What Can't The Agent Do?

❌ **Run code** - The agent cannot execute programs  
❌ **Create interactive apps** - It can create the code files, but not run them  
❌ **Open browsers** - It cannot launch or interact with web browsers  
❌ **Install software** - It cannot install packages or dependencies  

---

## Why Is This Useful?

### **1. Learn What Works**

Try different ways of asking for the same thing:

**Example:**
```
❌ "Make a file"
   → Too vague, agent might be confused

✅ "Create a file called notes.txt with the text Hello World"
   → Clear and specific, agent knows exactly what to do
```

### **2. Test Before Building**

Before using the agent for real work, test if it understands your style:

**Example:**
```
Test: "Create a TypeScript interface for a User with name and email"

If this works well → You can trust the agent with similar tasks
If this fails → You know to be more specific in your instructions
```

### **3. Experiment Safely**

Try complex tasks without risk:

**Example:**
```
Test: "Create 3 JSON files with sample user data"

This helps you understand:
- Can the agent handle multiple files?
- Does it format JSON correctly?
- Does it understand "sample data"?
```

### **4. Debug Issues**

If something goes wrong, use this to isolate the problem:

**Example:**
```
Problem: Agent failed to create a React component

Debug Tests:
1. "Create a file called test.txt with Hello" → Works?
2. "Create a file called test.tsx with a function" → Works?
3. "Create a React component file" → Fails here?

Now you know the issue is with React-specific instructions!
```

---

## 📝 Good Examples

### **Simple File Creation**
```
✅ "Create a file called shopping-list.txt with milk, eggs, bread"
✅ "Create a file named config.json with an empty object"
✅ "Create a README.md file with a project description"
```

### **Structured Data**
```
✅ "Create a JSON file with 5 sample products including name and price"
✅ "Create a TypeScript interface for a Product with id, name, and price"
✅ "Create a CSV file with user data: name, email, age"
```

### **Multiple Files**
```
✅ "Create 3 text files named file1.txt, file2.txt, file3.txt with different content"
✅ "Create a package.json and tsconfig.json for a Node.js project"
```

### **Code Files**
```
✅ "Create a TypeScript function that adds two numbers"
✅ "Create a React component for a button"
✅ "Create a utility function for formatting dates"
```

---

## ❌ Bad Examples (These Will Fail)

### **Too Vague**
```
❌ "Make a file"
   → What file? What content?

❌ "Create something useful"
   → Agent doesn't know what you need
```

### **Asking To Run Code**
```
❌ "Create a calculator app and run it"
   → Agent can create the file, but cannot run it

❌ "Build a Tetris game and show it in the browser"
   → Agent can create the code, but cannot execute it
```

### **Asking For Impossible Tasks**
```
❌ "Install React"
   → Agent cannot install packages

❌ "Deploy this to production"
   → Agent cannot deploy code
```

---

## 💡 Pro Tips

### **Tip 1: Be Specific**
```
Instead of: "Create a config file"
Try: "Create a config.json file with database settings"
```

### **Tip 2: Provide Examples**
```
Instead of: "Create sample data"
Try: "Create a JSON file with 3 users, each with name, email, and age"
```

### **Tip 3: Break Down Complex Tasks**
```
Instead of: "Create a full authentication system"
Try: 
  1. "Create a User interface with email and password"
  2. "Create a login function"
  3. "Create a validation utility"
```

### **Tip 4: Test Incrementally**
```
Start simple: "Create a file called test.txt with Hello"
Then add complexity: "Create a JSON file with user data"
Then go advanced: "Create a TypeScript interface for a User"
```

---

## 🎯 Quick Reference

| I Want To... | Example Test |
|--------------|--------------|
| **Test basic file creation** | "Create a file called test.txt with Hello World" |
| **Test JSON handling** | "Create a JSON file with sample user data" |
| **Test TypeScript** | "Create a TypeScript interface for a Product" |
| **Test multiple files** | "Create 3 files named file1, file2, file3" |
| **Test code generation** | "Create a function that adds two numbers" |
| **Test React components** | "Create a React button component" |

---

## ❓ Still Confused?

**Remember:** The agent is like a **smart file assistant**. It can:
- ✅ Create files with content you describe
- ✅ Understand what kind of file you need (JSON, TypeScript, etc.)
- ✅ Generate code based on your description

But it **cannot**:
- ❌ Run or execute the code it creates
- ❌ Install software or packages
- ❌ Interact with browsers or applications

**Think of it this way:** The agent is a chef that can prepare a meal (create files), but cannot eat it for you (run the code).

---

## 🚀 Ready To Try?

Start with something simple:
```
"Create a file called hello.txt with Hello, World!"
```

Then try something more complex:
```
"Create a TypeScript interface for a User with name, email, and age properties"
```

Have fun experimenting! 🎉

