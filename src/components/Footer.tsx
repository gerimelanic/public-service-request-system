import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { COUNTY_CONTACT } from '@/lib/constants';

export async function Footer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <footer className="w-full bg-[#1A1A1A] text-zinc-300 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6">
        <div className={isAdmin ? 'mb-8' : 'grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'}>
          {/* Col 1: County Branding (Info kept on the bottom left) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 rounded-full bg-white p-0.5 overflow-hidden border border-[#D4A017]">
                <Image
                  src="/images/muranga-logo.webp"
                  alt="Muranga County Government Logo"
                  fill
                  unoptimized
                  className="object-contain p-0.5"
                />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-sm block">
                  Murang&apos;a County
                </span>
                <span className="text-[11px] text-[#D4A017] font-semibold tracking-wide uppercase block">
                  {isAdmin ? 'Admin Portal' : 'Public Service Portal'}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Official public service request and incident tracking system for Murang&apos;a County citizens and administration.
            </p>
          </div>

          {/* Quick Links and County Contacts are hidden in the Admin Portal */}
          {!isAdmin && (
            <>
              {/* Col 2: Citizen Services Quick Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Quick Links
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  <li>
                    <Link href="/" className="hover:text-[#D4A017] transition-colors">
                      Home Page
                    </Link>
                  </li>
                  <li>
                    <Link href="/requests/new" className="hover:text-[#D4A017] transition-colors">
                      Submit Service Request
                    </Link>
                  </li>
                  <li>
                    <Link href="/requests" className="hover:text-[#D4A017] transition-colors">
                      Track My Requests
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 3: Verified County Contact Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  County Contacts
                </h4>
                <ul className="space-y-2 text-xs text-zinc-400">
                  <li className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                    <span>{COUNTY_CONTACT.location}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                    <span>{COUNTY_CONTACT.postal}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                    <a
                      href={`tel:${COUNTY_CONTACT.phone.replace(/[\s-]/g, '')}`}
                      className="hover:text-white transition-colors"
                    >
                      {COUNTY_CONTACT.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                    <a
                      href={`mailto:${COUNTY_CONTACT.email}`}
                      className="hover:text-white transition-colors"
                    >
                      {COUNTY_CONTACT.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                    <span>{COUNTY_CONTACT.hours}</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Bottom copyright & Demo disclaimer note */}
        <div className="border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Murang&apos;a County Government. All rights reserved.</p>
          <p className="text-zinc-400 text-center sm:text-right italic">
            Demo project for assessment purposes, not an official county service.
          </p>
        </div>
      </div>
    </footer>
  );
}
