import { Github, Linkedin, Mail, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center gap-4 mb-4">
          <a href="https://github.com/sharon17kevin" className="hover:text-emerald-300 transition-colors">
            {<Github size={20}/>}
          </a>
          <a href="https://www.linkedin.com/in/sharon-kevin-anyanwu-8b8b0929a/" className="hover:text-emerald-300 transition-colors">
            {<Linkedin size={20}/>}
          </a>
          <a href="https://x.com/Sharonkvn" className="hover:text-emerald-300 transition-colors">
            {<Twitter size={20}/>}
          </a>
          <a href="#" className="hover:text-emerald-300 transition-colors">
            {<Mail size={20}/> }
          </a>
        </div>
        <p className="text-emerald-200 text-sm md:text-lg">
          © 2025 Anyanwu Sharon-Kevin Chukwuemeka. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
